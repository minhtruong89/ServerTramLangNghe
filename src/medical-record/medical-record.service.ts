import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

export interface MedicalRecordItemDto {
  type: 'TEXT' | 'FILE';
  content?: string;
  fileName?: string;
  fileUrl?: string;
  timestamp?: string;
}

export interface MedicalRecordRequestDto {
  atmId: string;
  staffList: { staffId: string }[];
  conversationId: string;
  data: MedicalRecordItemDto[];
  submittedAt?: string;
}

export interface MedicalRecordResponseDto {
  record: string;
  status: 'APPROVED' | 'REJECTED';
  proposedAmount: number;
  severityScore: number;
  disbursementRate: number;
  approvedAmount: number;
  currency: string;
  requireStaffConfirm: boolean;
  message: string;
  processedAt: string;
}

export interface ExtractedScores {
  state: string;
  emergency: number;
  income: number;
  family: number;
  health: number;
  totalScore: number;
  rate: number;
  tier: string;
  conclusion: string;
}

@Injectable()
export class MedicalRecordService {
  private readonly logger = new Logger(MedicalRecordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) {}

  async processMedicalRecord(
    dto: MedicalRecordRequestDto,
  ): Promise<MedicalRecordResponseDto> {
    const processedAt = Date.now().toString();

    // 1. Kiểm tra conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        files: true,
        medicalRecord: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException({
        error: 'CONVERSATION_NOT_FOUND',
        message: 'Phiên hội thoại không tồn tại',
      });
    }

    // Nếu hồ sơ đã được tạo trước đó -> trả về kết quả đã lưu (Idempotent)
    if (conversation.medicalRecord) {
      const rec = conversation.medicalRecord;
      return {
        record: rec.id,
        status: rec.status as any,
        proposedAmount: rec.proposedAmount,
        severityScore: rec.serverTotalScore,
        disbursementRate: rec.serverDisbursementRate,
        approvedAmount: rec.approvedAmount,
        currency: 'VND',
        requireStaffConfirm: rec.requireStaffConfirm,
        message:
          rec.status === 'APPROVED'
            ? 'Hồ sơ đã được xét duyệt'
            : 'Hồ sơ không đủ điều kiện giải ngân',
        processedAt: rec.processedAt.getTime().toString(),
      };
    }

    // 2. Dựng bản transcript đầy đủ từ lịch sử hội thoại chuẩn của server
    const transcriptLines: string[] = [];
    for (const msg of conversation.messages) {
      const speaker = msg.role === 'assistant' ? 'Trạm Lắng Nghe' : 'Người cần trợ giúp';
      transcriptLines.push(`${speaker}: ${msg.content}`);
    }

    if (conversation.files && conversation.files.length > 0) {
      transcriptLines.push(
        `\n[Hình ảnh/Chứng từ đã scan]: ${conversation.files.map((f) => f.fileName).join(', ')}`,
      );
    }

    const fullTranscript = transcriptLines.join('\n');

    // 3. Gọi LLM OpenAI để chấm điểm với prompt chuẩn
    const aiRawOutput = await this.llmService.scoreMedicalRecord(fullTranscript);

    // 4. Bóc tách kết quả từ text AI
    const scores = this.parseAiScoringOutput(aiRawOutput);

    // 5. Server tính toán độc lập
    let serverTotalScore = 0;
    let serverRate = 0;
    const warnings: string[] = [];
    let requireStaffConfirm = false;

    if (scores.state === 'HỢP LỆ') {
      serverTotalScore = Math.min(
        100,
        scores.emergency + scores.income + scores.family + scores.health,
      );
      serverRate = this.calculateDisbursementRate(serverTotalScore);

      // So sánh với kết quả AI tự tính
      if (serverTotalScore !== scores.totalScore) {
        warnings.push(
          `Lệch Total Score: AI tính ${scores.totalScore}, Server tính ${serverTotalScore}`,
        );
        requireStaffConfirm = true;
      }

      if (serverRate !== scores.rate) {
        warnings.push(
          `Lệch Hệ số giải ngân: AI tính ${scores.rate}%, Server tính ${serverRate}%`,
        );
        requireStaffConfirm = true;
      }
    } else {
      serverTotalScore = 0;
      serverRate = 0;
    }

    // Kiểm tra chứng từ (Mức B cảnh báo duyệt tay)
    const hasFiles =
      (conversation.files && conversation.files.length > 0) ||
      (dto.data && dto.data.some((d) => d.type === 'FILE'));

    if (!hasFiles && scores.state === 'HỢP LỆ') {
      requireStaffConfirm = true;
      warnings.push('Hồ sơ Mức B: Không có giấy tờ/chứng từ đính kèm.');
    }

