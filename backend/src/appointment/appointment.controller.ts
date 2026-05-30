import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';


@ApiTags('appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  findAll() {
    return this.appointmentService.findAll();
  }

  @Get('date')
  @ApiOperation({ summary: 'Get appointments by date' })
  @ApiQuery({ name: 'date', required: true, example: '2024-01-15' })
  findByDate(@Query('date') date: string) {
    return this.appointmentService.findByDate(new Date(date));
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get appointments by patient ID' })
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.appointmentService.findByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get appointments by doctor ID' })
  findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.appointmentService.findByDoctor(doctorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto
  ) {
    return this.appointmentService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto
  ) {
    return this.appointmentService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.remove(id);
  }
}