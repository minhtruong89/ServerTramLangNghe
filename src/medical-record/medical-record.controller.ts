import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  MedicalRecordService,
  MedicalRecordRequestDto,
  MedicalRecordResponseDto,
} from './medical-record.service';
import { SlidingAuthGuard } from '../auth/sliding-auth.guard';

@Controller('api/v1')
export class MedicalRecordController {
  constructor(private readonly recordService: MedicalRecordService) {}

  @Post('medical-record')
  @UseGuards(SlidingAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createMedicalRecord(
    @Body() dto: MedicalRecordRequestDto,
  ): Promise<MedicalRecordResponseDto> {
    return await this.recordService.processMedicalRecord(dto);
  }
}
