import { IsString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'admin@clinic.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @MinLength(4)
  pin: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsOptional()
  @IsString()
  phone?: string;  
}