import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { FoodChartService } from './food-chart.service';

@Controller('food-chart')
export class FoodChartController {
  constructor(private readonly foodChartService: FoodChartService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.foodChartService.create(createDto);
  }

  @Get('patient/:patientId')
  findAllByPatient(@Param('patientId') patientId: string) {
    return this.foodChartService.findAllByPatient(+patientId);
  }

  @Get('consultation/:consultationId')
  findAllByConsultation(@Param('consultationId') consultationId: string) {
    return this.foodChartService.findAllByConsultation(+consultationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.foodChartService.update(+id, updateDto);
  }
}
