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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt = require("jsonwebtoken");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(loginDto) {
        const validUser = process.env.API_USER || 'microtec';
        const validPass = process.env.API_PASS || 'admin@1234';
        if (loginDto.user !== validUser || loginDto.pass !== validPass) {
            throw new common_1.UnauthorizedException({
                error: 'INVALID_CREDENTIALS',
                message: 'Tài khoản hoặc mật khẩu không chính xác',
            });
        }
        const ttlHours = parseInt(process.env.TOKEN_TTL_HOURS || '24', 10);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
        const secret = process.env.JWT_SECRET || 'secret';
        const payload = {
            user: loginDto.user,
            issuedAt: now.getTime().toString(),
        };
        const token = jwt.sign(payload, secret);
        await this.prisma.session.create({
            data: {
                token,
                user: loginDto.user,
                issuedAt: now,
                lastActiveAt: now,
                expiresAt,
            },
        });
        return {
            token,
            issuedAt: now.getTime().toString(),
        };
    }
    async validateAndSlideToken(token) {
        const session = await this.prisma.session.findUnique({
            where: { token },
        });
        if (!session || session.isRevoked) {
            throw new common_1.UnauthorizedException({
                error: 'TOKEN_INVALID',
                message: 'Token không tồn tại hoặc đã bị thu hồi',
            });
        }
        const now = new Date();
        const ttlHours = parseInt(process.env.TOKEN_TTL_HOURS || '24', 10);
        const maxInactiveMs = ttlHours * 60 * 60 * 1000;
        const inactiveDuration = now.getTime() - session.lastActiveAt.getTime();
        if (inactiveDuration > maxInactiveMs) {
            throw new common_1.UnauthorizedException({
                error: 'TOKEN_EXPIRED',
                message: 'Token đã hết hạn do không có hoạt động trong 24h. Vui lòng lấy lại token.',
            });
        }
        await this.prisma.session.update({
            where: { token },
            data: {
                lastActiveAt: now,
                expiresAt: new Date(now.getTime() + maxInactiveMs),
            },
        });
        return true;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map