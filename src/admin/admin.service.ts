import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigFilesService, Operator, AtmDevice } from '../config-files/config-files.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigFilesService,
  ) {}

  // 1. Quản lý ATM List
  getAtms(): AtmDevice[] {
    return this.configService.getAtms();
  }

  saveAtm(atm: AtmDevice): AtmDevice[] {
    const atms = this.configService.getAtms();
    const index = atms.findIndex((a) => a.atmId === atm.atmId || a.serialNumber === atm.serialNumber);

    if (index >= 0) {
      atms[index] = { ...atms[index], ...atm };
    } else {
      atms.push(atm);
    }

    const filePath = path.resolve(process.cwd(), 'config/atm_list.json');
    fs.writeFileSync(filePath, JSON.stringify({ atmList: atms }, null, 2), 'utf8');
    this.configService.reloadAll();
    return atms;
  }

  deleteAtm(atmId: string): AtmDevice[] {
    let atms = this.configService.getAtms();
    atms = atms.filter((a) => a.atmId !== atmId);

    const filePath = path.resolve(process.cwd(), 'config/atm_list.json');
    fs.writeFileSync(filePath, JSON.stringify({ atmList: atms }, null, 2), 'utf8');
    this.configService.reloadAll();
    return atms;
  }

  // 2. Quản lý Staff / Operator List
  getStaff(): Operator[] {
    return this.configService.getOperators();
  }

  saveStaff(staff: Operator): Operator[] {
    const list = this.configService.getOperators();
    const index = list.findIndex((s) => s.staffId === staff.staffId);

    if (index >= 0) {
      list[index] = { ...list[index], ...staff };
    } else {
      list.push(staff);
    }

    const filePath = path.resolve(process.cwd(), 'config/operator_list.json');
    const curContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    curContent.operatorList = list;
    fs.writeFileSync(filePath, JSON.stringify(curContent, null, 2), 'utf8');
    this.configService.reloadAll();
    return list;
  }

  deleteStaff(staffId: string): Operator[] {
    let list = this.configService.getOperators();
    list = list.filter((s) => s.staffId !== staffId);

    const filePath = path.resolve(process.cwd(), 'config/operator_list.json');
    const curContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    curContent.operatorList = list;
    fs.writeFileSync(filePath, JSON.stringify(curContent, null, 2), 'utf8');
    this.configService.reloadAll();
    return list;
  }

  // 3. Danh sách Hội thoại (Conversations)
  async getConversations(limit = 100) {
    return await this.prisma.conversation.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        files: true,
        medicalRecord: true,
      },
    });
  }

  async getConversationDetail(id: string) {
    return await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        files: true,
        medicalRecord: true,
      },
    });
  }

  // 4. Danh sách Hồ sơ (Medical Records) - kèm quan hệ đầy đủ
  async getMedicalRecords(limit = 100) {
    return await this.prisma.medicalRecord.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        conversation: {
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            files: true,
          },
        },
      },
    });
  }

  async getMedicalRecordDetail(id: string) {
    return await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        conversation: {
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            files: true,
          },
        },
      },
    });
  }

  // Cập nhật duyệt thủ công cho hồ sơ Mức B
  async updateRecordStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    note?: string,
  ) {
    return await this.prisma.medicalRecord.update({
      where: { id },
      data: {
        status,
        requireStaffConfirm: false,
      },
    });
  }
}
