import { PrismaService } from '../prisma/prisma.service';
import { ConfigFilesService } from '../config-files/config-files.service';
import { LlmService } from '../llm/llm.service';
export interface ConversationRequestDto {
    atmId?: string;
    staffList?: {
        staffId: string;
    }[];
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
export declare class ConversationService {
    private readonly prisma;
    private readonly configService;
    private readonly llmService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigFilesService, llmService: LlmService);
    handleConversation(dto: ConversationRequestDto): Promise<ConversationResponseDto>;
    private handleStart;
    private handlePending;
    private handleUploadAction;
    private handleConfirm;
    private saveAssistantResponse;
}
