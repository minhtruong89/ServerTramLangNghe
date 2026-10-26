"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const fs = require("fs");
const path = require("path");
let UploadService = UploadService_1 = class UploadService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UploadService_1.name);
    }
    async handleFileUpload(conversationId, file) {
        if (!conversationId) {
            throw new common_1.BadRequestException({
                error: 'MISSING_CONVERSATION_ID',
                message: 'Yêu cầu conversationId khi upload file',
            });
        }
        if (!file) {
            throw new common_1.BadRequestException({
                error: 'MISSING_FILE',
                message: 'Không tìm thấy file tải lên',
            });
        }
        const conv = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });
        if (!conv) {
            throw new common_1.NotFoundException({
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
    getFilePath(fileName) {
        const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
        const fullPath = path.join(uploadDir, fileName);
        if (!fs.existsSync(fullPath)) {
            throw new common_1.NotFoundException({
                error: 'FILE_NOT_FOUND',
                message: 'Không tìm thấy file yêu cầu',
            });
        }
        return fullPath;
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UploadService);
//# sourceMappingURL=upload.service.js.map