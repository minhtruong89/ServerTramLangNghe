import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigFilesModule } from './config-files/config-files.module';
import { LlmModule } from './llm/llm.module';
import { AuthModule } from './auth/auth.module';
import { ValidateModule } from './validate/validate.module';
import { ConversationModule } from './conversation/conversation.module';
import { UploadModule } from './upload/upload.module';
import { MedicalRecordModule } from './medical-record/medical-record.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
    }),
    PrismaModule,
    ConfigFilesModule,
    LlmModule,
    AuthModule,
    ValidateModule,
    ConversationModule,
    UploadModule,
    MedicalRecordModule,
    AdminModule,
  ],
})
export class AppModule {}
