import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  private readonly patientInclude = {
    appointments: {
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
    },
  };

  // Resolve the Doctor record id for the logged-in user.
  // Only DOCTOR and THERAPIST roles own patients; ADMIN/RECEPTIONIST return null (clinic-level).
  private async resolveDoctorId(user: any): Promise<number | null> {
    if (!user) return null;
    const role = String(user.role || '').toUpperCase();
    if (role !== 'DOCTOR' && role !== 'THERAPIST') return null;
    if (!user.sub) return null;

    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: Number(user.sub) },
    });
    return doctor ? doctor.id : null;
  }

  // Restrict discovery scope for doctors: only their own created patients plus
  // patients linked via appointments, consultations, or shared to them.
  private buildDoctorScope(doctorId: number | null): any {
    if (!doctorId) return {};
    return {
      OR: [
        { createdByDoctorId: doctorId },
        { appointments: { some: { doctorId } } },
        { consultations: { some: { doctorId } } },
        { shares: { some: { toDoctorId: doctorId } } },
      ],
    };
  }

  // ✅ CREATE (allow same phone, prevent exact duplicate)
  async create(createPatientDto: CreatePatientDto, currentUser?: any) {
    const existing = await this.prisma.patient.findFirst({
      where: {
        phone: createPatientDto.phone,
        name: createPatientDto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Patient with same name and phone already exists',
      );
    }

    const createdByDoctorId = await this.resolveDoctorId(currentUser);

    return this.prisma.patient.create({
      data: {
        ...createPatientDto,
        createdByDoctorId,
      },
    });
  }

  // ✅ GET ALL
  async findAll(currentUser?: any) {
    const doctorId = await this.resolveDoctorId(currentUser);

    return this.prisma.patient.findMany({
      where: this.buildDoctorScope(doctorId),
      include: this.patientInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ GET ONE
  async findOne(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        ...this.patientInclude,
        appointments: {
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { appointmentDate: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  // ✅ FIND BY PHONE (MULTIPLE PATIENTS)
  async findByPhone(phone: string, currentUser?: any) {
    // Normalize input and attempt flexible matching so searches succeed
    const cleaned = phone ? phone.toString().replace(/\D/g, '') : '';
    const last10 = cleaned.slice(-10);

    const candidates = new Set<string>();
    if (cleaned) candidates.add(cleaned);
    if (cleaned.length === 10) candidates.add('+91' + cleaned);
    if (cleaned.length > 10 && cleaned.startsWith('91'))
      candidates.add('+' + cleaned);
    // also try bare '91' + last10
    if (last10) candidates.add('91' + last10);

    const orClauses: any[] = [];
    for (const c of candidates) {
      orClauses.push({ phone: c });
    }
    // also match any phone that ends with the last 10 digits
    if (last10) orClauses.push({ phone: { endsWith: last10 } });

    const doctorId = await this.resolveDoctorId(currentUser);
    const scope = this.buildDoctorScope(doctorId);

    const where: any = {
      AND: [{ OR: orClauses }, scope],
    };

    const patients = await this.prisma.patient.findMany({
      where,
      include: this.patientInclude,
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
        appointments: true,
      },
    });
  }

  // ✅ DELETE
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.patient.delete({
      where: { id },
    });
  }
}
