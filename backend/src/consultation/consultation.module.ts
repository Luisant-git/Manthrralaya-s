import { Module } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { ConsultationController } from './consultation.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReceptionistFollowupModule } from '../receptionist-followup/receptionist-followup.module';


@Module({
  imports: [PrismaModule, ReceptionistFollowupModule],
  controllers: [ConsultationController],
  providers: [ConsultationService],
  exports: [ConsultationService],
})
export class ConsultationModule {}