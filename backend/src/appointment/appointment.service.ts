import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';


@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.appointment.create({
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
      orderBy: { appointmentDate: 'asc' }
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
      orderBy: { session: 'asc' }
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