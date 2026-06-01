import { Controller, Post, Body, UseGuards, Get, Param, Patch, Delete, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}


  
  // Get user by ID (specific route before generic :role routes)
  @ApiOperation({ summary: 'Get user by ID' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @Get('user/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(Number(id));
  }

  // Update user status
  @ApiOperation({ summary: 'Activate/Deactivate user' })
  @Roles(UserRole.ADMIN)
  @Patch('user/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.updateUserStatus(Number(id), isActive);
  }

  // Reset user PIN
  @ApiOperation({ summary: 'Reset staff access PIN' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @Patch('user/:id/pin')
  resetPin(
    @Param('id') id: string,
    @Body() body: { pin: string },
    @Req() req: any,
  ) {
    return this.adminService.resetUserPin(Number(id), body.pin, req.user.role, req.user.sub);
  }

  // Update user details
  @ApiOperation({ summary: 'Update staff details' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @Patch('user/:id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.adminService.updateUser(Number(id), dto);
  }

  // Delete user
  @ApiOperation({ summary: 'Delete user' })
  @Roles(UserRole.ADMIN)
  @Delete('user/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(Number(id));
  }

  // Update doctor status
  @ApiOperation({ summary: 'Update doctor availability status' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Patch('doctor/:id/status')
  updateDoctorStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateDoctorStatus(Number(id), body.status);
  }


  
  // Create user by role (receptionist/doctor)
  @ApiOperation({ summary: 'Create user by role (receptionist/doctor)' })
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'role', enum: UserRole, description: 'User role' })
  @Post(':role')
  createUser(
    @Param('role') role: UserRole,
    @Body() dto: CreateUserDto
  ) {
    return this.adminService.createUser(role, dto);
  }

  // Get all users by role
  @ApiOperation({ summary: 'Get all users by role' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiParam({ name: 'role', enum: UserRole, description: 'User role' })
  @Get(':role')
  getUsersByRole(@Param('role') role: UserRole) {
    return this.adminService.getUsersByRole(role);
  }
}