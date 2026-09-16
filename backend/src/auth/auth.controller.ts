import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Register User' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login User' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Admin: Request OTP for PIN reset' })
  @Post('admin-forgot-pin/request-otp')
  requestOtp(@Body('phone') phone: string) {
    return this.authService.requestAdminOtp(phone);
  }

  @ApiOperation({ summary: 'Admin: Verify OTP for PIN reset' })
  @Post('admin-forgot-pin/verify-otp')
  verifyOtp(@Body() dto: { phone: string; otp: string }) {
    return this.authService.verifyAdminOtp(dto.phone, dto.otp);
  }

  @ApiOperation({ summary: 'Admin: Reset PIN with verified OTP' })
  @Post('admin-forgot-pin/reset')
  resetPin(@Body() dto: { phone: string; otp: string; newPin: string }) {
    return this.authService.resetAdminPinWithOtp(dto.phone, dto.otp, dto.newPin);
  }
}