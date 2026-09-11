import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards, UploadedFile, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post('upload-report-images')
  @Roles('DOCTOR', 'ADMIN')
  @ApiOperation({ summary: 'Upload multiple images for medical reports' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('images', 12, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
          const reportsDir = path.join(uploadsDir, 'medical-reports');
          fs.mkdirSync(reportsDir, { recursive: true });
          cb(null, reportsDir);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40);
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeBase}${ext}`);
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadReportImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }
    const urls = files.map(f => `/uploads/medical-reports/${f.filename}`);
    return { urls };
  }

  @Post()
  @Roles('DOCTOR', 'ADMIN')
  @ApiOperation({ summary: 'Create a new consultation' })
  @ApiResponse({ status: 201, description: 'Consultation created successfully' })
  create(@Body() createConsultationDto: CreateConsultationDto) {
    return this.consultationService.create(createConsultationDto);
  }

  @Get()
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST', 'THERAPIST')
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
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST', 'THERAPIST')
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
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST', 'THERAPIST')
  @ApiOperation({ summary: 'Get consultation by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultationService.findOne(id);
  }

  @Patch(':id')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST') // Allow receptionists to update consultations
  @ApiOperation({ summary: 'Update consultation' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConsultationDto: UpdateConsultationDto,
  ) {
    return this.consultationService.update(id, updateConsultationDto);
  }

  @Patch(':id/receptionist-followup')
  @Roles('RECEPTIONIST', 'ADMIN', 'DOCTOR', 'THERAPIST')
  @ApiOperation({ summary: 'Update receptionist-specific follow-up notes for a consultation' })
  updateReceptionistFollowup(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { followupDate?: string; notes?: string; status?: string },
  ) {
    return this.consultationService.updateReceptionistNotes(id, data);
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

  @Post(':id/upload-pdf')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');

    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const dest = path.join(uploadsDir, `consultation-${id}.pdf`);
    await fs.promises.writeFile(dest, file.buffer);

    // Trigger upload + send
    await this.consultationService.sendPdfForConsultation(id, file.buffer, `consultation-${id}.pdf`);

    return { message: 'Uploaded and scheduled WhatsApp send' };
  }
}