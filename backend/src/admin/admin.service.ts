import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ========== CREATE USER ==========
  async createUser(role: UserRole, dto: CreateUserDto, allowAdminCreation = false) {
    if ((role === UserRole.DOCTOR || role === UserRole.THERAPIST) && !dto.specialization) {
      throw new BadRequestException('Specialization is required for doctors and therapists');
    }

    if (role === UserRole.ADMIN && !allowAdminCreation) {
      throw new BadRequestException('Cannot create ADMIN users via this endpoint');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (dto.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username }
      });
      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
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
          username: dto.username,
          pin: hashedPin,
          role: role,
          fullName: dto.fullName,
          phone: dto.phone,
          isActive: true,
        },
      });

      let profile = null;
      if (role === UserRole.DOCTOR || role === UserRole.THERAPIST) {
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

  // ========== FIND USER BY USERNAME (for auth) ==========
  async findByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username },
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
    if (role === UserRole.DOCTOR || role === UserRole.THERAPIST) {
      const doctors = await this.prisma.doctor.findMany({
        where: {
          user: {
            role: role
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true,
              phone: true,
              role: true,
              isActive: true,
              createdAt: true,
              lastLogin: true,
            }
          }
      },
      orderBy: {
        createdAt: 'desc'
        }
      });
      return { success: true, count: doctors.length, data: doctors };
    }

    const users = await this.prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: 'desc'
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
      where: { id: userId },
      include: { doctor: true }
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ADMIN) throw new ConflictException('Cannot delete ADMIN');

    try {
      await this.prisma.$transaction(async (prisma) => {
        // First delete the doctor profile if it exists
        if (user.doctor) {
          await prisma.doctor.delete({
            where: { userId: userId }
          });
        }
        
        // Then delete the user
        await prisma.user.delete({
          where: { id: userId }
        });
      });

      return {
        success: true,
        message: `User ${user.fullName} has been permanently deleted`,
      };
    } catch (error) {
      if (error.code === 'P2003') {
        throw new ConflictException(`Cannot delete ${user.fullName} because they have associated appointments, consultations, or other system records. Please deactivate them instead.`);
      }
      throw new BadRequestException('Failed to permanently delete staff member. Please try again.');
    }
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

    if (dto.username && dto.username !== user.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username }
      });
      if (existingUsername) {
        throw new ConflictException('Username already in use by another staff member');
      }
    }

    const updateData: any = {
      email: dto.email,
      username: dto.username,
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
      if ((user.role === UserRole.DOCTOR || user.role === UserRole.THERAPIST) && user.doctor) {
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
async resetUserPin(userId: number, newPin: string, requestingUserRole: UserRole, requestingUserId: number) {
  // Security: Only ADMINs can reset other users' PINs. Non-admins can only reset their own.
  if (requestingUserRole !== UserRole.ADMIN && Number(requestingUserId) !== Number(userId)) {
    throw new ForbiddenException('You are only authorized to reset your own security PIN.');
  }

  // Make sure userId is a valid number
  if (!userId || isNaN(Number(userId))) {
    throw new BadRequestException('Invalid user ID provided');
  }

  const userIdNum = Number(userId);
  const user = await this.prisma.user.findUnique({
    where: { id: userIdNum }
  });

  if (!user) throw new NotFoundException('User not found');
  
  // Block resetting OTHER admins, but allow self-reset
  if (user.role === UserRole.ADMIN && Number(requestingUserId) !== Number(userIdNum)) {
      throw new ConflictException('Security Policy: You cannot reset another Administrator\'s PIN.');
  }

  const hashedPin = await bcrypt.hash(newPin, 10);

  await this.prisma.user.update({
    where: { id: userIdNum },
    data: { pin: hashedPin, isActive: true }
  });

  return {
    success: true,
    message: `Access PIN for ${user.fullName} has been updated and account activated.`
  };
}
}