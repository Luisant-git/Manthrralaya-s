import { IsInt, IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @IsInt()
  @Type(() => Number)
  patientId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
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

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  bookedByUserId?: number;
}