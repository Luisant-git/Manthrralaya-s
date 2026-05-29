import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users') // ✅ IMPORTANT: shows section in Swagger
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // ✅ GET ALL USERS
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (ADMIN only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async getAllUsers() {
    return this.userService.findAll();
  }

  // ✅ GET USER BY ID
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.findById(Number(id));
  }

  // ✅ GET USER BY EMAIL
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by email' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }
}