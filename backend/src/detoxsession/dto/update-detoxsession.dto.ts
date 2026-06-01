import { PartialType } from '@nestjs/swagger';
import { CreateDetoxsessionDto } from './create-detoxsession.dto';

export class UpdateDetoxsessionDto extends PartialType(CreateDetoxsessionDto) {}
