import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ReceptionistFollowupService } from '../receptionist-followup/receptionist-followup.service';

@Injectable()
export class ConsultationService {
  constructor(
    private prisma: PrismaService,
    private receptionistFollowupService: ReceptionistFollowupService,
  ) {}

  async create(createConsultationDto: CreateConsultationDto) {
    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createConsultationDto.patientId }
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${createConsultationDto.patientId} not found`);
    }

    // Check if doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: createConsultationDto.doctorId }
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${createConsultationDto.doctorId} not found`);
    }

    // If detox doctor is provided, check if exists
    if (createConsultationDto.detoxDoctorId) {
      const detoxDoctor = await this.prisma.doctor.findUnique({
        where: { id: createConsultationDto.detoxDoctorId }
      });
      if (!detoxDoctor) {
        throw new NotFoundException(`Detox doctor with ID ${createConsultationDto.detoxDoctorId} not found`);
      }
    }

    // CRITICAL FIX: Check if consultation already exists for this appointment
    if (createConsultationDto.appointmentId) {
      const existingConsultation = await this.prisma.consultation.findFirst({
        where: { appointmentId: createConsultationDto.appointmentId }
      });
      
      if (existingConsultation) {
        // Instead of throwing error, return the existing consultation
        console.log(`⚠️ Consultation already exists for appointment ${createConsultationDto.appointmentId}, returning existing record`);
        return this.prisma.consultation.findUnique({
          where: { id: existingConsultation.id },
          include: {
            patient: true,
            doctor: {
              include: {
                user: true
              }
            },
            appointment: true,
            detoxDoctor: {
              include: {
                user: true
              }
            },
            receptionistFollowup: true
          }
        });
      }
    }

    const consultation = await this.prisma.consultation.create({
      data: {
        patientId: createConsultationDto.patientId,
        doctorId: createConsultationDto.doctorId,
        appointmentId: createConsultationDto.appointmentId,
        consultationNotes: createConsultationDto.consultationNotes,
        medicalHistoryNotes: createConsultationDto.medicalHistoryNotes,
        detoxProcedureNotes: createConsultationDto.detoxProcedureNotes,
        dietPlanNotes: createConsultationDto.dietPlanNotes,
        homecareGuideliness: createConsultationDto.homecareGuideliness,
        detoxRecommended: createConsultationDto.detoxRecommended || false,
        detoxDoctorId: createConsultationDto.detoxDoctorId || null,
        followupDate: createConsultationDto.followupDate ? new Date(createConsultationDto.followupDate) : null,
        followupRemarks: createConsultationDto.followupRemarks,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        detoxDoctor: {
          include: {
            user: true
          }
        },
        receptionistFollowup: true
      }
    });

    // Update appointment status to Completed if appointment exists
    if (createConsultationDto.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: createConsultationDto.appointmentId },
        data: { status: 'Completed' }
      });
    }

    return consultation;
  }

  // Add a method to cleanup duplicate consultations
  async cleanupDuplicates() {
    // Find all appointments with multiple consultations
    const duplicates = await this.prisma.$queryRaw`
      SELECT appointment_id, COUNT(*) as count, array_agg(id) as ids
      FROM consultations 
      WHERE appointment_id IS NOT NULL
      GROUP BY appointment_id
      HAVING COUNT(*) > 1
    `;

    const deletedIds = [];
    
    for (const duplicate of duplicates as any[]) {
      const ids = duplicate.ids;
      // Keep the first one (oldest) or the one with most data
      const [firstId, ...restIds] = ids;
      
      for (const id of restIds) {
        await this.prisma.consultation.delete({ where: { id } });
        deletedIds.push(id);
      }
    }

    return {
      message: `Cleaned up ${deletedIds.length} duplicate consultation records`,
      deletedIds
    };
  }

  async findAll() {
    return this.prisma.consultation.findMany({
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        detoxDoctor: {
          include: {
            user: true
          }
        },
        receptionistFollowup: true
      },
      orderBy: { consultationDate: 'desc' }
    });
  }

  async findOne(id: number) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        detoxDoctor: {
          include: {
            user: true
          }
        },
        receptionistFollowup: true
      }
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    return consultation;
  }

  async findByPatient(patientId: number) {
    const consultations = await this.prisma.consultation.findMany({
      where: { patientId },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        detoxDoctor: {
          include: {
            user: true
          }
        },
        receptionistFollowup: true
      },
      orderBy: { consultationDate: 'desc' }
    });

    return consultations;
  }

  async findByDoctor(doctorId: number) {
    return this.prisma.consultation.findMany({
      where: { doctorId },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        detoxDoctor: {
          include: {
            user: true
          }
        },
        receptionistFollowup: true
      },
      orderBy: { consultationDate: 'desc' }
    });
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    return this.prisma.consultation.findMany({
      where: {
        consultationDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        detoxDoctor: {
          include: {
            user: true
          }
        },
        receptionistFollowup: true
      },
      orderBy: { consultationDate: 'desc' }
    });
  }

  async getPendingFollowups() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const consultations = await this.prisma.consultation.findMany({
      where: {
        detoxRecommended: true,
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
        },
        detoxDoctor: {
          include: {
            user: true
          }
        },
        receptionistFollowup: true
      },
      orderBy: { followupDate: 'asc' }
    });

    return consultations.map(c => {
      const receptionistInfo = c.receptionistFollowup;
      return {
        id: c.id,
        patientId: c.patientId,
        patientName: c.patient.name,
        patientPhone: c.patient.phone,
        doctorFollowupDate: c.followupDate, // Renamed for clarity
        doctorFollowupRemarks: c.followupRemarks, // Renamed for clarity
        receptionistFollowupDate: receptionistInfo?.followupDate || null,
        receptionistNotes: receptionistInfo?.notes || null,
        consultationDate: c.consultationDate,
        doctorName: c.doctor.user?.fullName,
      };
    });
  }

  async update(id: number, updateConsultationDto: UpdateConsultationDto) {
    await this.findOne(id);

    // If detox doctor is being updated, check if exists
    if (updateConsultationDto.detoxDoctorId) {
      const detoxDoctor = await this.prisma.doctor.findUnique({
        where: { id: updateConsultationDto.detoxDoctorId }
      });
      if (!detoxDoctor) {
        throw new NotFoundException(`Detox doctor with ID ${updateConsultationDto.detoxDoctorId} not found`);
      }
    }

    return this.prisma.consultation.update({
      where: { id },
      data: {
        consultationNotes: updateConsultationDto.consultationNotes,
        medicalHistoryNotes: updateConsultationDto.medicalHistoryNotes,
        detoxProcedureNotes: updateConsultationDto.detoxProcedureNotes,
        dietPlanNotes: updateConsultationDto.dietPlanNotes,
        homecareGuideliness: updateConsultationDto.homecareGuideliness,
        detoxRecommended: updateConsultationDto.detoxRecommended,
        detoxDoctorId: updateConsultationDto.detoxDoctorId,
        followupDate: updateConsultationDto.followupDate ? new Date(updateConsultationDto.followupDate) : undefined,
        followupRemarks: updateConsultationDto.followupRemarks,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        },
        appointment: true,
        detoxDoctor: {
          include: {
            user: true
          }
        },
        receptionistFollowup: true
      }
    });
  }

  async updateReceptionistNotes(
    consultationId: number,
    data: { followupDate?: string; notes?: string; status?: string },
  ) {
    const consultation = await this.findOne(consultationId); // Ensure consultation exists
    return this.receptionistFollowupService.updateOrCreate(consultation.id, {
      patientId: consultation.patientId,
      followupDate: data.followupDate !== undefined ? (data.followupDate ? new Date(data.followupDate) : null) : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
      status: data.status,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.consultation.delete({
      where: { id }
    });
  }
}