import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto) {
    // Check if patient with same phone exists
    const existingPatient = await this.prisma.patient.findUnique({
      where: { phone: createPatientDto.phone }
    });

    if (existingPatient) {
      throw new ConflictException('Patient with this phone number already exists');
    }

    return this.prisma.patient.create({
      data: createPatientDto
    });
  }

  async findAll() {
    return this.prisma.patient.findMany({
      include: {
        appointments: {
          include: {
            doctor: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            doctor: {
              include: {
                user: true
              }
            }
          },
          orderBy: { appointmentDate: 'desc' }
        }
      }
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async findByPhone(phone: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { phone },
      include: {
        appointments: {
          include: {
            doctor: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!patient) {
      throw new NotFoundException(`Patient with phone ${phone} not found`);
    }

    return patient;
  }

  async update(id: number, updatePatientDto: UpdatePatientDto) {
    await this.findOne(id); // Check if exists

    return this.prisma.patient.update({
      where: { id },
      data: updatePatientDto,
      include: {
        appointments: true
      }
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return this.prisma.patient.delete({
      where: { id }
    });
  }
}