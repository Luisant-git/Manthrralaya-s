import { Module } from '@nestjs/common';
import { MenuPermissionService } from './menu-permission.service';
import { MenuPermissionController } from './menu-permission.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MenuPermissionController],
  providers: [MenuPermissionService],
})
export class MenuPermissionModule {}
