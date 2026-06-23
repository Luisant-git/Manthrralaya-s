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

    // Send WhatsApp Confirmation
    if (appointment.patient?.phone) {
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

  async findAll() {
    return this.prisma.appointment.findMany({
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
    await this.findOne(id); // Check if exists

    return this.prisma.appointment.update({
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
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    await this.findOne(id); // Check if exists

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