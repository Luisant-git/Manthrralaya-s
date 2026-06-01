import { Module } from '@nestjs/common';
import { DetoxsessionService } from './detoxsession.service';
import { DetoxsessionController } from './detoxsession.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
   imports: [PrismaModule],
  controllers: [DetoxsessionController],
  providers: [DetoxsessionService],
})
export class DetoxsessionModule {}
