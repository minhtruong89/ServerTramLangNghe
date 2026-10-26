export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
  return str;
}

export function normalizeName(name: string): string {
  if (!name) return '';
  return removeVietnameseTones(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
