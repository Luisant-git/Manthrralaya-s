import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  // ✅ CREATE (allow same phone, prevent exact duplicate)
  async create(createPatientDto: CreatePatientDto) {
    const existing = await this.prisma.patient.findFirst({
      where: {
        phone: createPatientDto.phone,
        name: createPatientDto.name
      }
    });

    if (existing) {
      throw new ConflictException('Patient with same name and phone already exists');
    }

    return this.prisma.patient.create({
      data: createPatientDto
    });
  }

  // ✅ GET ALL
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

  // ✅ GET ONE
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

  // ✅ FIND BY PHONE (MULTIPLE PATIENTS)
  async findByPhone(phone: string) {
    // Normalize input and attempt flexible matching so searches succeed
    const cleaned = phone ? phone.toString().replace(/\D/g, '') : '';
    const last10 = cleaned.slice(-10);

    const candidates = new Set<string>();
    if (cleaned) candidates.add(cleaned);
    if (cleaned.length === 10) candidates.add('+91' + cleaned);
    if (cleaned.length > 10 && cleaned.startsWith('91')) candidates.add('+' + cleaned);
    // also try bare '91' + last10
    if (last10) candidates.add('91' + last10);

    const orClauses: any[] = [];
    for (const c of candidates) {
      orClauses.push({ phone: c });
    }
    // also match any phone that ends with the last 10 digits
    if (last10) orClauses.push({ phone: { endsWith: last10 } });

    const patients = await this.prisma.patient.findMany({
      where: {
        OR: orClauses
      },
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

    if (!patients.length) {
      throw new NotFoundException(`No patients found with phone ${phone}`);
    }

    return patients;
  }

  // ✅ UPDATE
  async update(id: number, updatePatientDto: UpdatePatientDto) {
    await this.findOne(id);

    return this.prisma.patient.update({
      where: { id },
      data: updatePatientDto,
      include: {
        appointments: true
      }
    });
  }

  // ✅ DELETE
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.patient.delete({
      where: { id }
    });
  }
}