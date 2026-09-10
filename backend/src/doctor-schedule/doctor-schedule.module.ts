import { Module } from '@nestjs/common';
import { DoctorScheduleService } from './doctor-schedule.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DoctorScheduleController } from './doctor-schedule.controller';

@Module({
  imports: [PrismaModule],
  providers: [DoctorScheduleService],
  exports: [DoctorScheduleService],
  controllers: [DoctorScheduleController],
})
export class DoctorScheduleModule {}