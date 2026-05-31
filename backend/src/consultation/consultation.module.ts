import { Module } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { ConsultationController } from './consultation.controller';
import { PrismaModule } from 'src/prisma/prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [ConsultationController],
  providers: [ConsultationService],
  exports: [ConsultationService],
})
export class ConsultationModule {}