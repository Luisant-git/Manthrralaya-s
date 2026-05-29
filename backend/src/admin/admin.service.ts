import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ========== CREATE USER ==========
  async createUser(role: UserRole, dto: CreateUserDto) {
    if (role === UserRole.DOCTOR && !dto.specialization) {
      throw new BadRequestException('Specialization is required for doctors');
    }

    if (role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot create ADMIN users via this endpoint');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const existingPhoneUser = await this.prisma.user.findFirst({
      where: { phone: dto.phone }
    });
    if (existingPhoneUser) {
      throw new ConflictException('Phone number already exists');
    }

    const hashedPin = await bcrypt.hash(dto.pin, 10);

    const result = await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email: dto.email,
          pin: hashedPin,
          role: role,
          fullName: dto.fullName,
          phone: dto.phone,
          isActive: true,
        },
      });

      let profile = null;
      if (role === UserRole.DOCTOR) {
        profile = await prisma.doctor.create({
          data: {
            userId: user.id,
            specialization: dto.specialization!,
            status: dto.status || 'Available',
          },
        });
      }

      return { user, profile };
    });

    return {
      success: true,
      message: `${role} created successfully`,
      data: result,
      tempPin: dto.pin,
    };
  }

  // ========== FIND USER BY EMAIL (for auth) ==========
  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  // ========== FIND USER BY ROLE (for admin check) ==========
  async findByRole(role: UserRole) {
    return await this.prisma.user.findFirst({
      where: { role },
    });
  }

  // ========== FIND USER BY ID ==========
  async findById(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: { doctor: true },
    });
  }

  // ========== UPDATE LAST LOGIN (for auth) ==========
  async updateLastLogin(id: number) {
    return await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  // ========== GET ALL USERS BY ROLE ==========
  async getUsersByRole(role: UserRole) {
    if (role === UserRole.DOCTOR) {
      const doctors = await this.prisma.doctor.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              isActive: true,
              createdAt: true,
              lastLogin: true,
            }
          }
        }
      });
      return { success: true, count: doctors.length, data: doctors };
    }

    const users = await this.prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      }
    });
    return { success: true, count: users.length, data: users };
  }

  // ========== UPDATE USER STATUS ==========
  async updateUserStatus(userId: number, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ADMIN) throw new ConflictException('Cannot modify ADMIN');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return {
      success: true,
      message: `User ${updatedUser.fullName} has been ${isActive ? 'activated' : 'deactivated'}`,
      data: updatedUser,
    };
  }

 // ========== UPDATE DOCTOR STATUS ==========
async updateDoctorStatus(doctorId: number, status: string) {
  // First check if doctor exists
  const doctor = await this.prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { user: true }
  });

  if (!doctor) {
    throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
  }

  // Update the doctor status
  const updatedDoctor = await this.prisma.doctor.update({
    where: { id: doctorId },
    data: { status },
    include: { user: true }
  });

  return {
    success: true,
    message: `Doctor status updated to ${status}`,
    data: updatedDoctor,
  };
}

  // ========== DELETE USER ==========
  async deleteUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ADMIN) throw new ConflictException('Cannot delete ADMIN');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return {
      success: true,
      message: `User ${user.fullName} has been deleted`,
    };
  }


async getUserById(id: number) {
  const user = await this.prisma.user.findUnique({
    where: { id },
    include: {
      doctor: true, // Include doctor profile if exists
    }
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return {
    success: true,
    data: user,
  };
}

  // ========== UPDATE USER ==========
  async updateUser(userId: number, dto: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { doctor: true }
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ADMIN) throw new ConflictException('Cannot modify ADMIN');

    // Check for phone number uniqueness if it's being changed
    if (dto.phone && dto.phone !== user.phone) {
      const existingPhoneUser = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          id: { not: userId } // Exclude the current user from the check
        }
      });
      if (existingPhoneUser) throw new ConflictException('Phone number already in use by another staff member');
    }

    const updateData: any = {
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone,
    };

    // Only update PIN if provided
    if (dto.pin && dto.pin.trim() !== '') {
      updateData.pin = await bcrypt.hash(dto.pin, 10);
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      let profile = null;
      if (user.role === UserRole.DOCTOR && user.doctor) {
        profile = await prisma.doctor.update({
          where: { userId: userId },
          data: {
            specialization: dto.specialization || user.doctor.specialization,
            status: dto.status || user.doctor?.status || 'Available',
          },
        });
      }

      return { user: updatedUser, profile };
    });

    return {
      success: true,
      message: 'Staff details updated successfully',
      data: result,
    };
  }

  // ========== RESET USER PIN ==========
  async resetUserPin(userId: number, newPin: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ADMIN) throw new ConflictException('Cannot reset ADMIN pin here');

    const hashedPin = await bcrypt.hash(newPin, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin, isActive: true } // Auto-activate on PIN reset
    });

    return {
      success: true,
      message: `Access PIN for ${user.fullName} has been updated and account activated.`
    };
  }
}