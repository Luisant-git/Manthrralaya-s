import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { sendWhatsappTemplateMessage } from 'src/common/whatsapp.util';

@Injectable()
export class ReceptionistFollowupService {
  constructor(private prisma: PrismaService) {}

  private getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

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

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { 
        patient: true, 
        doctor: { include: { user: true } }, 
        appointment: true,
        detoxSessions: true
      }
    });

    if (!consultation) throw new NotFoundException('Consultation not found');

    const patient = consultation.patient || (followup ? await this.prisma.patient.findUnique({ where: { id: followup.patientId } }) : null);
    if (!patient || !patient.phone) throw new NotFoundException('Patient or phone not found');

    const doctorName = consultation.doctor?.user?.fullName || 'Assigned Doctor';

    const date = followup?.followupDate || consultation.followupDate || consultation.appointment?.appointmentDate;
    if (!date) {
      throw new NotFoundException('Follow-up date not found for consultation');
    }

    const dateObj = new Date(date);
    const dateStr = `${dateObj.getDate()}${this.getOrdinal(dateObj.getDate())} ${dateObj.toLocaleString('en-GB', { month: 'long' })} ${dateObj.getFullYear()}`;

    // Check if patient completed all 3 detox sessions using patient-level detox history
    const patientDetoxSessions = await this.prisma.detoxSession.findMany({
      where: { patientId: patient.id }
    });
    const allDetoxCompleted = patientDetoxSessions.length >= 3;
    
    // Follow-up type: Review if detox completed, else use doctor's recommendation
    const appointmentType = allDetoxCompleted ? 'Review' : (consultation.detoxRecommended ? 'Detox' : 'Review');

    const params = [patient.name || 'Patient', appointmentType, dateStr];

    // Send template
    return await sendWhatsappTemplateMessage(
      patient.whatsapp || patient.phone,
      'followup_review_reminder_template',
      params,
      'en'
    );
  }
}
