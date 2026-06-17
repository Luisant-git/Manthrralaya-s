import { Module } from '@nestjs/common';
import { ReceptionistFollowupService } from './receptionist-followup.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReceptionistFollowupController } from './receptionist-followup.controller';

@Module({
  imports: [PrismaModule],
  providers: [ReceptionistFollowupService],
  exports: [ReceptionistFollowupService],
  controllers: [ReceptionistFollowupController],
})
export class ReceptionistFollowupModule {}