    // 6. Tính số tiền giải ngân
    const proposedAmount = conversation.proposedAmount;
    let approvedAmount = 0;
    let status: 'APPROVED' | 'REJECTED' = 'REJECTED';

    if (serverRate > 0) {
      status = 'APPROVED';
      approvedAmount = Math.floor((proposedAmount * serverRate) / 100);
    } else {
      status = 'REJECTED';
      approvedAmount = 0;
    }

    const recordId = `REC_${Date.now()}`;

    // Lưu vào database
    await this.prisma.medicalRecord.create({
      data: {
        id: recordId,
        conversationId: conversation.id,
        atmId: dto.atmId,
        staffList: dto.staffList as any,
        proposedAmount,
        submittedData: dto.data as any,
        aiRawOutput,
        aiState: scores.state,
        aiEmergencyScore: scores.emergency,
        aiIncomeScore: scores.income,
        aiFamilyScore: scores.family,
        aiHealthScore: scores.health,
        aiTotalScore: scores.totalScore,
        aiDisbursementRate: scores.rate,
        aiVerificationTier: scores.tier,
        serverTotalScore,
        serverDisbursementRate: serverRate,
        approvedAmount,
        status,
        requireStaffConfirm,
        warnings: warnings.length > 0 ? (warnings as any) : null,
      },
    });

    let returnMessage =
      status === 'APPROVED'
        ? 'Hồ sơ đã được duyệt'
        : 'Hồ sơ không đủ điều kiện giải ngân';

    if (requireStaffConfirm && status === 'APPROVED') {
      returnMessage += ' (Cần tác viên xác nhận trước khi giải ngân)';
    }

    return {
      record: recordId,
      status,
      proposedAmount,
      severityScore: serverTotalScore,
      disbursementRate: serverRate,
      approvedAmount,
      currency: 'VND',
      requireStaffConfirm,
      message: returnMessage,
      processedAt,
    };
  }

  private calculateDisbursementRate(severity: number): number {
    if (severity <= 0) return 0;
    if (severity <= 20) return 20;
    if (severity <= 40) return 40;
    if (severity <= 60) return 60;
    if (severity <= 80) return 80;
    return 100;
  }

  private parseAiScoringOutput(output: string): ExtractedScores {
    const result: ExtractedScores = {
      state: 'CHƯA ĐỦ THÔNG TIN',
      emergency: 0,
      income: 0,
      family: 0,
      health: 0,
      totalScore: 0,
      rate: 0,
      tier: 'Mức B',
      conclusion: '',
    };

    if (!output) return result;

    // Trạng thái: HỢP LỆ / CHƯA ĐỦ THÔNG TIN / TẠM DỪNG - ĐÓNG CA
    const stateMatch = output.match(/Trạng\s*thái\s*:\s*([^\n\r]+)/i);
    if (stateMatch) {
      const raw = stateMatch[1].trim().toUpperCase();
      if (raw.includes('HỢP LỆ') || raw.includes('HOP LE')) {
        result.state = 'HỢP LỆ';
      } else if (raw.includes('TẠM DỪNG') || raw.includes('ĐÓNG CA')) {
        result.state = 'TẠM DỪNG - ĐÓNG CA';
      } else {
        result.state = 'CHƯA ĐỦ THÔNG TIN';
      }
    }

    // Emergency: 15/25
    const emMatch = output.match(/Emergency\s*:\s*(\d+)\s*\/\s*25/i);
    if (emMatch) result.emergency = parseInt(emMatch[1], 10);

    // Income & RRTC: 28/35
    const incMatch = output.match(/Income\s*&\s*RRTC\s*:\s*(\d+)\s*\/\s*35/i);
    if (incMatch) result.income = parseInt(incMatch[1], 10);

    // Family: 18/30
    const famMatch = output.match(/Family\s*:\s*(\d+)\s*\/\s*30/i);
    if (famMatch) result.family = parseInt(famMatch[1], 10);

    // Health: 20/30
    const hMatch = output.match(/Health\s*:\s*(\d+)\s*\/\s*30/i);
    if (hMatch) result.health = parseInt(hMatch[1], 10);

    // Total Score: 67
    const totMatch = output.match(/Total\s*Score\s*:\s*(\d+)/i);
    if (totMatch) result.totalScore = parseInt(totMatch[1], 10);

    // Hệ số giải ngân: 80%
    const rateMatch = output.match(/Hệ\s*số\s*giải\s*ngân\s*:\s*(\d+)\s*%/i);
    if (rateMatch) result.rate = parseInt(rateMatch[1], 10);

    // Xác minh chứng cứ
    const tierMatch = output.match(/Xác\s*minh\s*chứng\s*cứ\s*:\s*([^\n\r]+)/i);
    if (tierMatch) result.tier = tierMatch[1].trim();

    return result;
  }
}
