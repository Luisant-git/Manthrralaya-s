import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  create(@Body() createPatientDto: CreatePatientDto, @Req() req) {
    return this.patientService.create(createPatientDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients' })
  findAll(@Req() req) {
    return this.patientService.findAll(req.user);
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: 'Find patient by phone number' })
  findByPhone(@Param('phone') phone: string, @Req() req) {
    return this.patientService.findByPhone(phone, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete patient' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.remove(id);
  }
}
