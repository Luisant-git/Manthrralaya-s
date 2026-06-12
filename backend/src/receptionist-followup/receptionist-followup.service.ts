import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReceptionistFollowupService {
  constructor(private prisma: PrismaService) {}

  async findOneByConsultation(consultationId: number) {
    if (!consultationId) return null;
    const rec = await this.prisma.receptionistFollowup.findUnique({
      where: { consultationId },
    });
    return rec;
  }

  async updateOrCreate(
    consultationId: number,
    data: { patientId?: number; followupDate?: Date | string; notes?: string; status?: string },
  ) {
    if (!consultationId) throw new NotFoundException('Consultation id required');

    const existing = await this.prisma.receptionistFollowup.findUnique({ where: { consultationId } });

    const payload: any = {};
    if (data.patientId) payload.patientId = data.patientId;
    if (data.followupDate !== undefined) payload.followupDate = data.followupDate ? new Date(data.followupDate) : null;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.status !== undefined) payload.status = data.status;

    if (existing) {
      return this.prisma.receptionistFollowup.update({
        where: { consultationId },
        data: payload,
      });
    }

    // need patientId to create; fallback to provided or throw
    if (!payload.patientId) {
      throw new NotFoundException('patientId is required to create receptionist followup');
    }

    return this.prisma.receptionistFollowup.create({
      data: {
        consultationId,
        patientId: payload.patientId,
        followupDate: payload.followupDate || null,
        notes: payload.notes || null,
        status: payload.status || 'Pending',
      },
    });
  }
}
