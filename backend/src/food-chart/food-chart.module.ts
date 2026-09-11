import { Module } from '@nestjs/common';
import { FoodChartService } from './food-chart.service';
import { FoodChartController } from './food-chart.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FoodChartController],
  providers: [FoodChartService],
})
export class FoodChartModule {}
