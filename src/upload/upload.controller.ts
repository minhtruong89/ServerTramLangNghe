import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService, UploadResultDto } from './upload.service';
import { SlidingAuthGuard } from '../auth/sliding-auth.guard';
import { Response } from 'express';

@Controller('api/v1')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload')
  @UseGuards(SlidingAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadFile(
    @Body('conversationId') conversationId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResultDto> {
    return await this.uploadService.handleFileUpload(conversationId, file);
  }

  @Get('files/:fileName')
  async serveFile(@Param('fileName') fileName: string, @Res() res: Response) {
    const filePath = this.uploadService.getFilePath(fileName);
    return res.sendFile(filePath);
  }
}
