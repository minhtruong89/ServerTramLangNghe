import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Operator {
  staffId: string;
  name: string;
  id: string;
  hospital_id: string;
  staffType: string;
}

export interface OperatorConfig {
  operatorList: Operator[];
  workingHour_Start: string;
  workingHour_End: string;
}

export interface AtmDevice {
  atmId: string;
  serialNumber: string;
  hospital_id: string;
  name?: string;
  status: string;
}

export interface AtmConfig {
  atmList: AtmDevice[];
}

export interface RuleEngineConfig {
  hospital_id: string;
  financial_limits: {
    max_per_transaction: number;
    [key: string]: any;
  };
  [key: string]: any;
}

@Injectable()
export class ConfigFilesService implements OnModuleInit {
  private readonly logger = new Logger(ConfigFilesService.name);

  private operatorConfig: OperatorConfig;
  private atmConfig: AtmConfig;
  private ruleEngineConfig: RuleEngineConfig;

  private conversationPrompt: string;
  private conversationTechnical: string;
  private scoringPrompt: string;

  onModuleInit() {
    this.reloadAll();
  }

  reloadAll() {
    this.loadConfigs();
    this.loadPrompts();
    this.logger.log('All configs and prompts reloaded successfully.');
  }

  private loadConfigs() {
    try {
      const opPath = path.resolve(process.cwd(), 'config/operator_list.json');
      if (fs.existsSync(opPath)) {
        this.operatorConfig = JSON.parse(fs.readFileSync(opPath, 'utf8'));
      }

      const atmPath = path.resolve(process.cwd(), 'config/atm_list.json');
      if (fs.existsSync(atmPath)) {
        this.atmConfig = JSON.parse(fs.readFileSync(atmPath, 'utf8'));
      }

      const rulePath = path.resolve(process.cwd(), 'config/rule_engine.json');
      if (fs.existsSync(rulePath)) {
        this.ruleEngineConfig = JSON.parse(fs.readFileSync(rulePath, 'utf8'));
      }
    } catch (err) {
      this.logger.error('Error loading config files:', err);
    }
  }

  private loadPrompts() {
    try {
      const convPath = path.resolve(
        process.cwd(),
        'prompts/llm_conversation_new.txt',
      );
      if (fs.existsSync(convPath)) {
        this.conversationPrompt = fs.readFileSync(convPath, 'utf8');
      }

      const techPath = path.resolve(
        process.cwd(),
        'prompts/conversation_technical.txt',
      );
      if (fs.existsSync(techPath)) {
        this.conversationTechnical = fs.readFileSync(techPath, 'utf8');
      }

      const scorPath = path.resolve(
        process.cwd(),
        'prompts/llm_distress_scoring.txt',
      );
      if (fs.existsSync(scorPath)) {
        this.scoringPrompt = fs.readFileSync(scorPath, 'utf8');
      }
    } catch (err) {
      this.logger.error('Error loading prompt files:', err);
    }
  }

  getOperators(): Operator[] {
    return this.operatorConfig?.operatorList || [];
  }

  getAtms(): AtmDevice[] {
    return this.atmConfig?.atmList || [];
  }

  getMaxPerTransaction(): number {
    return this.ruleEngineConfig?.financial_limits?.max_per_transaction ?? 2000000;
  }

  getConversationSystemPrompt(): string {
    return `${this.conversationPrompt}\n\n${this.conversationTechnical}`;
  }

  getScoringSystemPrompt(): string {
    return this.scoringPrompt;
  }
}
