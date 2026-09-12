import { Controller, Post, Body, Get, Query, Param, ParseIntPipe, Req, UseGuards, Delete } from '@nestjs/common';
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

  @Get('from-doctor/:doctorId')
  findByFromDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.shareService.findByFromDoctor(doctorId);
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.shareService.findByPatient(patientId);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.shareService.delete(id);
  }
}
