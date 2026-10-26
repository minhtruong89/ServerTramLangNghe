import { ConfigFilesService } from '../config-files/config-files.service';
import { PrismaService } from '../prisma/prisma.service';
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
export declare class ValidateService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    constructor(configService: ConfigFilesService, prisma: PrismaService);
    validateAtmAndStaff(dto: ValidateAtmStaffRequest): Promise<ValidateAtmStaffResponse>;
}
