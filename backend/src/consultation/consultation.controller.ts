import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  @Roles('DOCTOR', 'ADMIN')
  @ApiOperation({ summary: 'Create a new consultation' })
  @ApiResponse({ status: 201, description: 'Consultation created successfully' })
  create(@Body() createConsultationDto: CreateConsultationDto) {
    return this.consultationService.create(createConsultationDto);
  }

  @Get()
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get all consultations' })
  findAll() {
    return this.consultationService.findAll();
  }

  @Get('followups/pending')
  @Roles('RECEPTIONIST', 'ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get all pending follow-ups from consultations' })
  getPendingFollowups() {
    return this.consultationService.getPendingFollowups();
  }

  @Get('patient/:patientId')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get consultations by patient ID' })
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.consultationService.findByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  @Roles('DOCTOR', 'ADMIN')
  @ApiOperation({ summary: 'Get consultations by doctor ID' })
  findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.consultationService.findByDoctor(doctorId);
  }

  @Get('date-range')
  @Roles('DOCTOR', 'ADMIN')
  @ApiOperation({ summary: 'Get consultations by date range' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.consultationService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get consultation by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultationService.findOne(id);
  }

  @Patch(':id')
  @Roles('DOCTOR', 'ADMIN')
  @ApiOperation({ summary: 'Update consultation' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConsultationDto: UpdateConsultationDto,
  ) {
    return this.consultationService.update(id, updateConsultationDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete consultation' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.consultationService.remove(id);
  }

  @Delete('cleanup-duplicates')
@Roles('ADMIN')
async cleanupDuplicates() {
  return this.consultationService.cleanupDuplicates();
}
}