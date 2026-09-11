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
  @ApiOperation({ summary: 'Get all appointments (optionally paginated/filtered)' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (page + pageSize enables pagination)' })
  @ApiQuery({ name: 'pageSize', required: false, example: 8, description: 'Number of items per page' })
  @ApiQuery({ name: 'date', required: false, example: '2024-01-15', description: 'Filter by appointment date' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by patient name' })
  @ApiQuery({ name: 'appointmentType', required: false, description: 'Filter by appointment type' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by doctor ID' })
  @ApiQuery({ name: 'from', required: false, example: '2024-01-01', description: 'Start date of range' })
  @ApiQuery({ name: 'to', required: false, example: '2024-01-31', description: 'End date of range' })
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('date') date?: string,
    @Query('search') search?: string,
    @Query('appointmentType') appointmentType?: string,
    @Query('doctorId') doctorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.appointmentService.findAll(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
      date || undefined,
      {
        search: search || undefined,
        appointmentType: appointmentType || undefined,
        doctorId: doctorId ? parseInt(doctorId, 10) : undefined,
        from: from || undefined,
        to: to || undefined,
      },
    );
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