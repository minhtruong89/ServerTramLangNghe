import { PrismaService } from '../prisma/prisma.service';
export interface UploadResultDto {
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
}
export declare class UploadService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleFileUpload(conversationId: string, file: Express.Multer.File): Promise<UploadResultDto>;
    getFilePath(fileName: string): string;
}
