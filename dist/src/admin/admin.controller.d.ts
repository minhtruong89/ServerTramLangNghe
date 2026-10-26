import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAtms(): import("../config-files/config-files.service").AtmDevice[];
    saveAtm(body: any): import("../config-files/config-files.service").AtmDevice[];
    deleteAtm(id: string): import("../config-files/config-files.service").AtmDevice[];
    getStaff(): import("../config-files/config-files.service").Operator[];
    saveStaff(body: any): import("../config-files/config-files.service").Operator[];
    deleteStaff(id: string): import("../config-files/config-files.service").Operator[];
    getConversations(): Promise<({
        medicalRecord: {
            id: string;
            status: string;
            createdAt: Date;
            atmId: string;
            proposedAmount: number;
            conversationId: string;
            staffList: import("@prisma/client/runtime/library").JsonValue;
            submittedData: import("@prisma/client/runtime/library").JsonValue;
            aiRawOutput: string;
            aiState: string | null;
            aiEmergencyScore: number | null;
            aiIncomeScore: number | null;
            aiFamilyScore: number | null;
            aiHealthScore: number | null;
            aiTotalScore: number | null;
            aiDisbursementRate: number | null;
            aiVerificationTier: string | null;
            serverTotalScore: number;
            serverDisbursementRate: number;
            approvedAmount: number;
            requireStaffConfirm: boolean;
            warnings: import("@prisma/client/runtime/library").JsonValue | null;
            processedAt: Date;
        };
        messages: {
            content: string;
            id: string;
            createdAt: Date;
            conversationId: string;
            role: string;
            action: string | null;
            clientTimestamp: string | null;
        }[];
        files: {
            id: string;
            createdAt: Date;
            conversationId: string;
            fileName: string;
            originalName: string;
            filePath: string;
            fileUrl: string;
            fileSize: number;
            mimeType: string;
        }[];
    } & {
        id: string;
        status: string;
        lastActiveAt: Date;
        createdAt: Date;
        updatedAt: Date;
        atmId: string;
        staffIds: import("@prisma/client/runtime/library").JsonValue;
        proposedAmount: number;
    })[]>;
    getConversationDetail(id: string): Promise<{
        medicalRecord: {
            id: string;
            status: string;
            createdAt: Date;
            atmId: string;
            proposedAmount: number;
            conversationId: string;
            staffList: import("@prisma/client/runtime/library").JsonValue;
            submittedData: import("@prisma/client/runtime/library").JsonValue;
            aiRawOutput: string;
            aiState: string | null;
            aiEmergencyScore: number | null;
            aiIncomeScore: number | null;
            aiFamilyScore: number | null;
            aiHealthScore: number | null;
            aiTotalScore: number | null;
            aiDisbursementRate: number | null;
            aiVerificationTier: string | null;
            serverTotalScore: number;
            serverDisbursementRate: number;
            approvedAmount: number;
            requireStaffConfirm: boolean;
            warnings: import("@prisma/client/runtime/library").JsonValue | null;
            processedAt: Date;
        };
        messages: {
            content: string;
            id: string;
            createdAt: Date;
            conversationId: string;
            role: string;
            action: string | null;
            clientTimestamp: string | null;
        }[];
        files: {
            id: string;
            createdAt: Date;
            conversationId: string;
            fileName: string;
            originalName: string;
            filePath: string;
            fileUrl: string;
            fileSize: number;
            mimeType: string;
        }[];
    } & {
        id: string;
        status: string;
        lastActiveAt: Date;
        createdAt: Date;
        updatedAt: Date;
        atmId: string;
        staffIds: import("@prisma/client/runtime/library").JsonValue;
        proposedAmount: number;
    }>;
    getRecords(): Promise<({
        conversation: {
            messages: {
                content: string;
                id: string;
                createdAt: Date;
                conversationId: string;
                role: string;
                action: string | null;
                clientTimestamp: string | null;
            }[];
            files: {
                id: string;
                createdAt: Date;
                conversationId: string;
                fileName: string;
                originalName: string;
                filePath: string;
                fileUrl: string;
                fileSize: number;
                mimeType: string;
            }[];
        } & {
            id: string;
            status: string;
            lastActiveAt: Date;
            createdAt: Date;
            updatedAt: Date;
            atmId: string;
            staffIds: import("@prisma/client/runtime/library").JsonValue;
            proposedAmount: number;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        atmId: string;
        proposedAmount: number;
        conversationId: string;
        staffList: import("@prisma/client/runtime/library").JsonValue;
        submittedData: import("@prisma/client/runtime/library").JsonValue;
        aiRawOutput: string;
        aiState: string | null;
        aiEmergencyScore: number | null;
        aiIncomeScore: number | null;
        aiFamilyScore: number | null;
        aiHealthScore: number | null;
        aiTotalScore: number | null;
        aiDisbursementRate: number | null;
        aiVerificationTier: string | null;
        serverTotalScore: number;
        serverDisbursementRate: number;
        approvedAmount: number;
        requireStaffConfirm: boolean;
        warnings: import("@prisma/client/runtime/library").JsonValue | null;
        processedAt: Date;
    })[]>;
    getRecordDetail(id: string): Promise<{
        conversation: {
            messages: {
                content: string;
                id: string;
                createdAt: Date;
                conversationId: string;
                role: string;
                action: string | null;
                clientTimestamp: string | null;
            }[];
            files: {
                id: string;
                createdAt: Date;
                conversationId: string;
                fileName: string;
                originalName: string;
                filePath: string;
                fileUrl: string;
                fileSize: number;
                mimeType: string;
            }[];
        } & {
            id: string;
            status: string;
            lastActiveAt: Date;
            createdAt: Date;
            updatedAt: Date;
            atmId: string;
            staffIds: import("@prisma/client/runtime/library").JsonValue;
            proposedAmount: number;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        atmId: string;
        proposedAmount: number;
        conversationId: string;
        staffList: import("@prisma/client/runtime/library").JsonValue;
        submittedData: import("@prisma/client/runtime/library").JsonValue;
        aiRawOutput: string;
        aiState: string | null;
        aiEmergencyScore: number | null;
        aiIncomeScore: number | null;
        aiFamilyScore: number | null;
        aiHealthScore: number | null;
        aiTotalScore: number | null;
        aiDisbursementRate: number | null;
        aiVerificationTier: string | null;
        serverTotalScore: number;
        serverDisbursementRate: number;
        approvedAmount: number;
        requireStaffConfirm: boolean;
        warnings: import("@prisma/client/runtime/library").JsonValue | null;
        processedAt: Date;
    }>;
    updateRecordStatus(id: string, body: {
        status: 'APPROVED' | 'REJECTED';
        note?: string;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        atmId: string;
        proposedAmount: number;
        conversationId: string;
        staffList: import("@prisma/client/runtime/library").JsonValue;
        submittedData: import("@prisma/client/runtime/library").JsonValue;
        aiRawOutput: string;
        aiState: string | null;
        aiEmergencyScore: number | null;
        aiIncomeScore: number | null;
        aiFamilyScore: number | null;
        aiHealthScore: number | null;
        aiTotalScore: number | null;
        aiDisbursementRate: number | null;
        aiVerificationTier: string | null;
        serverTotalScore: number;
        serverDisbursementRate: number;
        approvedAmount: number;
        requireStaffConfirm: boolean;
        warnings: import("@prisma/client/runtime/library").JsonValue | null;
        processedAt: Date;
    }>;
}
