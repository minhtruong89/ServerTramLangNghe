import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

export interface LoginDto {
  user: string;
  pass: string;
}

export interface TokenResponse {
  token: string;
  issuedAt: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async login(loginDto: LoginDto): Promise<TokenResponse> {
    const validUser = process.env.API_USER || 'microtec';
    const validPass = process.env.API_PASS || 'admin@1234';

    if (loginDto.user !== validUser || loginDto.pass !== validPass) {
      throw new UnauthorizedException({
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

    // Lưu session vào DB để kiểm soát Sliding Window
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

  /**
   * Xác thực và tự động reset đếm lùi 24h (Sliding Window)
   */
  async validateAndSlideToken(token: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.isRevoked) {
      throw new UnauthorizedException({
        error: 'TOKEN_INVALID',
        message: 'Token không tồn tại hoặc đã bị thu hồi',
      });
    }

    const now = new Date();
    const ttlHours = parseInt(process.env.TOKEN_TTL_HOURS || '24', 10);
    const maxInactiveMs = ttlHours * 60 * 60 * 1000;

    // Kiểm tra khoảng cách từ lần hoạt động gần nhất
    const inactiveDuration = now.getTime() - session.lastActiveAt.getTime();
    if (inactiveDuration > maxInactiveMs) {
      throw new UnauthorizedException({
        error: 'TOKEN_EXPIRED',
        message: 'Token đã hết hạn do không có hoạt động trong 24h. Vui lòng lấy lại token.',
      });
    }

    // Gia hạn lastActiveAt = now()
    await this.prisma.session.update({
      where: { token },
      data: {
        lastActiveAt: now,
        expiresAt: new Date(now.getTime() + maxInactiveMs),
      },
    });

    return true;
  }
}
