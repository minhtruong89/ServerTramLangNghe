"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const medical_record_service_1 = require("../src/medical-record/medical-record.service");
describe('MedicalRecordService - Scoring & Calculation', () => {
    let service;
    beforeEach(() => {
        service = new medical_record_service_1.MedicalRecordService(null, null);
    });
    it('should parse valid AI output string correctly', () => {
        const mockAiOutput = `
Trạng thái: HỢP LỆ
Emergency: 15/25 - Cần trong vài ngày tới
Income & RRTC: 28/35 - Phần A: thu nhập bình quân 70.000 đ/ngày (18d) + Phần B: nợ 1-3 tháng thu nhập không có tài sản (10d)
Family: 18/30 - Nuôi 2 người phụ thuộc
Health: 10/30 - Cần điều trị ngoại trú

Total Score: 71
Công thức: MIN(100, 15 + 28 + 18 + 10) = 71

Hệ số giải ngân: 80%
Xác minh chứng cứ: Mức A - Xử lý tự động có đơn thuốc đính kèm

Kết luận: Hoàn cảnh khó khăn cần được hỗ trợ tiền viện phí.
`;
        const parsed = service.parseAiScoringOutput(mockAiOutput);
        expect(parsed.state).toBe('HỢP LỆ');
        expect(parsed.emergency).toBe(15);
        expect(parsed.income).toBe(28);
        expect(parsed.family).toBe(18);
        expect(parsed.health).toBe(10);
        expect(parsed.totalScore).toBe(71);
        expect(parsed.rate).toBe(80);
        expect(parsed.tier).toContain('Mức A');
    });
    it('should calculate correct disbursement rates from severity score', () => {
        const calcRate = service.calculateDisbursementRate;
        expect(calcRate(0)).toBe(0);
        expect(calcRate(15)).toBe(20);
        expect(calcRate(35)).toBe(40);
        expect(calcRate(55)).toBe(60);
        expect(calcRate(75)).toBe(80);
        expect(calcRate(95)).toBe(100);
        expect(calcRate(100)).toBe(100);
    });
    it('should calculate correct approved amounts', () => {
        const proposedAmount = 1500000;
        const rate = 80;
        const approvedAmount = Math.floor((proposedAmount * rate) / 100);
        expect(approvedAmount).toBe(1200000);
    });
});
//# sourceMappingURL=scoring-logic.spec.js.map