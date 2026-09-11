import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FoodChartService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: any) {
    return this.prisma.foodChart.create({
      data: {
        patientId: createDto.patientId,
        consultationId: createDto.consultationId,
        date: createDto.date,
        time: createDto.time,
        food: createDto.food,
        providedTime: createDto.providedTime,
        remarks: createDto.remarks,
        isDelivered: createDto.isDelivered || false,
      },
    });
  }

  async findAllByPatient(patientId: number) {
    return this.prisma.foodChart.findMany({
      where: { patientId },
      orderBy: [
        { date: 'desc' },
        { time: 'asc' }
      ]
    });
  }

  async findAllByConsultation(consultationId: number) {
    return this.prisma.foodChart.findMany({
      where: { consultationId },
      orderBy: [
        { date: 'desc' },
        { time: 'asc' }
      ]
    });
  }

  async update(id: number, updateDto: any) {
    return this.prisma.foodChart.update({
      where: { id },
      data: {
        providedTime: updateDto.providedTime,
        remarks: updateDto.remarks,
        isDelivered: updateDto.isDelivered,
        date: updateDto.date,
        time: updateDto.time,
        food: updateDto.food,
      },
    });
  }
}
