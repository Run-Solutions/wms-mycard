/*myorg\apps\backend\src\modules\work-order\dto\create-work-order.dto.ts*/
import { IsInt, IsNotEmpty, IsString, IsArray } from "class-validator";

export class CreateWorkOrderDto {
    @IsString()
    @IsNotEmpty()
    ot_id: string;
    
    @IsString()
    @IsNotEmpty()
    mycard_id: string;
    
    @IsInt()
    quantity: number;
    
    @IsInt()
    created_by: number;

    @IsArray()
    @IsInt({ each: true })
    areasOperatorIds: number[];
}