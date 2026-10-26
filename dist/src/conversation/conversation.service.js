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
var ConversationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_files_service_1 = require("../config-files/config-files.service");
const llm_service_1 = require("../llm/llm.service");
const GREETING_START_MESSAGE = 'Con chào cô/bác. Con là Trạm Lắng Nghe của Quỹ Bông Sen, ở đây để lắng nghe hoàn cảnh của cô/bác. ' +
    'Để Quỹ Bông Sen có thể kiểm tra hoàn cảnh và xem xét hỗ trợ, con xin phép ghi nhận những thông tin cô/bác chia sẻ và các giấy tờ, hình ảnh liên quan đến hoàn cảnh của cô/bác. ' +
    'Trong đó có thể có thông tin cá nhân và thông tin sức khỏe. Những thông tin này sẽ được lưu trong hồ sơ và chỉ sử dụng để xem xét hỗ trợ, kiểm tra và hậu kiểm. ' +
    "Cô/bác có đồng ý không ạ? Nếu đồng ý, cô/bác vui lòng nói 'Tôi đồng ý'. Nếu không đồng ý, cô/bác vui lòng nói 'Không đồng ý'.";
let ConversationService = ConversationService_1 = class ConversationService {
    constructor(prisma, configService, llmService) {
        this.prisma = prisma;
        this.configService = configService;
        this.llmService = llmService;
        this.logger = new common_1.Logger(ConversationService_1.name);
    }
    async handleConversation(dto) {
        const action = (dto.action || '').trim().toUpperCase();
        const nowTimestamp = Date.now().toString();
        if (action === 'START') {
            return await this.handleStart(dto, nowTimestamp);
        }
        if (!dto.conversationId) {
            throw new common_1.BadRequestException({
                error: 'MISSING_CONVERSATION_ID',
                message: 'Yêu cầu conversationId để tiếp tục hội thoại',
            });
        }
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: dto.conversationId },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        if (!conversation) {
            throw new common_1.NotFoundException({
                error: 'CONVERSATION_NOT_FOUND',
                message: 'Phiên hội thoại không tồn tại',
            });
        }
        if (conversation.status === 'FINISHED') {
            throw new common_1.ConflictException({
                error: 'CONVERSATION_FINISHED',
                message: 'Phiên hội thoại này đã kết thúc',
            });
        }
        await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastActiveAt: new Date() },
        });
        if (action === 'CONFIRM') {
            return await this.handleConfirm(conversation, dto, nowTimestamp);
        }
        if (action === 'UPLOAD') {
            return await this.handleUploadAction(conversation, dto, nowTimestamp);
        }
        return await this.handlePending(conversation, dto, nowTimestamp);
    }
    async handleStart(dto, nowTimestamp) {
        if (!dto.atmId) {
            throw new common_1.BadRequestException({
                error: 'MISSING_ATM_ID',
                message: 'Yêu cầu atmId khi khởi tạo START',
            });
        }
        const maxPerTx = this.configService.getMaxPerTransaction();
        const proposedAmount = dto.proposedAmount ?? 0;
        if (proposedAmount <= 0 || proposedAmount > maxPerTx) {
            throw new common_1.BadRequestException({
                error: 'INVALID_PROPOSED_AMOUNT',
                message: `Số tiền người bảo chứng đề xuất phải lớn hơn 0 và không vượt quá ${maxPerTx.toLocaleString('vi-VN')} VND (max_per_transaction).`,
            });
        }
        const conversationId = `CONV_${Date.now()}`;
        await this.prisma.conversation.create({
            data: {
                id: conversationId,
                atmId: dto.atmId,
                staffIds: dto.staffList,
                proposedAmount,
                status: 'START',
            },
        });
        await this.prisma.message.create({
            data: {
                conversationId,
                role: 'assistant',
                action: 'START',
                content: GREETING_START_MESSAGE,
                clientTimestamp: dto.timestamp || nowTimestamp,
            },
        });
        return {
            conversationId,
            status: 'START',
            message: GREETING_START_MESSAGE,
            timestamp: nowTimestamp,
        };
    }
    async handlePending(conversation, dto, nowTimestamp) {
        const userMessage = (dto.message || '').trim();
        await this.prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                action: 'PENDING',
                content: userMessage,
                clientTimestamp: dto.timestamp || nowTimestamp,
            },
        });
        if (userMessage.toLowerCase().includes('không đồng ý') ||
            userMessage.toLowerCase().includes('khong dong y')) {
            const rejectMsg = 'Dạ con cảm ơn cô/bác. Vì chưa có sự đồng ý nên con xin phép tạm dừng cuộc gọi tại đây. Chúc cô/bác nhiều sức khỏe ạ.';
            await this.saveAssistantResponse(conversation.id, 'FINISHED', rejectMsg, nowTimestamp);
            return {
                conversationId: conversation.id,
                status: 'FINISHED',
                message: rejectMsg,
                timestamp: nowTimestamp,
            };
        }
        const history = await this.prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
        });
        const llmHistory = history.map((h) => ({
            role: h.role,
            content: h.content,
        }));
        const llmResult = await this.llmService.processConversationTurn(llmHistory);
        await this.saveAssistantResponse(conversation.id, llmResult.status, llmResult.message, nowTimestamp);
        return {
            conversationId: conversation.id,
            status: llmResult.status,
            message: llmResult.message,
            timestamp: nowTimestamp,
        };
    }
    async handleUploadAction(conversation, dto, nowTimestamp) {
        const userMessage = dto.message || 'Đã tải lên hình ảnh hồ sơ bệnh án';
        await this.prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                action: 'UPLOAD',
                content: userMessage,
                clientTimestamp: dto.timestamp || nowTimestamp,
            },
        });
        const history = await this.prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
        });
        const llmResult = await this.llmService.processConversationTurn(history.map((h) => ({
            role: h.role,
            content: h.content,
        })));
        await this.saveAssistantResponse(conversation.id, llmResult.status, llmResult.message, nowTimestamp);
        return {
            conversationId: conversation.id,
            status: llmResult.status,
            message: llmResult.message,
            timestamp: nowTimestamp,
        };
    }
    async handleConfirm(conversation, dto, nowTimestamp) {
        const userConfirm = (dto.message || '').trim().toUpperCase();
        await this.prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                action: 'CONFIRM',
                content: dto.message || '',
                clientTimestamp: dto.timestamp || nowTimestamp,
            },
        });
        if (userConfirm === 'YES' || userConfirm === 'ĐÚNG' || userConfirm === 'DUNG') {
            const finishMsg = 'Con cảm ơn cô bác đã chia sẻ hoàn cảnh của mình. Con sẽ gửi hồ sơ này về Quỹ Bông Sen để xem xét. Nhân viên của Quỹ có thể liên hệ lại để xác minh thêm. Con chúc cô bác nhiều sức khỏe và mong mọi chuyện sớm tốt hơn.';
            await this.saveAssistantResponse(conversation.id, 'FINISHED', finishMsg, nowTimestamp);
            return {
                conversationId: conversation.id,
                status: 'FINISHED',
                message: finishMsg,
                timestamp: nowTimestamp,
            };
        }
        const editMsg = 'Dạ cô bác cho con biết mình cần sửa đổi hoặc bổ sung thêm thông tin nào ạ?';
        await this.saveAssistantResponse(conversation.id, 'PENDING', editMsg, nowTimestamp);
        return {
            conversationId: conversation.id,
            status: 'PENDING',
            message: editMsg,
            timestamp: nowTimestamp,
        };
    }
    async saveAssistantResponse(conversationId, status, message, timestamp) {
        await this.prisma.message.create({
            data: {
                conversationId,
                role: 'assistant',
                action: status,
                content: message,
                clientTimestamp: timestamp,
            },
        });
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { status },
        });
    }
};
exports.ConversationService = ConversationService;
exports.ConversationService = ConversationService = ConversationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_files_service_1.ConfigFilesService,
        llm_service_1.LlmService])
], ConversationService);
//# sourceMappingURL=conversation.service.js.map