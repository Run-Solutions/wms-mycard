import { IsInt, IsNumber, IsNotEmpty, IsString, IsArray, IsOptional, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

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

export class SampleDataDto {
  @IsOptional()
  @IsNumber()
  sample_quantity?: number;
  
  @IsOptional()
  @IsNumber()
  sample_auditory?: number;
}

export class UpdateAreaDataDto {
  block: string;

  blockId: number;

  @IsOptional()
  formId?: number;

  @IsOptional()
  cqmId?: number;

  data: Record<string, any>;

  @ValidateNested()
  @Type(() => SampleDataDto)
  sample_data: SampleDataDto;
}

  export class UpdateWorkOrderAreasDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateAreaDataDto)
    areas: UpdateAreaDataDto[];
  }