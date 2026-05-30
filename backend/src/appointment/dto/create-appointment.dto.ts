import { IsInt, IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  patientId: number;

  @IsOptional()
  @IsInt()
  doctorId?: number;

  @IsDateString()
  appointmentDate: string;

  @IsString()
  @IsIn(['Initial consultation', 'Detox', 'Review'])
  appointmentType: string;

  @IsOptional()
  @IsString()
  @IsIn(['FN', 'AN'])
  session?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}