import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class MenuPermissionService {
  constructor(private prisma: PrismaService) {}

  async getByRole(role: UserRole) {
    const record = await this.prisma.menuPermission.findUnique({
      where: { role },
    });
    return record?.permissions || null;
  }

  async getAll() {
    return this.prisma.menuPermission.findMany();
  }

  async upsert(role: UserRole, permissions: any) {
    return this.prisma.menuPermission.upsert({
      where: { role },
      update: { permissions },
      create: { role, permissions },
    });
  }
}
