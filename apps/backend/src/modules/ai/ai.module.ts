import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiClientService } from './ai-client.service';
import { AiParserService } from './ai-parser.service';
import { AiPromptService } from './ai-prompt.service';
import { AiService } from './ai.service';

// Gemini API entegrasyonu - GEMINI_API_KEY yoksa mock mode çalışır
@Module({
  imports: [ConfigModule],
  providers: [AiService, AiPromptService, AiClientService, AiParserService],
  exports: [AiService], // Sadece ana orchestrator service export edilir
})
export class AiModule {}
