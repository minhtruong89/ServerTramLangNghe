import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SlidingAuthGuard } from './sliding-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SlidingAuthGuard],
  exports: [AuthService, SlidingAuthGuard],
})
export class AuthModule {}
