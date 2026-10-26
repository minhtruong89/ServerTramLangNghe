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
var LlmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = require("openai");
const config_files_service_1 = require("../config-files/config-files.service");
let LlmService = LlmService_1 = class LlmService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(LlmService_1.name);
        const apiKey = process.env.OPENAI_API_KEY ||
            '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';
        this.openai = new openai_1.default({ apiKey });
    }
    async processConversationTurn(conversationHistory) {
        const systemPrompt = this.configService.getConversationSystemPrompt();
        const model = process.env.OPENAI_CONVERSATION_MODEL || 'gpt-4o-mini';
        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.map((m) => ({
                    role: m.role,
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
            const parsed = JSON.parse(rawContent);
            parsed.status = (parsed.status || 'PENDING').trim().toUpperCase();
            if (!['START', 'PENDING', 'UPLOAD', 'CONFIRM', 'FINISHED'].includes(parsed.status)) {
                parsed.status = 'PENDING';
            }
            return parsed;
        }
        catch (error) {
            this.logger.error('Error calling OpenAI for conversation:', error);
            return {
                status: 'PENDING',
                message: 'Dạ con đang lắng nghe cô bác đây ạ, cô bác chia sẻ tiếp giúp con nhé.',
            };
        }
    }
    async scoreMedicalRecord(fullTranscriptText) {
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
                temperature: 0,
            });
            return response.choices[0]?.message?.content || '';
        }
        catch (error) {
            this.logger.error('Error calling OpenAI for scoring:', error);
            throw error;
        }
    }
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = LlmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_files_service_1.ConfigFilesService])
], LlmService);
//# sourceMappingURL=llm.service.js.map