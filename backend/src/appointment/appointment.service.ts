import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { sendWhatsappTemplateMessage } from '../common/whatsapp.util';


@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  private normalizeToDateOnly(value: Date | string): number {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  private toDateOnly(value: Date | string): Date {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private async assertDoctorAvailableOnDate(doctorId: number, date: Date | string) {
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date: this.toDateOnly(date),
        },
      },
    });

    if (schedule && !schedule.isAvailable) {
      throw new BadRequestException('Doctor is not available on this date.');
    }
  }

  private async findLatestActiveReceptionistFollowup(patientId: number, maxAppointmentDate: Date) {
    return this.prisma.receptionistFollowup.findFirst({
      where: {
        patientId,
        status: {
          notIn: ['Completed', 'Closed', 'Cancelled', 'Canceled'],
        },
        followupDate: {
          not: null,
        },
        consultation: {
          consultationDate: {
            lt: maxAppointmentDate,
          },
        },
      },
      orderBy: [
        { followupDate: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        consultation: true,
      },
    });
  }

  private async completeLatestActiveFollowupForBooking(patientId: number, newAppointmentDate: Date | string) {
    const appointmentDay = this.normalizeToDateOnly(newAppointmentDate);
    const appointmentDateObj = new Date(newAppointmentDate);
    const followup = await this.findLatestActiveReceptionistFollowup(patientId, appointmentDateObj);
    if (!followup?.followupDate) {
      return;
    }

    const nextVisitDate = followup.followupDate;
    const followupDay = this.normalizeToDateOnly(nextVisitDate);

    if (appointmentDay < followupDay) {
      await this.prisma.receptionistFollowup.update({
        where: { id: followup.id },
        data: {
          status: 'Completed',
          completedAt: new Date(),
          closedAt: new Date(),
        },
      });
    }
  }

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createAppointmentDto.patientId }
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${createAppointmentDto.patientId} not found`);
    }

    // Check if doctor exists (if provided)
    if (createAppointmentDto.doctorId) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: createAppointmentDto.doctorId },
        include: { user: true }
      });

      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${createAppointmentDto.doctorId} not found`);
      }

      // Check if doctor is available
      if (doctor.status !== 'Available') {
        throw new BadRequestException('Selected doctor is not available');
      }

      // Check date-wise schedule
      await this.assertDoctorAvailableOnDate(
        createAppointmentDto.doctorId,
        createAppointmentDto.appointmentDate,
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: createAppointmentDto.patientId,
        doctorId: createAppointmentDto.doctorId,
        appointmentDate: new Date(createAppointmentDto.appointmentDate),
        appointmentType: createAppointmentDto.appointmentType,
        session: createAppointmentDto.session || 'FN',
        status: createAppointmentDto.status || 'Scheduled',
        notes: createAppointmentDto.notes || ''
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        }
      }
    });

    // Automatically close the latest pending receptionist follow-up
    await this.completeLatestActiveFollowupForBooking(
      createAppointmentDto.patientId,
      createAppointmentDto.appointmentDate,
    );

    // Send WhatsApp Confirmation (only for booked appointments, not waiting/save-to-waiting)
    const appointmentStatus = (appointment.status || '').toLowerCase();
    if (appointment.patient?.phone && appointmentStatus !== 'waiting') {
      // Run asynchronously without waiting for it to finish to avoid blocking the API response
      // Format date
      const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-GB'); // DD/MM/YYYY
      const doctorName = appointment.doctor?.user?.fullName || 'Duty Doctor';

      sendWhatsappTemplateMessage(
        appointment.patient.whatsapp || appointment.patient.phone,
        'manthrayala_appointment_confirmation',
        [
          appointment.patient.name,      // {{1}} Name
          appointmentDate,               // {{2}} Date
          appointment.session || 'FN',   // {{3}} Time/Session
          appointment.appointmentType || 'Consultation', // {{4}} Consultation Type
          doctorName                     // {{5}} Doctor
        ],
        'en'
      ).catch(err => console.error('Failed to send WA confirmation:', err));
    }

    return appointment;
  }

  async findAll(page?: number, pageSize?: number, date?: string, options: { search?: string; appointmentType?: string; doctorId?: number; from?: string; to?: string } = {}) {
    const wherePrisma: any = {};

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      wherePrisma.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (options.from || options.to) {
      const range: any = {};
      if (options.from) {
        const from = new Date(options.from);
        from.setHours(0, 0, 0, 0);
        range.gte = from;
      }
      if (options.to) {
        const to = new Date(options.to);
        to.setHours(23, 59, 59, 999);
        range.lte = to;
      }
      wherePrisma.appointmentDate = range;
    }

    if (options.doctorId) {
      wherePrisma.doctorId = Number(options.doctorId);
    }

    if (options.appointmentType) {
      wherePrisma.appointmentType = {
        contains: options.appointmentType,
        mode: 'insensitive',
      };
    }

    if (options.search && options.search.trim()) {
      const term = options.search.trim();
      wherePrisma.patient = {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term } },
          { whatsapp: { contains: term } },
        ],
      };
    }

    const include = {
      patient: true,
      doctor: {
        include: {
          user: true
        }
      }
    };

    // Without pagination params, keep legacy behavior: return the full array
    if (page === undefined && pageSize === undefined) {
      return this.prisma.appointment.findMany({
        where: wherePrisma,
        include,
        orderBy: { appointmentDate: 'desc' }
      });
    }

    const take = pageSize ? Math.max(1, Number(pageSize)) : undefined;
    const safePage = page ? Math.max(1, Number(page)) : 1;
    const skip = take ? (safePage - 1) * take : undefined;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where: wherePrisma,
        include,
        orderBy: { appointmentDate: 'desc' },
        skip,
        take,
      }),
      this.prisma.appointment.count({ where: wherePrisma }),
    ]);

    return {
      data,
      pagination: {
        page: safePage,
        pageSize: take ?? total,
        total,
        totalPages: Math.max(1, Math.ceil(total / (take ?? Math.max(total, 1)))),
      },
    };
  }

  async findOne(id: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        }
      }
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async findByPatient(patientId: number) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    });
  }

  async findByDoctor(doctorId: number) {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        }
      },
      // Ensure appointments for a doctor are ordered FIFO for their queue
      orderBy: [
        { appointmentDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });
  }

  async findByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        }
      },
      // Return appointments in FIFO order: earliest created appointments first.
      // Session ordering is not FIFO for waiting lists, so we order by `createdAt`.
      orderBy: [
        { createdAt: 'asc' },
        { appointmentDate: 'asc' }
      ]
    });
  }

  async updateStatus(id: number, updateStatusDto: UpdateStatusDto) {
    const existing = await this.findOne(id); // Check if exists

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: { status: updateStatusDto.status },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        }
      }
    });

    // Send WhatsApp confirmation when a waiting appointment is confirmed (booked)
    const prevStatus = (existing.status || '').toLowerCase();
    const newStatus = (updateStatusDto.status || '').toLowerCase();
    const wasWaitlisted = prevStatus === 'waiting';
    const isNowBooked = newStatus === 'scheduled' || newStatus === 'confirmed' || newStatus === 'booked';
    if (wasWaitlisted && isNowBooked && appointment.patient?.phone) {
      const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-GB');
      const doctorName = appointment.doctor?.user?.fullName || 'Duty Doctor';

      sendWhatsappTemplateMessage(
        appointment.patient.whatsapp || appointment.patient.phone,
        'manthrayala_appointment_confirmation',
        [
          appointment.patient.name,
          appointmentDate,
          appointment.session || 'FN',
          appointment.appointmentType || 'Consultation',
          doctorName
        ],
        'en'
      ).catch(err => console.error('Failed to send WA confirmation:', err));
    }

    return appointment;
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    const existing = await this.findOne(id); // Check if exists

    const effectiveDoctorId = updateAppointmentDto.doctorId ?? existing.doctorId;
    const effectiveDate = updateAppointmentDto.appointmentDate ?? existing.appointmentDate;

    if (effectiveDoctorId) {
      await this.assertDoctorAvailableOnDate(effectiveDoctorId, effectiveDate);
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        doctorId: updateAppointmentDto.doctorId,
        appointmentDate: updateAppointmentDto.appointmentDate 
          ? new Date(updateAppointmentDto.appointmentDate) 
          : undefined,
        appointmentType: updateAppointmentDto.appointmentType,
        session: updateAppointmentDto.session,
        notes: updateAppointmentDto.notes
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return this.prisma.appointment.delete({
      where: { id }
    });
  }
}