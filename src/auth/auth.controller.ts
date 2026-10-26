import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, LoginDto, TokenResponse } from './auth.service';

@Controller('api/v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async getToken(@Body() loginDto: LoginDto): Promise<TokenResponse> {
    return await this.authService.login(loginDto);
  }
}
