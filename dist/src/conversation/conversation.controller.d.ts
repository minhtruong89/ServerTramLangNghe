import { ConversationService, ConversationRequestDto, ConversationResponseDto } from './conversation.service';
export declare class ConversationController {
    private readonly conversationService;
    constructor(conversationService: ConversationService);
    handleConversation(dto: ConversationRequestDto): Promise<ConversationResponseDto>;
}
