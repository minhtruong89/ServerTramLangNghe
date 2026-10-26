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
var MedicalRecordService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const llm_service_1 = require("../llm/llm.service");
let MedicalRecordService = MedicalRecordService_1 = class MedicalRecordService {
    constructor(prisma, llmService) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.logger = new common_1.Logger(MedicalRecordService_1.name);
    }
    async processMedicalRecord(dto) {
        const processedAt = Date.now().toString();
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: dto.conversationId },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
                files: true,
                medicalRecord: true,
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException({
                error: 'CONVERSATION_NOT_FOUND',
                message: 'Phiên hội thoại không tồn tại',
            });
        }
        if (conversation.medicalRecord) {
            const rec = conversation.medicalRecord;
            return {
                record: rec.id,
                status: rec.status,
                proposedAmount: rec.proposedAmount,
                severityScore: rec.serverTotalScore,
                disbursementRate: rec.serverDisbursementRate,
                approvedAmount: rec.approvedAmount,
                currency: 'VND',
                requireStaffConfirm: rec.requireStaffConfirm,
                message: rec.status === 'APPROVED'
                    ? 'Hồ sơ đã được xét duyệt'
                    : 'Hồ sơ không đủ điều kiện giải ngân',
                processedAt: rec.processedAt.getTime().toString(),
            };
        }
        const transcriptLines = [];
        for (const msg of conversation.messages) {
            const speaker = msg.role === 'assistant' ? 'Trạm Lắng Nghe' : 'Người cần trợ giúp';
            transcriptLines.push(`${speaker}: ${msg.content}`);
        }
        if (conversation.files && conversation.files.length > 0) {
            transcriptLines.push(`\n[Hình ảnh/Chứng từ đã scan]: ${conversation.files.map((f) => f.fileName).join(', ')}`);
        }
        const fullTranscript = transcriptLines.join('\n');
        const aiRawOutput = await this.llmService.scoreMedicalRecord(fullTranscript);
        const scores = this.parseAiScoringOutput(aiRawOutput);
        let serverTotalScore = 0;
        let serverRate = 0;
        const warnings = [];
        let requireStaffConfirm = false;
        if (scores.state === 'HỢP LỆ') {
            serverTotalScore = Math.min(100, scores.emergency + scores.income + scores.family + scores.health);
            serverRate = this.calculateDisbursementRate(serverTotalScore);
            if (serverTotalScore !== scores.totalScore) {
                warnings.push(`Lệch Total Score: AI tính ${scores.totalScore}, Server tính ${serverTotalScore}`);
                requireStaffConfirm = true;
            }
            if (serverRate !== scores.rate) {
                warnings.push(`Lệch Hệ số giải ngân: AI tính ${scores.rate}%, Server tính ${serverRate}%`);
                requireStaffConfirm = true;
            }
        }
        else {
            serverTotalScore = 0;
            serverRate = 0;
        }
        const hasFiles = (conversation.files && conversation.files.length > 0) ||
            (dto.data && dto.data.some((d) => d.type === 'FILE'));
        if (!hasFiles && scores.state === 'HỢP LỆ') {
            requireStaffConfirm = true;
            warnings.push('Hồ sơ Mức B: Không có giấy tờ/chứng từ đính kèm.');
        }
        const proposedAmount = conversation.proposedAmount;
        let approvedAmount = 0;
        let status = 'REJECTED';
        if (serverRate > 0) {
            status = 'APPROVED';
            approvedAmount = Math.floor((proposedAmount * serverRate) / 100);
        }
        else {
            status = 'REJECTED';
            approvedAmount = 0;
        }
        const recordId = `REC_${Date.now()}`;
        await this.prisma.medicalRecord.create({
            data: {
                id: recordId,
                conversationId: conversation.id,
                atmId: dto.atmId,
                staffList: dto.staffList,
                proposedAmount,
                submittedData: dto.data,
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
                warnings: warnings.length > 0 ? warnings : null,
            },
        });
        let returnMessage = status === 'APPROVED'
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
    calculateDisbursementRate(severity) {
        if (severity <= 0)
            return 0;
        if (severity <= 20)
            return 20;
        if (severity <= 40)
            return 40;
        if (severity <= 60)
            return 60;
        if (severity <= 80)
            return 80;
        return 100;
    }
    parseAiScoringOutput(output) {
        const result = {
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
        if (!output)
            return result;
        const stateMatch = output.match(/Trạng\s*thái\s*:\s*([^\n\r]+)/i);
        if (stateMatch) {
            const raw = stateMatch[1].trim().toUpperCase();
            if (raw.includes('HỢP LỆ') || raw.includes('HOP LE')) {
                result.state = 'HỢP LỆ';
            }
            else if (raw.includes('TẠM DỪNG') || raw.includes('ĐÓNG CA')) {
                result.state = 'TẠM DỪNG - ĐÓNG CA';
            }
            else {
                result.state = 'CHƯA ĐỦ THÔNG TIN';
            }
        }
        const emMatch = output.match(/Emergency\s*:\s*(\d+)\s*\/\s*25/i);
        if (emMatch)
            result.emergency = parseInt(emMatch[1], 10);
        const incMatch = output.match(/Income\s*&\s*RRTC\s*:\s*(\d+)\s*\/\s*35/i);
        if (incMatch)
            result.income = parseInt(incMatch[1], 10);
        const famMatch = output.match(/Family\s*:\s*(\d+)\s*\/\s*30/i);
        if (famMatch)
            result.family = parseInt(famMatch[1], 10);
        const hMatch = output.match(/Health\s*:\s*(\d+)\s*\/\s*30/i);
        if (hMatch)
            result.health = parseInt(hMatch[1], 10);
        const totMatch = output.match(/Total\s*Score\s*:\s*(\d+)/i);
        if (totMatch)
            result.totalScore = parseInt(totMatch[1], 10);
        const rateMatch = output.match(/Hệ\s*số\s*giải\s*ngân\s*:\s*(\d+)\s*%/i);
        if (rateMatch)
            result.rate = parseInt(rateMatch[1], 10);
        const tierMatch = output.match(/Xác\s*minh\s*chứng\s*cứ\s*:\s*([^\n\r]+)/i);
        if (tierMatch)
            result.tier = tierMatch[1].trim();
        return result;
    }
};
exports.MedicalRecordService = MedicalRecordService;
exports.MedicalRecordService = MedicalRecordService = MedicalRecordService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LlmService])
], MedicalRecordService);
//# sourceMappingURL=medical-record.service.js.map