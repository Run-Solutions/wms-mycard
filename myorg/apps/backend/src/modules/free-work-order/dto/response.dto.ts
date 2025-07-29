// myorg/apps/backend/src/modules/free-work-order/dto/response.dto.ts
export class CreatePrepressResponseDto {
  workOrderId: number;
  workOrderFlowId: number;
  areaId: number; // área que está respondiendo
  assignedUser?: number; // si quieres registrar quién lo tiene asignado
  
  plates: number;
  positives: number;
  testType: 'color' | 'fisica' | 'digital';
  comments?: string;
}

export class CreateImpressResponseDto {
  workOrderId: number;
  workOrderFlowId: number;
  areaId: number; // área que está respondiendo
  assignedUser?: number; // si quieres registrar quién lo tiene asignado
  
  releaseQuantity: number;
  comments?: string;
  formAnswerId: number;  // ID de la respuesta de CQM aprobada
}

export class CreateEmpalmeResponseDto {
  workOrderId: number;
  workOrderFlowId: number;
  areaId: number; // área que está respondiendo
  assignedUser?: number; // si quieres registrar quién lo tiene asignado
  
  releaseQuantity: number;
  comments?: string;
  formAnswerId: number;  // ID de la respuesta de CQM aprobada
}

export class CreateLaminacionResponseDto {
  workOrderId: number;
  workOrderFlowId: number;
  areaId: number; // área que está respondiendo
  assignedUser?: number; // si quieres registrar quién lo tiene asignado
  
  releaseQuantity: number;
  comments?: string;
  formAnswerId: number;  // ID de la respuesta de CQM aprobada
}

export class CreateCorteResponseDto {
  workOrderId: number;
  workOrderFlowId: number;
  areaId: number; // área que está respondiendo
  assignedUser?: number; // si quieres registrar quién lo tiene asignado
  
  goodQuantity: number;
  badQuantity: number;
  materialBadQuantity: number;
  excessQuantity: number;
  comments?: string;
  formAnswerId: number;  // ID de la respuesta de CQM aprobada
}