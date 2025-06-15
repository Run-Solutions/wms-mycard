'use client'

import { useRouter } from 'next/navigation';
import AreaForm, { FieldConfig } from '@myorg/shared/components/AreaForm';
import { acceptWorkOrderFlow } from '@/api/aceptarProducto';

interface Props {
  workOrder: any;
}

export default function EmpalmeComponentAccept({ workOrder }: Props) {
  const router = useRouter();

  const fields: FieldConfig[] = [
    { label: 'Cantidad entregada', name: 'release_quantity', value: workOrder?.areaResponse?.empalme?.release_quantity ?? '' },
    { label: 'Comentarios', name: 'comments', value: workOrder?.areaResponse?.empalme?.comments ?? '' },
  ];

  const handleSubmit = async () => {
    await acceptWorkOrderFlow(workOrder?.id);
    router.push('/aceptarProducto');
  };

  return (
    <AreaForm areaName={workOrder?.area?.name || ''} fields={fields} onSubmit={handleSubmit} submitLabel="Aceptar" />
  );
}
