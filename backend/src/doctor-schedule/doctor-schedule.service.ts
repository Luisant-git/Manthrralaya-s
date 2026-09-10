import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertWeekScheduleDto } from './dto/upsert-week-schedule.dto';

@Injectable()
export class DoctorScheduleService {
  constructor(private prisma: PrismaService) {}

  private toDateOnly(value: Date | string): Date {
    if (typeof value === 'string' && value.includes('-')) {
      const [year, month, day] = value.split('T')[0].split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    }
    const d = new Date(value);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private async ensureDoctorExists(doctorId: number) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    return doctor;
  }

  async getWeek(doctorId: number, from: string, to: string) {
    await this.ensureDoctorExists(doctorId);

    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        date: {
          gte: this.toDateOnly(from),
          lte: this.toDateOnly(to),
        },
      },
      orderBy: { date: 'asc' },
    });

    return schedules.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      isAvailable: s.isAvailable,
    }));
  }

  async upsertWeek(upsertWeekScheduleDto: UpsertWeekScheduleDto) {
    const { doctorId, days } = upsertWeekScheduleDto;

    await this.ensureDoctorExists(doctorId);

    await this.prisma.$transaction(
      days.map((day) =>
        this.prisma.doctorSchedule.upsert({
          where: {
            doctorId_date: {
              doctorId,
              date: this.toDateOnly(day.date),
            },
          },
          update: { isAvailable: day.isAvailable },
          create: {
            doctorId,
            date: this.toDateOnly(day.date),
            isAvailable: day.isAvailable,
          },
        }),
      ),
    );

    return { success: true, updatedDays: days.length };
  }
}