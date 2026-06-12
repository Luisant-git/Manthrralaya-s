import { Module } from '@nestjs/common';
import { ReceptionistFollowupService } from './receptionist-followup.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReceptionistFollowupService],
  exports: [ReceptionistFollowupService],
})
export class ReceptionistFollowupModule {}
