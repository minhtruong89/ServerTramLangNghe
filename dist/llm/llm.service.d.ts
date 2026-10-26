import { ConfigFilesService } from '../config-files/config-files.service';
export interface LlmConversationOutput {
    status: 'START' | 'PENDING' | 'UPLOAD' | 'CONFIRM' | 'FINISHED';
    message: string;
    currentStep?: number;
    isFreeStoryPhase?: boolean;
}
export declare class LlmService {
    private readonly configService;
    private readonly logger;
    private openai;
    constructor(configService: ConfigFilesService);
    processConversationTurn(conversationHistory: {
        role: 'user' | 'assistant' | 'system';
        content: string;
    }[]): Promise<LlmConversationOutput>;
    scoreMedicalRecord(fullTranscriptText: string): Promise<string>;
}
