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
    staffList: {
        staffId: string;
    }[];
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
export declare class MedicalRecordService {
    private readonly prisma;
    private readonly llmService;
    private readonly logger;
    constructor(prisma: PrismaService, llmService: LlmService);
    processMedicalRecord(dto: MedicalRecordRequestDto): Promise<MedicalRecordResponseDto>;
    private calculateDisbursementRate;
    private parseAiScoringOutput;
}
