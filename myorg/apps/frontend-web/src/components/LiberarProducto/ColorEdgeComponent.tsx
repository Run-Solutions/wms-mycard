'use client'

import { useRouter } from 'next/navigation';
import AreaForm, { FieldConfig } from '@myorg/shared/components/AreaForm';
import { releaseProductFromColorEdge } from '@/api/liberarProducto';

interface Props {
  workOrder: any;
}

export default function ColorEdgeComponent({ workOrder }: Props) {
  const router = useRouter();

  const fields: FieldConfig[] = [
    { label: 'Cantidad a liberar', name: 'quantity', value: workOrder?.workOrder?.quantity ?? '' },
    { label: 'Comentarios', name: 'comments', value: workOrder?.workOrder?.comments ?? '' },
  ];

  const handleSubmit = async () => {
    await releaseProductFromColorEdge({ workOrderId: workOrder?.workOrder?.id });
    router.push('/liberarProducto');
  };

  return <AreaForm areaName="Color Edge" fields={fields} onSubmit={handleSubmit} submitLabel="Liberar" />;
}
