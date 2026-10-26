"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigFilesModule = void 0;
const common_1 = require("@nestjs/common");
const config_files_service_1 = require("./config-files.service");
let ConfigFilesModule = class ConfigFilesModule {
};
exports.ConfigFilesModule = ConfigFilesModule;
exports.ConfigFilesModule = ConfigFilesModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [config_files_service_1.ConfigFilesService],
        exports: [config_files_service_1.ConfigFilesService],
    })
], ConfigFilesModule);
//# sourceMappingURL=config-files.module.js.map