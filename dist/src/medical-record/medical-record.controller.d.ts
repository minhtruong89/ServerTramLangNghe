import { MedicalRecordService, MedicalRecordRequestDto, MedicalRecordResponseDto } from './medical-record.service';
export declare class MedicalRecordController {
    private readonly recordService;
    constructor(recordService: MedicalRecordService);
    createMedicalRecord(dto: MedicalRecordRequestDto): Promise<MedicalRecordResponseDto>;
}
