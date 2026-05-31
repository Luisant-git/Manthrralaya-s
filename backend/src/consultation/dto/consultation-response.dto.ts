import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsultationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  patientId: number;

  @ApiProperty()
  doctorId: number;

  @ApiPropertyOptional()
  appointmentId: number;

  @ApiProperty()
  consultationDate: Date;

  @ApiPropertyOptional()
  consultationNotes: string;

  @ApiPropertyOptional()
  medicalHistoryNotes: string;

  @ApiPropertyOptional()
  detoxProcedureNotes: string;

  @ApiPropertyOptional()
  dietPlanNotes: string;

  @ApiPropertyOptional()
  homecareGuideliness: string;

  @ApiProperty()
  detoxRecommended: boolean;

  @ApiPropertyOptional()
  detoxDoctorId: number;

  @ApiPropertyOptional()
  followupDate: Date;

  @ApiPropertyOptional()
  followupRemarks: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}