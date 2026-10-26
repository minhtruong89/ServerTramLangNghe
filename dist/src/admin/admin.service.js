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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_files_service_1 = require("../config-files/config-files.service");
const fs = require("fs");
const path = require("path");
let AdminService = AdminService_1 = class AdminService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    getAtms() {
        return this.configService.getAtms();
    }
    saveAtm(atm) {
        const atms = this.configService.getAtms();
        const index = atms.findIndex((a) => a.atmId === atm.atmId || a.serialNumber === atm.serialNumber);
        if (index >= 0) {
            atms[index] = { ...atms[index], ...atm };
        }
        else {
            atms.push(atm);
        }
        const filePath = path.resolve(process.cwd(), 'config/atm_list.json');
        fs.writeFileSync(filePath, JSON.stringify({ atmList: atms }, null, 2), 'utf8');
        this.configService.reloadAll();
        return atms;
    }
    deleteAtm(atmId) {
        let atms = this.configService.getAtms();
        atms = atms.filter((a) => a.atmId !== atmId);
        const filePath = path.resolve(process.cwd(), 'config/atm_list.json');
        fs.writeFileSync(filePath, JSON.stringify({ atmList: atms }, null, 2), 'utf8');
        this.configService.reloadAll();
        return atms;
    }
    getStaff() {
        return this.configService.getOperators();
    }
    saveStaff(staff) {
        const list = this.configService.getOperators();
        const index = list.findIndex((s) => s.staffId === staff.staffId);
        if (index >= 0) {
            list[index] = { ...list[index], ...staff };
        }
        else {
            list.push(staff);
        }
        const filePath = path.resolve(process.cwd(), 'config/operator_list.json');
        const curContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        curContent.operatorList = list;
        fs.writeFileSync(filePath, JSON.stringify(curContent, null, 2), 'utf8');
        this.configService.reloadAll();
        return list;
    }
    deleteStaff(staffId) {
        let list = this.configService.getOperators();
        list = list.filter((s) => s.staffId !== staffId);
        const filePath = path.resolve(process.cwd(), 'config/operator_list.json');
        const curContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        curContent.operatorList = list;
        fs.writeFileSync(filePath, JSON.stringify(curContent, null, 2), 'utf8');
        this.configService.reloadAll();
        return list;
    }
    async getConversations(limit = 100) {
        return await this.prisma.conversation.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
                files: true,
                medicalRecord: true,
            },
        });
    }
    async getConversationDetail(id) {
        return await this.prisma.conversation.findUnique({
            where: { id },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
                files: true,
                medicalRecord: true,
            },
        });
    }
    async getMedicalRecords(limit = 100) {
        return await this.prisma.medicalRecord.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                conversation: {
                    include: {
                        messages: { orderBy: { createdAt: 'asc' } },
                        files: true,
                    },
                },
            },
        });
    }
    async getMedicalRecordDetail(id) {
        return await this.prisma.medicalRecord.findUnique({
            where: { id },
            include: {
                conversation: {
                    include: {
                        messages: { orderBy: { createdAt: 'asc' } },
                        files: true,
                    },
                },
            },
        });
    }
    async updateRecordStatus(id, status, note) {
        return await this.prisma.medicalRecord.update({
            where: { id },
            data: {
                status,
                requireStaffConfirm: false,
            },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_files_service_1.ConfigFilesService])
], AdminService);
//# sourceMappingURL=admin.service.js.map