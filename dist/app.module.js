"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const config_files_module_1 = require("./config-files/config-files.module");
const llm_module_1 = require("./llm/llm.module");
const auth_module_1 = require("./auth/auth.module");
const validate_module_1 = require("./validate/validate.module");
const conversation_module_1 = require("./conversation/conversation.module");
const upload_module_1 = require("./upload/upload.module");
const medical_record_module_1 = require("./medical-record/medical-record.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            config_files_module_1.ConfigFilesModule,
            llm_module_1.LlmModule,
            auth_module_1.AuthModule,
            validate_module_1.ValidateModule,
            conversation_module_1.ConversationModule,
            upload_module_1.UploadModule,
            medical_record_module_1.MedicalRecordModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map