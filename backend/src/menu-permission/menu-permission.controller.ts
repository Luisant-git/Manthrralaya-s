import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MenuPermissionService } from './menu-permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Menu Permission')
@ApiBearerAuth()
@Controller('menu-permission')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuPermissionController {
  constructor(private readonly menuPermissionService: MenuPermissionService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get menu permissions for the logged-in user role' })
  async getMyPermissions(@Req() req: any) {
    const role = req.user.role as UserRole;
    return this.menuPermissionService.getByRole(role);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all role menu permissions (Admin only)' })
  async getAllPermissions() {
    return this.menuPermissionService.getAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create or update menu permissions for a role (Admin only)' })
  async upsert(@Body() body: { role: UserRole; permissions: any }) {
    return this.menuPermissionService.upsert(body.role, body.permissions);
  }
}
