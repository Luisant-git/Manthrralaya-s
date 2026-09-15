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
  @IsIn(['New consultation', 'Detox', 'Detox (FN)', 'Detox (AN)', 'Admission', 'Dorn', 'Review', 'Others'])
  appointmentType: string;

  @IsOptional()
  @IsString()
  session?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}