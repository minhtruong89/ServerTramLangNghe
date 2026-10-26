import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadResultDto {
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleFileUpload(
    conversationId: string,
    file: Express.Multer.File,
  ): Promise<UploadResultDto> {
    if (!conversationId) {
      throw new BadRequestException({
        error: 'MISSING_CONVERSATION_ID',
        message: 'Yêu cầu conversationId khi upload file',
      });
    }

    if (!file) {
      throw new BadRequestException({
        error: 'MISSING_FILE',
        message: 'Không tìm thấy file tải lên',
      });
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException({
        error: 'CONVERSATION_NOT_FOUND',
        message: 'Phiên hội thoại không tồn tại',
      });
    }

    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    const targetFileName = `${conversationId}_${timestamp}${ext}`;

    const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const targetFilePath = path.join(uploadDir, targetFileName);
    fs.writeFileSync(targetFilePath, file.buffer);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/api/v1/files/${targetFileName}`;

    await this.prisma.uploadedFile.create({
      data: {
        conversationId,
        fileName: targetFileName,
        originalName: file.originalname,
        filePath: targetFilePath,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    return {
      fileName: targetFileName,
      fileUrl,
      uploadedAt: timestamp.toString(),
    };
  }

  getFilePath(fileName: string): string {
    const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
    const fullPath = path.join(uploadDir, fileName);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException({
        error: 'FILE_NOT_FOUND',
        message: 'Không tìm thấy file yêu cầu',
      });
    }
    return fullPath;
  }
}
