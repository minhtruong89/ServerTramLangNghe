"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ConfigFilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigFilesService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let ConfigFilesService = ConfigFilesService_1 = class ConfigFilesService {
    constructor() {
        this.logger = new common_1.Logger(ConfigFilesService_1.name);
    }
    onModuleInit() {
        this.reloadAll();
    }
    reloadAll() {
        this.loadConfigs();
        this.loadPrompts();
        this.logger.log('All configs and prompts reloaded successfully.');
    }
    loadConfigs() {
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
        }
        catch (err) {
            this.logger.error('Error loading config files:', err);
        }
    }
    loadPrompts() {
        try {
            const convPath = path.resolve(process.cwd(), 'prompts/llm_conversation_new.txt');
            if (fs.existsSync(convPath)) {
                this.conversationPrompt = fs.readFileSync(convPath, 'utf8');
            }
            const techPath = path.resolve(process.cwd(), 'prompts/conversation_technical.txt');
            if (fs.existsSync(techPath)) {
                this.conversationTechnical = fs.readFileSync(techPath, 'utf8');
            }
            const scorPath = path.resolve(process.cwd(), 'prompts/llm_distress_scoring.txt');
            if (fs.existsSync(scorPath)) {
                this.scoringPrompt = fs.readFileSync(scorPath, 'utf8');
            }
        }
        catch (err) {
            this.logger.error('Error loading prompt files:', err);
        }
    }
    getOperators() {
        return this.operatorConfig?.operatorList || [];
    }
    getAtms() {
        return this.atmConfig?.atmList || [];
    }
    getMaxPerTransaction() {
        return this.ruleEngineConfig?.financial_limits?.max_per_transaction ?? 2000000;
    }
    getConversationSystemPrompt() {
        return `${this.conversationPrompt}\n\n${this.conversationTechnical}`;
    }
    getScoringSystemPrompt() {
        return this.scoringPrompt;
    }
};
exports.ConfigFilesService = ConfigFilesService;
exports.ConfigFilesService = ConfigFilesService = ConfigFilesService_1 = __decorate([
    (0, common_1.Injectable)()
], ConfigFilesService);
//# sourceMappingURL=config-files.service.js.map