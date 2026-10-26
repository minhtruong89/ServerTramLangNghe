import { OnModuleInit } from '@nestjs/common';
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
export declare class ConfigFilesService implements OnModuleInit {
    private readonly logger;
    private operatorConfig;
    private atmConfig;
    private ruleEngineConfig;
    private conversationPrompt;
    private conversationTechnical;
    private scoringPrompt;
    onModuleInit(): void;
    reloadAll(): void;
    private loadConfigs;
    private loadPrompts;
    getOperators(): Operator[];
    getAtms(): AtmDevice[];
    getMaxPerTransaction(): number;
    getConversationSystemPrompt(): string;
    getScoringSystemPrompt(): string;
}
