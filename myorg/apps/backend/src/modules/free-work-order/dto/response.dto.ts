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