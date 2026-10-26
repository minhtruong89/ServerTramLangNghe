import { PrismaService } from '../prisma/prisma.service';
export interface LoginDto {
    user: string;
    pass: string;
}
export interface TokenResponse {
    token: string;
    issuedAt: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    login(loginDto: LoginDto): Promise<TokenResponse>;
    validateAndSlideToken(token: string): Promise<boolean>;
}
