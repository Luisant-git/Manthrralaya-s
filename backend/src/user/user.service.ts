import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ✅ Find by email
  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  // ✅ Create user
  async create(data: any) {
    return await this.prisma.user.create({
      data,
    });
  }

  // ✅ Get all users
  async findAll() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findById(id: number) {
  try {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    throw new Error('Failed to fetch user');
  }
}
}