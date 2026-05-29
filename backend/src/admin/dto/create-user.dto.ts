import { IsString, IsEmail, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'user@clinic.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @MinLength(4)
  pin: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  // Doctor-specific fields (optional)
  @ApiProperty({ example: 'Cardiologist', required: false })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiProperty({ example: 'Available', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}