import { Module } from '@nestjs/common';
import { DoctorScheduleService } from './doctor-schedule.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DoctorScheduleController } from './doctor-schedule.controller';
import { MenuPermissionGuard } from '../auth/guards/menu-permission.guard';

@Module({
  imports: [PrismaModule],
  providers: [DoctorScheduleService, MenuPermissionGuard],
  exports: [DoctorScheduleService],
  controllers: [DoctorScheduleController],
})
export class DoctorScheduleModule {}