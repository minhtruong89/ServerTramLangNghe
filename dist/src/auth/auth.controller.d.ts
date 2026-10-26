import { AuthService, LoginDto, TokenResponse } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getToken(loginDto: LoginDto): Promise<TokenResponse>;
}
