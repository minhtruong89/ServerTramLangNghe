import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ValidateService, ValidateAtmStaffRequest, ValidateAtmStaffResponse } from './validate.service';
import { SlidingAuthGuard } from '../auth/sliding-auth.guard';

@Controller('api/v1')
export class ValidateController {
  constructor(private readonly validateService: ValidateService) {}

  @Post('validate-atm-staff')
  @UseGuards(SlidingAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validate(
    @Body() dto: ValidateAtmStaffRequest,
  ): Promise<ValidateAtmStaffResponse> {
    return await this.validateService.validateAtmAndStaff(dto);
  }
}
