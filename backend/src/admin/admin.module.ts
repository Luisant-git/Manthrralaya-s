// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MenuPermissionGuard } from '../auth/guards/menu-permission.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, MenuPermissionGuard],
  exports: [AdminService],
})
export class AdminModule {}