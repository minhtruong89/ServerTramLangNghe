import { Module } from '@nestjs/common';
import { ValidateService } from './validate.service';
import { ValidateController } from './validate.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ValidateController],
  providers: [ValidateService],
  exports: [ValidateService],
})
export class ValidateModule {}
