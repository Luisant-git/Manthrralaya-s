import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminService } from '../admin/admin.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private adminService: AdminService,
    private jwtService: JwtService,
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
      pin: dto.pin,  // Pass plain pin
      fullName: dto.fullName,
      phone: dto.phone,
    });

    return { 
      message: 'Admin created successfully', 
      user: result.data.user 
    };
  }

  async login(dto: LoginDto) {
    const user = await this.adminService.findByEmail(dto.email);

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
      email: user.email,
      role: user.role,
      name: user.fullName,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      role: user.role,
      name: user.fullName,
      email: user.email,
      userId: user.id,
    };
  }
}