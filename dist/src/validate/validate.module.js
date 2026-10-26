"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateModule = void 0;
const common_1 = require("@nestjs/common");
const validate_service_1 = require("./validate.service");
const validate_controller_1 = require("./validate.controller");
const auth_module_1 = require("../auth/auth.module");
let ValidateModule = class ValidateModule {
};
exports.ValidateModule = ValidateModule;
exports.ValidateModule = ValidateModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [validate_controller_1.ValidateController],
        providers: [validate_service_1.ValidateService],
        exports: [validate_service_1.ValidateService],
    })
], ValidateModule);
//# sourceMappingURL=validate.module.js.map