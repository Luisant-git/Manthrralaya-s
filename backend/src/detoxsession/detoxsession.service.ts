import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDetoxsessionDto } from './dto/create-detoxsession.dto';
import { UpdateDetoxsessionDto } from './dto/update-detoxsession.dto';

@Injectable()
export class DetoxsessionService {
  constructor(private prisma: PrismaService) {}

  async create(createDetoxsessionDto: CreateDetoxsessionDto) {
    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createDetoxsessionDto.patientId }
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${createDetoxsessionDto.patientId} not found`);
    }

    // Check if doctor exists (if provided)
    if (createDetoxsessionDto.doctorId) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: createDetoxsessionDto.doctorId }
      });
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${createDetoxsessionDto.doctorId} not found`);
      }
    }

    // Check if appointment already has a detox session
    if (createDetoxsessionDto.appointmentId) {
      const existingDetoxForAppointment = await this.prisma.detoxSession.findFirst({
        where: { appointmentId: createDetoxsessionDto.appointmentId }
      });
      
      if (existingDetoxForAppointment) {
        throw new BadRequestException('This appointment already has a detox session');
      }
    }

    // If appointmentId is provided, check if appointment exists
    if (createDetoxsessionDto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: createDetoxsessionDto.appointmentId }
      });
      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${createDetoxsessionDto.appointmentId} not found`);
      }
    }

    // If consultationId is provided, check if consultation exists
    if (createDetoxsessionDto.consultationId) {
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: createDetoxsessionDto.consultationId }
      });
      if (!consultation) {
        throw new NotFoundException(`Consultation with ID ${createDetoxsessionDto.consultationId} not found`);
      }
    }

    const detoxSession = await this.prisma.detoxSession.create({
      data: {
        patientId: createDetoxsessionDto.patientId,
        doctorId: createDetoxsessionDto.doctorId,
        appointmentId: createDetoxsessionDto.appointmentId,
        consultationId: createDetoxsessionDto.consultationId,
        sessionNumber: createDetoxsessionDto.sessionNumber,
        sessionType: createDetoxsessionDto.sessionType,
        sessionDate: createDetoxsessionDto.sessionDate ? new Date(createDetoxsessionDto.sessionDate) : new Date(),
        detoxNotes: createDetoxsessionDto.detoxNotes,
        followupDate: createDetoxsessionDto.followupDate ? new Date(createDetoxsessionDto.followupDate) : null,
        followupRemarks: createDetoxsessionDto.followupRemarks,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        consultation: true
      }
    });

    return detoxSession;
  }

  async findAll() {
    return this.prisma.detoxSession.findMany({
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        consultation: true
      },
      orderBy: { sessionDate: 'desc' }
    });
  }

  async findOne(id: number) {
    const detoxSession = await this.prisma.detoxSession.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        consultation: true
      }
    });

    if (!detoxSession) {
      throw new NotFoundException(`Detox session with ID ${id} not found`);
    }

    return detoxSession;
  }

  async findByPatient(patientId: number) {
    return this.prisma.detoxSession.findMany({
      where: { patientId },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        consultation: true
      },
      orderBy: { sessionNumber: 'asc' }
    });
  }

  async findByDoctor(doctorId: number) {
    return this.prisma.detoxSession.findMany({
      where: { doctorId },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        consultation: true
      },
      orderBy: { sessionDate: 'desc' }
    });
  }

  async findByAppointment(appointmentId: number) {
    return this.prisma.detoxSession.findMany({
      where: { appointmentId },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        consultation: true
      }
    });
  }

  async getPatientSessionProgress(patientId: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const sessions = await this.prisma.detoxSession.findMany({
      where: { patientId },
      orderBy: { sessionNumber: 'asc' }
    });

    return {
      patientId,
      patientName: patient.name,
      totalSessions: sessions.length,
      maxSessions: 3,
      remainingSessions: 3 - sessions.length,
      completed: sessions.length === 3,
      sessions: sessions.map(s => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        sessionType: s.sessionType,
        sessionDate: s.sessionDate,
        hasNotes: !!s.detoxNotes,
        followupDate: s.followupDate,
        followupRemarks: s.followupRemarks
      }))
    };
  }

  async update(id: number, updateDetoxsessionDto: UpdateDetoxsessionDto) {
    await this.findOne(id);

    return this.prisma.detoxSession.update({
      where: { id },
      data: {
        doctorId: updateDetoxsessionDto.doctorId,
        sessionType: updateDetoxsessionDto.sessionType,
        sessionDate: updateDetoxsessionDto.sessionDate ? new Date(updateDetoxsessionDto.sessionDate) : undefined,
        detoxNotes: updateDetoxsessionDto.detoxNotes,
        followupDate: updateDetoxsessionDto.followupDate ? new Date(updateDetoxsessionDto.followupDate) : undefined,
        followupRemarks: updateDetoxsessionDto.followupRemarks,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        consultation: true
      }
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.detoxSession.delete({
      where: { id }
    });
  }

  async getUpcomingFollowups() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.detoxSession.findMany({
      where: {
        followupDate: {
          gte: today
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
      orderBy: { followupDate: 'asc' }
    });
  }
}