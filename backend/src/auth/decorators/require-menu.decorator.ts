import { SetMetadata } from '@nestjs/common';

export const MENU_KEY = 'required_menus';

export const RequireMenu = (...menus: string[]) => SetMetadata(MENU_KEY, menus);