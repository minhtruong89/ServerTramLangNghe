import { fuzzyMatchString, matchCitizenId } from '../src/common/fuzzy-matcher';
import { normalizeName } from '../src/common/string-utils';

describe('Fuzzy Matching & String Utilities', () => {
  it('should normalize Vietnamese names correctly', () => {
    expect(normalizeName('TRƯƠNG HOÀNG MINH')).toBe('truong hoang minh');
    expect(normalizeName('LÊ VĂN CHÍNH')).toBe('le van chinh');
    expect(normalizeName('NGUYỄN TRỌNG TÀI')).toBe('nguyen trong tai');
  });

  it('should match names with 1-2 character typos (Levenshtein distance <= 2)', () => {
    // Sai 1 ký tự: "TRUONG HOANG MIN" thiếu 'h'
    const res1 = fuzzyMatchString('TRUONG HOANG MIN', 'TRƯƠNG HOÀNG MINH', 2);
    expect(res1.matched).toBe(true);
    expect(res1.distance).toBe(1);

    // Sai 2 ký tự: "LE VAN CHIN" thiếu 'h' và gõ nhầm 'h' -> 'g'
    const res2 = fuzzyMatchString('LE VAN CHING', 'LÊ VĂN CHÍNH', 2);
    expect(res2.matched).toBe(true);
    expect(res2.distance).toBe(1);

    // Khác biệt hoàn toàn
    const res3 = fuzzyMatchString('TRAN VAN B', 'TRƯƠNG HOÀNG MINH', 2);
    expect(res3.matched).toBe(false);
  });

  it('should match citizenId with 1 character typo', () => {
    // Trùng khớp hoàn toàn
    const res1 = matchCitizenId('079089017448', '079089017448', 1);
    expect(res1.matched).toBe(true);
    expect(res1.distance).toBe(0);

    // Quét nhầm 1 số: số cuối 8 thành 9
    const res2 = matchCitizenId('079089017449', '079089017448', 1);
    expect(res2.matched).toBe(true);
    expect(res2.distance).toBe(1);

    // Quét sai nhiều số (>1)
    const res3 = matchCitizenId('079089017999', '079089017448', 1);
    expect(res3.matched).toBe(false);
  });
});
