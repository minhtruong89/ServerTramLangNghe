import { Injectable, Logger } from '@nestjs/common';
import { ConfigFilesService } from '../config-files/config-files.service';
import { PrismaService } from '../prisma/prisma.service';
import { matchCitizenId, fuzzyMatchString } from '../common/fuzzy-matcher';

export interface StaffItemDto {
  citizenId?: string | null;
  fullName: string;
}

export interface ValidateAtmStaffRequest {
  atmSerialNumber: string;
  staffList: StaffItemDto[];
  timestamp?: string;
}

export interface StaffResultItem {
  citizenId: string | null;
  fullName: string;
  status: 'VALID' | 'INVALID';
  staffId?: string;
  message?: string;
}

export interface ValidateAtmStaffResponse {
  atmStatus: 'VALID' | 'INVALID';
  atmId?: string;
  staffResults: StaffResultItem[];
  message: string;
  serverTime: string;
}

@Injectable()
export class ValidateService {
  private readonly logger = new Logger(ValidateService.name);

  constructor(
    private readonly configService: ConfigFilesService,
    private readonly prisma: PrismaService,
  ) {}

  async validateAtmAndStaff(
    dto: ValidateAtmStaffRequest,
  ): Promise<ValidateAtmStaffResponse> {
    const serverTime = Date.now().toString();

    // 1. Kiểm tra ATM Device
    const atms = this.configService.getAtms();
    const matchedAtm = atms.find(
      (a) =>
        a.serialNumber.trim().toLowerCase() ===
        dto.atmSerialNumber.trim().toLowerCase(),
    );

    const atmStatus = matchedAtm ? 'VALID' : 'INVALID';
    const atmId = matchedAtm ? matchedAtm.atmId : undefined;

    // 2. Kiểm tra Staff List (Fuzzy Matching 1-2 ký tự)
    const operators = this.configService.getOperators();
    const staffResults: StaffResultItem[] = [];

    let allStaffValid = true;

    for (const reqStaff of dto.staffList || []) {
      let matchedOp: any = null;

      // Ưu tiên so khớp theo CCCD / citizenId
      if (reqStaff.citizenId) {
        matchedOp = operators.find((op) => {
          const cccdMatch = matchCitizenId(reqStaff.citizenId, op.id, 1);
          return cccdMatch.matched;
        });

        // Nếu khớp CCCD, xác nhận thêm tên (cho phép sai số 2 ký tự hoặc chấp nhận luôn theo confirm)
        if (matchedOp) {
          staffResults.push({
            citizenId: reqStaff.citizenId,
            fullName: reqStaff.fullName,
            status: 'VALID',
            staffId: matchedOp.staffId,
          });
          continue;
        }
      }

      // Nếu không có citizenId hoặc không khớp CCCD -> so khớp tên
      if (reqStaff.fullName) {
        matchedOp = operators.find((op) => {
          const nameMatch = fuzzyMatchString(reqStaff.fullName, op.name, 2);
          return nameMatch.matched;
        });

        if (matchedOp) {
          staffResults.push({
            citizenId: reqStaff.citizenId || null,
            fullName: reqStaff.fullName,
            status: 'VALID',
            staffId: matchedOp.staffId,
          });
          continue;
        }
      }

      // Không tìm thấy nhân viên
      allStaffValid = false;
      staffResults.push({
        citizenId: reqStaff.citizenId || null,
        fullName: reqStaff.fullName,
        status: 'INVALID',
        message: 'Nhân viên không có trong danh sách được cấp phép',
      });
    }

    const overallMessage =
      atmStatus === 'VALID' && allStaffValid
        ? 'ATM and Operator are valid'
        : atmStatus === 'INVALID'
          ? 'ATM device is not recognized or invalid'
          : 'One or more staff members are invalid';

    const response: ValidateAtmStaffResponse = {
      atmStatus,
      atmId,
      staffResults,
      message: overallMessage,
      serverTime,
    };

    // Ghi log vào cơ sở dữ liệu
    try {
      await this.prisma.validationLog.create({
        data: {
          atmSerialNumber: dto.atmSerialNumber,
          atmStatus,
          requestBody: dto as any,
          responseBody: response as any,
        },
      });
    } catch (e) {
      this.logger.warn('Could not save validation log to DB:', e.message);
    }

    return response;
  }
}
