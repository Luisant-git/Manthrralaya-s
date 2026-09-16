import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { MENU_KEY } from '../decorators/require-menu.decorator';

@Injectable()
export class MenuPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredMenus = this.reflector.getAllAndOverride<string[]>(
      MENU_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredMenus || requiredMenus.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Admin always has access (can reach Settings to manage grants)
    if (user.role === UserRole.ADMIN) return true;

    const record = await this.prisma.menuPermission.findUnique({
      where: { role: user.role },
    });

    // Role has a saved permission record -> enforce it strictly.
    // Not granted -> block, even if the legacy RolesGuard would allow it.
    if (record) {
      const menus = (record.permissions as any)?.menus || {};
      const granted = requiredMenus.some((menuId) => menus[menuId] === true);
      if (!granted) {
        throw new ForbiddenException('Access denied');
      }
    }

    // No saved record -> fall back to the legacy RolesGuard rules.
    return true;
  }
}