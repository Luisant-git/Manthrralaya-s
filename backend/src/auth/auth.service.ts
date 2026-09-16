import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminService } from '../admin/admin.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { OtpService } from './otp.service';
import { sendWhatsappTextMessage } from '../common/whatsapp.util';

@Injectable()
export class AuthService {
  constructor(
    private adminService: AdminService,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if ADMIN already exists ONLY if trying to register a new ADMIN
    if (dto.role === UserRole.ADMIN) {
      const existingAdmin = await this.adminService.findByRole(UserRole.ADMIN);
      if (existingAdmin) {
        throw new ForbiddenException('ADMIN already exists. Cannot register another admin.');
      }
    }

    
   
    const result = await this.adminService.createUser(dto.role, {
      email: dto.email,
      username: dto.username,
      pin: dto.pin,  // Pass plain pin
      fullName: dto.fullName,
      phone: dto.phone,
    }, true);

    return { 
      message: 'Admin created successfully', 
      user: result.data.user 
    };
  }

  async login(dto: LoginDto) {
    const user = await this.adminService.findByUsername(dto.username);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Contact administrator.');
    }

    const isMatch = await bcrypt.compare(dto.pin, user.pin);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Update last login
    await this.adminService.updateLastLogin(user.id);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.fullName,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      role: user.role,
      name: user.fullName,
      email: user.email,
      username: user.username,
      userId: user.id,
    };
  }

  async requestAdminOtp(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new BadRequestException('Please enter a valid registered mobile number.');
    }

    const user = await this.adminService.findByUsername('admin');
    if (!user) {
      throw new BadRequestException('Admin account not found.');
    }

    const userPhone = (user.phone || '').replace(/\D/g, '');
    const phone10 = cleanPhone.slice(-10);
    const userPhone10 = userPhone.slice(-10);

    if (phone10 !== userPhone10) {
      throw new BadRequestException('This mobile number is not registered with the admin account.');
    }

    const otpCode = this.otpService.create(cleanPhone, user.id);

    try {
      await sendWhatsappTextMessage(
        cleanPhone,
        `Your Manthrralaya's admin PIN reset OTP is: ${otpCode}\nThis code expires in 5 minutes. Do not share it with anyone.`,
      );
    } catch (err) {
      console.warn('WhatsApp OTP send failed, continuing anyway:', err?.message);
    }

    return {
      success: true,
      message: 'OTP sent to your registered mobile number.',
      debug_otp: otpCode,
    };
  }

  async verifyAdminOtp(phone: string, code: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    this.otpService.verify(cleanPhone, code);
    return {
      success: true,
      message: 'OTP verified. You can now set a new PIN.',
    };
  }

  async resetAdminPinWithOtp(phone: string, code: string, newPin: string) {
    const cleanPhone = phone.replace(/\D/g, '');

    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      throw new BadRequestException('PIN must be exactly 4 digits.');
    }

    const record = this.otpService.verify(cleanPhone, code);
    this.otpService.consumeVerified(cleanPhone);

    const hashedPin = await bcrypt.hash(newPin, 10);
    await this.adminService.resetUserPinRaw(record.userId, hashedPin);

    return {
      success: true,
      message: 'Admin PIN has been reset successfully. You can now login with your new PIN.',
    };
  }
}