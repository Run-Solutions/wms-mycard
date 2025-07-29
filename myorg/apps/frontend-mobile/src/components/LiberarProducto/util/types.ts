// ✅ myorg/apps/frontend-mobile/src/components/LiberarProducto/util/types.ts

export interface File {
  id: number;
  type: string;
  file_path: string;
}

export interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  status: string;
  validated: boolean;
  createdAt: string;
  user: {
    username: string;
  };
  flow: {
    area_id: number;
    status: string;
    area?: { name?: string };
  }[];
  files: File[];
}

export type SortableField = 'ot_id' | 'createdAt';
export type OrderDirection = 'asc' | 'desc';

export type StatusColor =
  | '#22c55e' // Completado
  | '#facc15' // En Calidad
  | '#f5945c' // Parcial
  | '#4a90e2' // En Proceso
  | '#d1d5db'; // Sin Estado