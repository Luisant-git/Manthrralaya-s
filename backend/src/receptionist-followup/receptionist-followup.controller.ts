import { Controller, Post, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ReceptionistFollowupService } from './receptionist-followup.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('receptionist-followup')
@ApiBearerAuth()
@Controller('receptionist-followup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceptionistFollowupController {
  constructor(private readonly service: ReceptionistFollowupService) {}

  @Post(':consultationId/send-reminder')
  @Roles('RECEPTIONIST', 'ADMIN')
  @ApiOperation({ summary: 'Send follow-up reminder for a consultation' })
  async sendReminder(@Param('consultationId', ParseIntPipe) consultationId: number) {
    return this.service.sendFollowupReminder(consultationId);
  }
}
