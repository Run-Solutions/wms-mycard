import {
  IsInt,
  IsNumber,
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsIn,
  IsObject,
} from 'class-validator';
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
  total_sheets: number;

  @IsInt()
  quantity_contacts: number;

  @IsString()
  isCollator: string;

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

export class AreaInputValueDto {
  @IsString()
  label!: string;

  @Type(() => Number)
  @IsNumber()
  value!: number;
}

export class BadQuantitySummaryDto {
  @Type(() => Number)
  @IsInt()
  areaId!: number;

  @IsString()
  areaName!: string;

  @ValidateNested({ each: true })
  @Type(() => AreaInputValueDto)
  values!: AreaInputValueDto[];
}

export class UpdateAreaDataDto {
  areaId: number;
  block: string;

  blockId: number;

  @IsOptional()
  formId?: number;

  @IsOptional()
  cqmId?: number;

  data: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SampleDataDto)
  sample_data?: SampleDataDto;
}

export class UpdateWorkOrderAreasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAreaDataDto)
  areas: UpdateAreaDataDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BadQuantitySummaryDto)
  badQuantitySummary?: BadQuantitySummaryDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  partialReleaseId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sourceAreaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sourceWorkOrderFlowId?: number;
}

export const AREA_RESPONSE_BLOCKS = [
  'prepress',
  'impression',
  'serigrafia',
  'empalme',
  'laminacion',
  'corte',
  'colorEdge',
  'hotStamping',
  'millingChip',
  'personalizacion',
] as const;

export type AreaResponseBlock = (typeof AREA_RESPONSE_BLOCKS)[number];

export class UpdateAreaResponseEntryDto {
  @Type(() => Number)
  @IsInt()
  areaId!: number;

  @IsIn(AREA_RESPONSE_BLOCKS)
  block!: AreaResponseBlock;

  @Type(() => Number)
  @IsInt()
  blockId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  formId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cqmId?: number;

  @IsObject()
  data!: Record<string, number>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SampleDataDto)
  sample_data?: SampleDataDto;
}

export class UpdateAreaResponseDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAreaResponseEntryDto)
  areas!: UpdateAreaResponseEntryDto[];
}

export class UpdateFlowUserDto {
  @Type(() => Number)
  @IsInt()
  flowId!: number;

  @Type(() => Number)
  @IsInt()
  userId!: number;
}

export class UpdateFlowPartialUserDto {
  @Type(() => Number)
  @IsInt()
  partialId!: number;

  @Type(() => Number)
  @IsInt()
  userId!: number;
}
