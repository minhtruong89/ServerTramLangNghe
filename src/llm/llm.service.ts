import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigFilesService } from '../config-files/config-files.service';

export interface LlmConversationOutput {
  status: 'START' | 'PENDING' | 'UPLOAD' | 'CONFIRM' | 'FINISHED';
  message: string;
  currentStep?: number;
  isFreeStoryPhase?: boolean;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigFilesService) {
    const apiKey =
      process.env.OPENAI_API_KEY ||
      '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';
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Gọi LLM cho phiên hội thoại (Conversation turn)
   */
  async processConversationTurn(
    conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[],
  ): Promise<LlmConversationOutput> {
    const systemPrompt = this.configService.getConversationSystemPrompt();
    const model = process.env.OPENAI_CONVERSATION_MODEL || 'gpt-4o-mini';

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ];

      const response = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const rawContent = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent) as LlmConversationOutput;

      // Chuẩn hóa status
      parsed.status = (parsed.status || 'PENDING').trim().toUpperCase() as any;
      if (!['START', 'PENDING', 'UPLOAD', 'CONFIRM', 'FINISHED'].includes(parsed.status)) {
        parsed.status = 'PENDING';
      }

      return parsed;
    } catch (error) {
      this.logger.error('Error calling OpenAI for conversation:', error);
      // Fallback khi lỗi mạng / API
      return {
        status: 'PENDING',
        message:
          'Dạ con đang lắng nghe cô bác đây ạ, cô bác chia sẻ tiếp giúp con nhé.',
      };
    }
  }

  /**
   * Gọi LLM để chấm điểm mức độ nghiêm trọng (Scoring)
   */
  async scoreMedicalRecord(fullTranscriptText: string): Promise<string> {
    const systemPrompt = this.configService.getScoringSystemPrompt();
    const model = process.env.OPENAI_SCORING_MODEL || 'gpt-4o';

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Dưới đây là toàn bộ thông tin cuộc phỏng vấn giữa Trạm Lắng Nghe và người cần trợ giúp:\n\n${fullTranscriptText}\n\nHãy tiến hành đánh giá và trả về kết quả theo ĐỊNH DẠNG OUTPUT BẮT BUỘC.`,
          },
        ],
        temperature: 0, // Đảm bảo tính nhất quán tuyệt đối về điểm số
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Error calling OpenAI for scoring:', error);
      throw error;
    }
  }
}
