import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPin = await bcrypt.hash(dto.pin, 10);

    const user = await this.userService.create({
      ...dto,
      pin: hashedPin,
    });

    return { message: 'User created', user };
  }

 async login(dto: LoginDto) {
  const user = await this.userService.findByEmail(dto.email);

  if (!user) throw new UnauthorizedException('User not found');

  const isMatch = await bcrypt.compare(dto.pin, user.pin);
  if (!isMatch) throw new UnauthorizedException('Invalid PIN');

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
  };
}
}