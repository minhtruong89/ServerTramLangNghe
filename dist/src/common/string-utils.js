"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeVietnameseTones = removeVietnameseTones;
exports.normalizeName = normalizeName;
function removeVietnameseTones(str) {
    if (!str)
        return '';
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
    return str;
}
function normalizeName(name) {
    if (!name)
        return '';
    return removeVietnameseTones(name)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}
//# sourceMappingURL=string-utils.js.map