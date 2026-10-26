export interface MatchResult {
    matched: boolean;
    distance: number;
    reason?: string;
}
export declare function fuzzyMatchString(input: string, target: string, maxDistance?: number): MatchResult;
export declare function matchCitizenId(inputId: string | null | undefined, targetId: string, maxDistance?: number): MatchResult;
