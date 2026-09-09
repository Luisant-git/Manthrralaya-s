import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShareDto {
  @Type(() => Number)
  @IsInt()
  patientId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fromDoctorId?: number;

  @Type(() => Number)
  @IsInt()
  toDoctorId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
