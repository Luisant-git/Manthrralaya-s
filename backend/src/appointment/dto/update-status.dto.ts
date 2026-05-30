import { IsString, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn(['Scheduled', 'Arrived', 'Checked-in', 'Completed', 'Cancelled', 'Waiting'])
  status: string;
}