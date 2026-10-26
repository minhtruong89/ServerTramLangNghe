import { normalizeName } from './string-utils';
import { distance } from 'fastest-levenshtein';

export interface MatchResult {
  matched: boolean;
  distance: number;
  reason?: string;
}

/**
 * So khớp tên hoặc số CCCD với dung sai tối đa maxDistance (mặc định 2 ký tự)
 */
export function fuzzyMatchString(
  input: string,
  target: string,
  maxDistance = 2,
): MatchResult {
  if (!input || !target) {
    return { matched: false, distance: 999, reason: 'Empty string' };
  }

  const normInput = normalizeName(input);
  const normTarget = normalizeName(target);

  if (normInput === normTarget) {
    return { matched: true, distance: 0 };
  }

  const dist = distance(normInput, normTarget);
  return {
    matched: dist <= maxDistance,
    distance: dist,
    reason: dist <= maxDistance ? 'Fuzzy matched' : 'Distance exceeded',
  };
}

/**
 * So khớp mã số CCCD (chỉ lấy chữ số để so sánh)
 */
export function matchCitizenId(
  inputId: string | null | undefined,
  targetId: string,
  maxDistance = 1,
): MatchResult {
  if (!inputId) {
    return { matched: false, distance: 999, reason: 'No citizen ID provided' };
  }

  const cleanInput = inputId.replace(/\D/g, '');
  const cleanTarget = targetId.replace(/\D/g, '');

  if (cleanInput === cleanTarget) {
    return { matched: true, distance: 0 };
  }

  const dist = distance(cleanInput, cleanTarget);
  return {
    matched: dist <= maxDistance,
    distance: dist,
  };
}
