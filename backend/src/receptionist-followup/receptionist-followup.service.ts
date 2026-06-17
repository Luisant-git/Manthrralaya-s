import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { sendWhatsappTemplateMessage } from 'src/common/whatsapp.util';

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

  async sendFollowupReminder(consultationId: number) {
    const followup = await this.findOneByConsultation(consultationId);
    if (!followup) throw new NotFoundException('Follow-up not found for consultation');

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { patient: true, doctor: { include: { user: true } }, appointment: true }
    });

    if (!consultation) throw new NotFoundException('Consultation not found');

    const patient = consultation.patient || (await this.prisma.patient.findUnique({ where: { id: followup.patientId } }));
    if (!patient || !patient.phone) throw new NotFoundException('Patient or phone not found');

    const doctorName = consultation.doctor?.user?.fullName || 'Assigned Doctor';

    const date = followup.followupDate || consultation.followupDate;
    const dateStr = date ? new Date(date).toLocaleDateString('en-GB') : '';

    // Prefer appointment.session if available, else default to 'AN'
    const session = consultation.appointment?.session || 'AN';

    const params = [patient.name || 'Patient', dateStr, session, doctorName];

    // Send template
    return await sendWhatsappTemplateMessage(
      patient.whatsapp || patient.phone,
      'manthrayala_followup_reminder',
      params,
      'en'
    );
  }
}
