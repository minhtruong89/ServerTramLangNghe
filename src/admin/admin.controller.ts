import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ATM Endpoints
  @Get('atms')
  getAtms() {
    return this.adminService.getAtms();
  }

  @Post('atms')
  saveAtm(@Body() body: any) {
    return this.adminService.saveAtm(body);
  }

  @Delete('atms/:id')
  deleteAtm(@Param('id') id: string) {
    return this.adminService.deleteAtm(id);
  }

  // Staff Endpoints
  @Get('staff')
  getStaff() {
    return this.adminService.getStaff();
  }

  @Post('staff')
  saveStaff(@Body() body: any) {
    return this.adminService.saveStaff(body);
  }

  @Delete('staff/:id')
  deleteStaff(@Param('id') id: string) {
    return this.adminService.deleteStaff(id);
  }

  // Conversation Endpoints
  @Get('conversations')
  getConversations() {
    return this.adminService.getConversations();
  }

  @Get('conversations/:id')
  getConversationDetail(@Param('id') id: string) {
    return this.adminService.getConversationDetail(id);
  }

  // Medical Record Endpoints
  @Get('records')
  getRecords() {
    return this.adminService.getMedicalRecords();
  }

  @Get('records/:id')
  getRecordDetail(@Param('id') id: string) {
    return this.adminService.getMedicalRecordDetail(id);
  }

  @Patch('records/:id/status')
  updateRecordStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; note?: string },
  ) {
    return this.adminService.updateRecordStatus(id, body.status, body.note);
  }
}
