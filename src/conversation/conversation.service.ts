import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigFilesService } from '../config-files/config-files.service';
import { LlmService } from '../llm/llm.service';

export interface ConversationRequestDto {
  atmId?: string;
  staffList?: { staffId: string }[];
  proposedAmount?: number;
  conversationId?: string;
  action: 'START' | 'PENDING' | 'UPLOAD' | 'CONFIRM';
  message?: string;
  timestamp?: string;
}

export interface ConversationResponseDto {
  conversationId: string;
  status: 'START' | 'PENDING' | 'UPLOAD' | 'CONFIRM' | 'FINISHED';
  message: string;
  timestamp?: string;
}

const GREETING_START_MESSAGE =
  'Con chào cô/bác. Con là Trạm Lắng Nghe của Quỹ Bông Sen, ở đây để lắng nghe hoàn cảnh của cô/bác. ' +
  'Để Quỹ Bông Sen có thể kiểm tra hoàn cảnh và xem xét hỗ trợ, con xin phép ghi nhận những thông tin cô/bác chia sẻ và các giấy tờ, hình ảnh liên quan đến hoàn cảnh của cô/bác. ' +
  'Trong đó có thể có thông tin cá nhân và thông tin sức khỏe. Những thông tin này sẽ được lưu trong hồ sơ và chỉ sử dụng để xem xét hỗ trợ, kiểm tra và hậu kiểm. ' +
  "Cô/bác có đồng ý không ạ? Nếu đồng ý, cô/bác vui lòng nói 'Tôi đồng ý'. Nếu không đồng ý, cô/bác vui lòng nói 'Không đồng ý'.";

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigFilesService,
    private readonly llmService: LlmService,
  ) {}

  async handleConversation(
    dto: ConversationRequestDto,
  ): Promise<ConversationResponseDto> {
    const action = (dto.action || '').trim().toUpperCase() as any;
    const nowTimestamp = Date.now().toString();

    // 1. Xử lý Action START
    if (action === 'START') {
      return await this.handleStart(dto, nowTimestamp);
    }

    // 2. Các Action tiếp theo (PENDING, UPLOAD, CONFIRM)
    if (!dto.conversationId) {
      throw new BadRequestException({
        error: 'MISSING_CONVERSATION_ID',
        message: 'Yêu cầu conversationId để tiếp tục hội thoại',
      });
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      throw new NotFoundException({
        error: 'CONVERSATION_NOT_FOUND',
        message: 'Phiên hội thoại không tồn tại',
      });
    }

    if (conversation.status === 'FINISHED') {
      throw new ConflictException({
        error: 'CONVERSATION_FINISHED',
        message: 'Phiên hội thoại này đã kết thúc',
      });
    }

    // Cập nhật lastActiveAt
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

    // Mặc định là PENDING
    return await this.handlePending(conversation, dto, nowTimestamp);
  }

  private async handleStart(
    dto: ConversationRequestDto,
    nowTimestamp: string,
  ): Promise<ConversationResponseDto> {
    if (!dto.atmId) {
      throw new BadRequestException({
        error: 'MISSING_ATM_ID',
        message: 'Yêu cầu atmId khi khởi tạo START',
      });
    }

    const maxPerTx = this.configService.getMaxPerTransaction();
    const proposedAmount = dto.proposedAmount ?? 0;

    if (proposedAmount <= 0 || proposedAmount > maxPerTx) {
      throw new BadRequestException({
        error: 'INVALID_PROPOSED_AMOUNT',
        message: `Số tiền người bảo chứng đề xuất phải lớn hơn 0 và không vượt quá ${maxPerTx.toLocaleString('vi-VN')} VND (max_per_transaction).`,
      });
    }

    const conversationId = `CONV_${Date.now()}`;

    // Lưu vào database
    await this.prisma.conversation.create({
      data: {
        id: conversationId,
        atmId: dto.atmId,
        staffIds: dto.staffList as any,
        proposedAmount,
        status: 'START',
      },
    });

    // Lưu lời chào cố định của Trạm Lắng Nghe
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

  private async handlePending(
    conversation: any,
    dto: ConversationRequestDto,
    nowTimestamp: string,
  ): Promise<ConversationResponseDto> {
    const userMessage = (dto.message || '').trim();

    // Lưu tin nhắn của người dùng
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        action: 'PENDING',
        content: userMessage,
        clientTimestamp: dto.timestamp || nowTimestamp,
      },
    });

    // Xử lý logic từ chối đồng ý ở câu chào
    if (
      userMessage.toLowerCase().includes('không đồng ý') ||
      userMessage.toLowerCase().includes('khong dong y')
    ) {
      const rejectMsg =
        'Dạ con cảm ơn cô/bác. Vì chưa có sự đồng ý nên con xin phép tạm dừng cuộc gọi tại đây. Chúc cô/bác nhiều sức khỏe ạ.';
      await this.saveAssistantResponse(conversation.id, 'FINISHED', rejectMsg, nowTimestamp);
      return {
        conversationId: conversation.id,
        status: 'FINISHED',
        message: rejectMsg,
        timestamp: nowTimestamp,
      };
    }

    // Lấy toàn bộ lịch sử gửi sang OpenAI
    const history = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    const llmHistory = history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }));

    const llmResult = await this.llmService.processConversationTurn(llmHistory);

    // Lưu phản hồi của trợ lý
    await this.saveAssistantResponse(
      conversation.id,
      llmResult.status,
      llmResult.message,
      nowTimestamp,
    );

    return {
      conversationId: conversation.id,
      status: llmResult.status,
      message: llmResult.message,
      timestamp: nowTimestamp,
    };
  }

  private async handleUploadAction(
    conversation: any,
    dto: ConversationRequestDto,
    nowTimestamp: string,
  ): Promise<ConversationResponseDto> {
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

    // Sau khi upload thành công, gọi LLM để tiếp tục hỏi hoặc tóm tắt
    const history = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    const llmResult = await this.llmService.processConversationTurn(
      history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
    );

    await this.saveAssistantResponse(
      conversation.id,
      llmResult.status,
      llmResult.message,
      nowTimestamp,
    );

    return {
      conversationId: conversation.id,
      status: llmResult.status,
      message: llmResult.message,
      timestamp: nowTimestamp,
    };
  }

  private async handleConfirm(
    conversation: any,
    dto: ConversationRequestDto,
    nowTimestamp: string,
  ): Promise<ConversationResponseDto> {
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

    // Nếu người dân xác nhận đúng (YES)
    if (userConfirm === 'YES' || userConfirm === 'ĐÚNG' || userConfirm === 'DUNG') {
      const finishMsg =
        'Con cảm ơn cô bác đã chia sẻ hoàn cảnh của mình. Con sẽ gửi hồ sơ này về Quỹ Bông Sen để xem xét. Nhân viên của Quỹ có thể liên hệ lại để xác minh thêm. Con chúc cô bác nhiều sức khỏe và mong mọi chuyện sớm tốt hơn.';

      await this.saveAssistantResponse(conversation.id, 'FINISHED', finishMsg, nowTimestamp);
      return {
        conversationId: conversation.id,
        status: 'FINISHED',
        message: finishMsg,
        timestamp: nowTimestamp,
      };
    }

    // Nếu người dân bấm CANCEL để sửa đổi thông tin
    const editMsg =
      'Dạ cô bác cho con biết mình cần sửa đổi hoặc bổ sung thêm thông tin nào ạ?';
    await this.saveAssistantResponse(conversation.id, 'PENDING', editMsg, nowTimestamp);

    return {
      conversationId: conversation.id,
      status: 'PENDING',
      message: editMsg,
      timestamp: nowTimestamp,
    };
  }

  private async saveAssistantResponse(
    conversationId: string,
    status: string,
    message: string,
    timestamp: string,
  ) {
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
}
