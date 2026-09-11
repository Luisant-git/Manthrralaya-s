import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class CreateConsultationDto {
  @ApiProperty({ example: 1, description: 'Patient ID' })
  @IsInt()
  patientId: number;

  @ApiProperty({ example: 1, description: 'Doctor ID' })
  @IsInt()
  doctorId: number;

  @ApiPropertyOptional({ example: '2026-09-11T10:30:00.000Z', description: 'Consultation date/time (defaults to now)' })
  @IsOptional()
  @IsDateString()
  consultationDate?: string;

  @ApiPropertyOptional({ example: 5, description: 'Appointment ID' })
  @IsOptional()
  @IsInt()
  appointmentId?: number;

  @ApiPropertyOptional({ example: 'Patient presented with cough and fever for 3 days' })
  @IsOptional()
  @IsString()
  consultationNotes?: string;

  @ApiPropertyOptional({ example: 'History of hypertension, diabetes since 2019' })
  @IsOptional()
  @IsString()
  medicalHistoryNotes?: string;

  @ApiPropertyOptional({ example: 'Detox procedure: 3-day juice cleanse' })
  @IsOptional()
  @IsString()
  detoxProcedureNotes?: string;

  @ApiPropertyOptional({ example: 'Low carb, high protein diet recommended' })
  @IsOptional()
  @IsString()
  dietPlanNotes?: string;

  @ApiPropertyOptional({ example: 'Rest for 3 days, avoid strenuous activity' })
  @IsOptional()
  @IsString()
  homecareGuideliness?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  detoxRecommended?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Recommended Detox Doctor ID' })
  @IsOptional()
  @IsInt()
  detoxDoctorId?: number;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  followupDate?: string;

  @ApiPropertyOptional({ example: 'Call patient to confirm detox preparation' })
  @IsOptional()
  @IsString()
  followupRemarks?: string;

  @ApiPropertyOptional({ example: '<p>X-ray report attached</p>' })
  @IsOptional()
  @IsString()
  medicalReports?: string;

  @ApiPropertyOptional({ example: 5, description: 'Number of detox morning sessions recommended' })
  @IsOptional()
  @IsInt()
  detoxMorningSessions?: number;

  @ApiPropertyOptional({ example: 3, description: 'Number of detox evening sessions recommended' })
  @IsOptional()
  @IsInt()
  detoxEveningSessions?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  admissionRecommended?: boolean;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @ApiPropertyOptional({ example: 3, description: 'Recommended Admission Doctor ID' })
  @IsOptional()
  @IsInt()
  admissionDoctorId?: number;

  @ApiPropertyOptional({ example: 'Arrange bed on arrival, notify billing desk' })
  @IsOptional()
  @IsString()
  admissionRemarks?: string;
}