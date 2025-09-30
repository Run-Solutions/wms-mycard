// myorg/apps/backend/src/modules/close-auditory-work-order/dto/response.dto.ts
export class UpdateWorkFlowAuditoryDto {
  workOrderFlowId: number;
  workOrderId: number;
}

import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWorkFlowAuditoryParcialDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partialReleaseId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantityRelease!: number;
}
