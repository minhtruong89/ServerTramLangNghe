"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuzzyMatchString = fuzzyMatchString;
exports.matchCitizenId = matchCitizenId;
const string_utils_1 = require("./string-utils");
const fastest_levenshtein_1 = require("fastest-levenshtein");
function fuzzyMatchString(input, target, maxDistance = 2) {
    if (!input || !target) {
        return { matched: false, distance: 999, reason: 'Empty string' };
    }
    const normInput = (0, string_utils_1.normalizeName)(input);
    const normTarget = (0, string_utils_1.normalizeName)(target);
    if (normInput === normTarget) {
        return { matched: true, distance: 0 };
    }
    const dist = (0, fastest_levenshtein_1.distance)(normInput, normTarget);
    return {
        matched: dist <= maxDistance,
        distance: dist,
        reason: dist <= maxDistance ? 'Fuzzy matched' : 'Distance exceeded',
    };
}
function matchCitizenId(inputId, targetId, maxDistance = 1) {
    if (!inputId) {
        return { matched: false, distance: 999, reason: 'No citizen ID provided' };
    }
    const cleanInput = inputId.replace(/\D/g, '');
    const cleanTarget = targetId.replace(/\D/g, '');
    if (cleanInput === cleanTarget) {
        return { matched: true, distance: 0 };
    }
    const dist = (0, fastest_levenshtein_1.distance)(cleanInput, cleanTarget);
    return {
        matched: dist <= maxDistance,
        distance: dist,
    };
}
//# sourceMappingURL=fuzzy-matcher.js.map