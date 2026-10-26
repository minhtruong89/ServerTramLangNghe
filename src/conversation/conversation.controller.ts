import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ConversationService,
  ConversationRequestDto,
  ConversationResponseDto,
} from './conversation.service';
import { SlidingAuthGuard } from '../auth/sliding-auth.guard';

@Controller('api/v1')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('conversation')
  @UseGuards(SlidingAuthGuard)
  @HttpCode(HttpStatus.OK)
  async handleConversation(
    @Body() dto: ConversationRequestDto,
  ): Promise<ConversationResponseDto> {
    return await this.conversationService.handleConversation(dto);
  }
}
