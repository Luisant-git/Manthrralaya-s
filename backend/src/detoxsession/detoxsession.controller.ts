import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DetoxsessionService } from './detoxsession.service';
import { CreateDetoxsessionDto } from './dto/create-detoxsession.dto';
import { UpdateDetoxsessionDto } from './dto/update-detoxsession.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('detox-sessions')
@ApiBearerAuth()
@Controller('detox-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DetoxsessionController {
  constructor(private readonly detoxsessionService: DetoxsessionService) {}

  @Post()
  @Roles('DOCTOR', 'ADMIN', 'THERAPIST')
  @ApiOperation({ summary: 'Create a new detox session' })
  create(@Body() createDetoxsessionDto: CreateDetoxsessionDto) {
    return this.detoxsessionService.create(createDetoxsessionDto);
  }

  @Get()
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST', 'THERAPIST')
  @ApiOperation({ summary: 'Get all detox sessions' })
  findAll() {
    return this.detoxsessionService.findAll();
  }

  @Get('patient/:patientId')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST', 'THERAPIST')
  @ApiOperation({ summary: 'Get detox sessions by patient ID' })
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.detoxsessionService.findByPatient(patientId);
  }

  @Get('patient/:patientId/progress')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST', 'THERAPIST')
  @ApiOperation({ summary: 'Get patient detox session progress' })
  getPatientProgress(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.detoxsessionService.getPatientSessionProgress(patientId);
  }

  @Get('doctor/:doctorId')
  @Roles('DOCTOR', 'ADMIN', 'THERAPIST')
  @ApiOperation({ summary: 'Get detox sessions by doctor ID' })
  findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.detoxsessionService.findByDoctor(doctorId);
  }

  @Get('followups/upcoming')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST', 'THERAPIST')
  @ApiOperation({ summary: 'Get upcoming detox follow-ups' })
  getUpcomingFollowups() {
    return this.detoxsessionService.getUpcomingFollowups();
  }

  @Get(':id')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST', 'THERAPIST')
  @ApiOperation({ summary: 'Get detox session by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.detoxsessionService.findOne(id);
  }

  @Patch(':id')
  @Roles('DOCTOR', 'ADMIN', 'THERAPIST')
  @ApiOperation({ summary: 'Update detox session' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDetoxsessionDto: UpdateDetoxsessionDto,
  ) {
    return this.detoxsessionService.update(id, updateDetoxsessionDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete detox session' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.detoxsessionService.remove(id);
  }
}