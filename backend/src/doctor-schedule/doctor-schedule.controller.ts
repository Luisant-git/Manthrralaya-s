import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DoctorScheduleService } from './doctor-schedule.service';
import { UpsertWeekScheduleDto } from './dto/upsert-week-schedule.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('doctor-schedule')
@ApiBearerAuth()
@Controller('doctor-schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorScheduleController {
  constructor(private readonly doctorScheduleService: DoctorScheduleService) {}

  @Get(':doctorId')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Get doctor weekly availability schedule' })
  @ApiQuery({ name: 'from', required: true, example: '2026-09-07' })
  @ApiQuery({ name: 'to', required: true, example: '2026-09-13' })
  getWeek(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.doctorScheduleService.getWeek(doctorId, from, to);
  }

  @Post('week')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Bulk upsert doctor availability for a week' })
  upsertWeek(@Body() upsertWeekScheduleDto: UpsertWeekScheduleDto) {
    return this.doctorScheduleService.upsertWeek(upsertWeekScheduleDto);
  }
}