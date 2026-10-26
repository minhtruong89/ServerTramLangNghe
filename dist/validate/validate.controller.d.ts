import { ValidateService, ValidateAtmStaffRequest, ValidateAtmStaffResponse } from './validate.service';
export declare class ValidateController {
    private readonly validateService;
    constructor(validateService: ValidateService);
    validate(dto: ValidateAtmStaffRequest): Promise<ValidateAtmStaffResponse>;
}
