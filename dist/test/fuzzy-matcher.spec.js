"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fuzzy_matcher_1 = require("../src/common/fuzzy-matcher");
const string_utils_1 = require("../src/common/string-utils");
describe('Fuzzy Matching & String Utilities', () => {
    it('should normalize Vietnamese names correctly', () => {
        expect((0, string_utils_1.normalizeName)('TRƯƠNG HOÀNG MINH')).toBe('truong hoang minh');
        expect((0, string_utils_1.normalizeName)('LÊ VĂN CHÍNH')).toBe('le van chinh');
        expect((0, string_utils_1.normalizeName)('NGUYỄN TRỌNG TÀI')).toBe('nguyen trong tai');
    });
    it('should match names with 1-2 character typos (Levenshtein distance <= 2)', () => {
        const res1 = (0, fuzzy_matcher_1.fuzzyMatchString)('TRUONG HOANG MIN', 'TRƯƠNG HOÀNG MINH', 2);
        expect(res1.matched).toBe(true);
        expect(res1.distance).toBe(1);
        const res2 = (0, fuzzy_matcher_1.fuzzyMatchString)('LE VAN CHING', 'LÊ VĂN CHÍNH', 2);
        expect(res2.matched).toBe(true);
        expect(res2.distance).toBe(1);
        const res3 = (0, fuzzy_matcher_1.fuzzyMatchString)('TRAN VAN B', 'TRƯƠNG HOÀNG MINH', 2);
        expect(res3.matched).toBe(false);
    });
    it('should match citizenId with 1 character typo', () => {
        const res1 = (0, fuzzy_matcher_1.matchCitizenId)('079089017448', '079089017448', 1);
        expect(res1.matched).toBe(true);
        expect(res1.distance).toBe(0);
        const res2 = (0, fuzzy_matcher_1.matchCitizenId)('079089017449', '079089017448', 1);
        expect(res2.matched).toBe(true);
        expect(res2.distance).toBe(1);
        const res3 = (0, fuzzy_matcher_1.matchCitizenId)('079089017999', '079089017448', 1);
        expect(res3.matched).toBe(false);
    });
});
//# sourceMappingURL=fuzzy-matcher.spec.js.map