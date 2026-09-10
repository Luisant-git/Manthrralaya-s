import { IsInt, IsArray, ArrayMinSize, ValidateNested, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleDayDto {
  @IsDateString()
  date: string;

  @IsBoolean()
  isAvailable: boolean;
}

export class UpsertWeekScheduleDto {
  @IsInt()
  doctorId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  days: ScheduleDayDto[];
}