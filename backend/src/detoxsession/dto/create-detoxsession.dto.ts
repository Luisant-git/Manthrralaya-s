import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsDateString, Min, Max } from 'class-validator';

export class CreateDetoxsessionDto {
  @ApiProperty({ example: 1, description: 'Patient ID' })
  @IsInt()
  patientId: number;

  @ApiPropertyOptional({ example: 2, description: 'Doctor conducting the session' })
  @IsOptional()
  @IsInt()
  doctorId?: number;

  @ApiPropertyOptional({ example: 5, description: 'Associated appointment ID' })
  @IsOptional()
  @IsInt()
  appointmentId?: number;

  @ApiPropertyOptional({ example: 10, description: 'Consultation that recommended this detox' })
  @IsOptional()
  @IsInt()
  consultationId?: number;

  @ApiProperty({ example: 1, description: 'Session number (1, 2, or 3)' })
  @IsInt()
  @Min(1)
  @Max(3)
  sessionNumber: number;

  @ApiProperty({ example: 'morning', description: 'morning, evening, or fullDay' })
  @IsString()
  sessionType: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @ApiPropertyOptional({ example: '<p>Detox procedure notes...</p>' })
  @IsOptional()
  @IsString()
  detoxNotes?: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  followupDate?: string;

  @ApiPropertyOptional({ example: 'Call patient for follow-up' })
  @IsOptional()
  @IsString()
  followupRemarks?: string;
}