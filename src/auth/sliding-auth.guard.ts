import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class SlidingAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException({
        error: 'MISSING_TOKEN',
        message: 'Yêu cầu Bearer Token trong header Authorization',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException({
        error: 'MALFORMED_TOKEN',
        message: 'Định dạng token không hợp lệ (cần Bearer <token>)',
      });
    }

    const token = parts[1];
    return await this.authService.validateAndSlideToken(token);
  }
}
