import { IsInt, IsNotEmpty, IsString, IsArray, IsOptional } from "class-validator";

export class CreateWorkOrderDto {
    @IsString()
    @IsNotEmpty()
    ot_id: string;

    @IsString()
    @IsNotEmpty()
    mycard_id: string;

    @IsOptional() // Hacemos que el comentario sea opcional
    @IsString()
    comments?: string;

    @IsString()
    @IsNotEmpty()
    status: string;

    @IsString()
    @IsNotEmpty()
    priority: string;

    @IsInt()
    quantity: number;

    @IsInt()
    created_by: number;

    @IsArray()
    @IsInt({ each: true })
    areasOperatorIds: number[];
}