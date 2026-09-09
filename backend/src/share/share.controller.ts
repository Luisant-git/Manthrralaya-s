import { Controller, Post, Body, Get, Query, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('shares')
@UseGuards(JwtAuthGuard)
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateShareDto) {
    return this.shareService.create(dto, req.user);
  }

  @Get('doctor/:doctorId')
  findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number, @Query('from') from?: string, @Query('to') to?: string) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.shareService.findByDoctor(doctorId, fromDate, toDate);
  }
}
