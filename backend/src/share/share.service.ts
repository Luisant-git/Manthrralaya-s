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

    // Resolve the sharing doctor from the authenticated user's linked Doctor record.
    // Admin/receptionist users may not have a linked Doctor record, so allow the
    // share without a from-doctor in that case.
    const fromDoctor = authUser && authUser.sub !== undefined && authUser.sub !== null
      ? await this.prisma.doctor.findUnique({ where: { userId: Number(authUser.sub) } })
      : null;

    // ensure toDoctor exists
    const toDoctorId = Number(dto.toDoctorId);
    if (isNaN(toDoctorId)) throw new BadRequestException('Invalid toDoctorId');
    if (fromDoctor && toDoctorId === fromDoctor.id) throw new BadRequestException('Cannot share a record with yourself');
    const toDoctor = await this.prisma.doctor.findUnique({ where: { id: toDoctorId } });
    if (!toDoctor) throw new NotFoundException('Target doctor not found');

    const share = await this.prisma.share.create({
      data: {
        patientId: patientId,
        fromDoctorId: fromDoctor ? fromDoctor.id : null,
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
    // Removed fromDate and toDate filtering because shares grant permanent access until revoked.
    return this.prisma.share.findMany({
      where,
      include: { patient: true, fromDoctor: { include: { user: true } }, toDoctor: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByFromDoctor(doctorId: number) {
    return this.prisma.share.findMany({
      where: { fromDoctorId: doctorId },
      include: { patient: true, toDoctor: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByPatient(patientId: number) {
    return this.prisma.share.findMany({
      where: { patientId: patientId },
      include: { 
        patient: true, 
        fromDoctor: { include: { user: true } }, 
        toDoctor: { include: { user: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async delete(id: number) {
    const share = await this.prisma.share.findUnique({ where: { id } });
    if (!share) throw new NotFoundException('Share not found');
    
    return this.prisma.share.delete({
      where: { id }
    });
  }
}
