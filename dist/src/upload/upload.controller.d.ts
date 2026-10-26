import { UploadService, UploadResultDto } from './upload.service';
import { Response } from 'express';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadFile(conversationId: string, file: Express.Multer.File): Promise<UploadResultDto>;
    serveFile(fileName: string, res: Response): Promise<void>;
}
