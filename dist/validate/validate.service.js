"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ValidateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateService = void 0;
const common_1 = require("@nestjs/common");
const config_files_service_1 = require("../config-files/config-files.service");
const prisma_service_1 = require("../prisma/prisma.service");
const fuzzy_matcher_1 = require("../common/fuzzy-matcher");
let ValidateService = ValidateService_1 = class ValidateService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(ValidateService_1.name);
    }
    async validateAtmAndStaff(dto) {
        const serverTime = Date.now().toString();
        const atms = this.configService.getAtms();
        const matchedAtm = atms.find((a) => a.serialNumber.trim().toLowerCase() ===
            dto.atmSerialNumber.trim().toLowerCase());
        const atmStatus = matchedAtm ? 'VALID' : 'INVALID';
        const atmId = matchedAtm ? matchedAtm.atmId : undefined;
        const operators = this.configService.getOperators();
        const staffResults = [];
        let allStaffValid = true;
        for (const reqStaff of dto.staffList || []) {
            let matchedOp = null;
            if (reqStaff.citizenId) {
                matchedOp = operators.find((op) => {
                    const cccdMatch = (0, fuzzy_matcher_1.matchCitizenId)(reqStaff.citizenId, op.id, 1);
                    return cccdMatch.matched;
                });
                if (matchedOp) {
                    staffResults.push({
                        citizenId: reqStaff.citizenId,
                        fullName: reqStaff.fullName,
                        status: 'VALID',
                        staffId: matchedOp.staffId,
                    });
                    continue;
                }
            }
            if (reqStaff.fullName) {
                matchedOp = operators.find((op) => {
                    const nameMatch = (0, fuzzy_matcher_1.fuzzyMatchString)(reqStaff.fullName, op.name, 2);
                    return nameMatch.matched;
                });
                if (matchedOp) {
                    staffResults.push({
                        citizenId: reqStaff.citizenId || null,
                        fullName: reqStaff.fullName,
                        status: 'VALID',
                        staffId: matchedOp.staffId,
                    });
                    continue;
                }
            }
            allStaffValid = false;
            staffResults.push({
                citizenId: reqStaff.citizenId || null,
                fullName: reqStaff.fullName,
                status: 'INVALID',
                message: 'Nhân viên không có trong danh sách được cấp phép',
            });
        }
        const overallMessage = atmStatus === 'VALID' && allStaffValid
            ? 'ATM and Operator are valid'
            : atmStatus === 'INVALID'
                ? 'ATM device is not recognized or invalid'
                : 'One or more staff members are invalid';
        const response = {
            atmStatus,
            atmId,
            staffResults,
            message: overallMessage,
            serverTime,
        };
        try {
            await this.prisma.validationLog.create({
                data: {
                    atmSerialNumber: dto.atmSerialNumber,
                    atmStatus,
                    requestBody: dto,
                    responseBody: response,
                },
            });
        }
        catch (e) {
            this.logger.warn('Could not save validation log to DB:', e.message);
        }
        return response;
    }
};
exports.ValidateService = ValidateService;
exports.ValidateService = ValidateService = ValidateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_files_service_1.ConfigFilesService,
        prisma_service_1.PrismaService])
], ValidateService);
//# sourceMappingURL=validate.service.js.map