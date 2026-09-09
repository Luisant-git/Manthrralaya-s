import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareDto } from './dto/create-share.dto';

@Injectable()
export class ShareService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateShareDto, authUser: any) {
    if (!dto || (dto.patientId === undefined || dto.patientId === null)) {
      throw new BadRequestException('Missing patientId in request body');
    }
    if (!dto.toDoctorId && dto.toDoctorId !== 0) {
      throw new BadRequestException('Missing toDoctorId in request body');
    }

    const patientId = Number(dto.patientId);
    if (isNaN(patientId)) throw new BadRequestException('Invalid patientId');

    // ensure patient exists
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    // resolve the sharing doctor from the authenticated user's linked Doctor record
    if (!authUser || authUser.sub === undefined || authUser.sub === null) {
      throw new BadRequestException('Unable to identify the sharing doctor');
    }
    const fromDoctor = await this.prisma.doctor.findUnique({ where: { userId: Number(authUser.sub) } });
    if (!fromDoctor) throw new BadRequestException('Authenticated user is not a doctor');

    // ensure toDoctor exists
    const toDoctorId = Number(dto.toDoctorId);
    if (isNaN(toDoctorId)) throw new BadRequestException('Invalid toDoctorId');
    if (toDoctorId === fromDoctor.id) throw new BadRequestException('Cannot share a record with yourself');
    const toDoctor = await this.prisma.doctor.findUnique({ where: { id: toDoctorId } });
    if (!toDoctor) throw new NotFoundException('Target doctor not found');

    const share = await this.prisma.share.create({
      data: {
        patientId: patientId,
        fromDoctorId: fromDoctor.id,
        toDoctorId: toDoctorId,
        notes: dto.notes || null,
      },
      include: {
        patient: true,
        fromDoctor: { include: { user: true } },
        toDoctor: { include: { user: true } },
      }
    });

    return share;
  }

  async findByDoctor(doctorId: number, fromDate?: Date, toDate?: Date) {
    const where: any = { toDoctorId: doctorId };
    if (fromDate && toDate) {
      // Treat the "to" date as inclusive end-of-day so shares created during
      // the day are not missed (e.g. today-to-today range).
      const startOfDay = new Date(fromDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }
    return this.prisma.share.findMany({
      where,
      include: { patient: true, fromDoctor: { include: { user: true } }, toDoctor: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}
