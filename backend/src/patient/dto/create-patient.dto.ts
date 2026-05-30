import { IsString, IsInt, IsOptional, Min, Max, IsIn, Matches } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  @Max(120)
  age: number;

  @IsOptional()
  @IsString()
  @IsIn(['Male', 'Female', 'Other'])
  gender?: string;

  @IsString()
  @Matches(/^[0-9+\-\s()]+$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;
}