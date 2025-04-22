/*myorg\apps\backend\src\modules\work-order\dto\create-work-order.dto.ts*/
import { IsInt, IsNotEmpty, IsString, IsArray, IsBoolean } from "class-validator";
import { Transform } from 'class-transformer';

export class CreateWorkOrderDto {
    @IsString()
    @IsNotEmpty()
    ot_id: string;
    
    @IsString()
    @IsNotEmpty()
    mycard_id: string;
    
    @IsString()
    @IsNotEmpty()
    status: string;
    
    @IsBoolean()
    @IsNotEmpty()
    @Transform(({ value }) => value === 'true' || value === true)
    priority: boolean;
    
    @IsInt()
    quantity: number;
    
    @IsInt()
    created_by: number;

    @IsArray()
    @IsInt({ each: true })
    areasOperatorIds: number[];
}