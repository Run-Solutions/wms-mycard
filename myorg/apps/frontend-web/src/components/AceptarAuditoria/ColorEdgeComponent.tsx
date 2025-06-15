'use client'

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import AreaForm, { FieldConfig } from '@myorg/shared/components/AreaForm';
import { acceptWorkOrderFlowColorEdgeAuditory } from '@/api/aceptarAuditoria';

interface Props {
  workOrder: any;
}

export default function ColorEdgeComponentAcceptAuditory({ workOrder }: Props) {
  const router = useRouter();
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [sampleAuditory, setSampleQuantity] = useState('');

  useEffect(() => {
    if (!workOrder) return;
    const cqm_quantity = workOrder.answers?.reduce(
      (total: number, a: { sample_quantity?: number | string }) => total + (Number(a.sample_quantity) || 0),
      0
    ) || 0;

    const vals: FieldConfig[] = [
      { label: 'Buenas', name: 'good_quantity', value: workOrder.areaResponse?.colorEdge?.good_quantity ?? '' },
      { label: 'Malas', name: 'bad_quantity', value: workOrder.areaResponse?.colorEdge?.bad_quantity ?? '' },
      { label: 'Excedente', name: 'excess_quantity', value: workOrder.areaResponse?.colorEdge?.excess_quantity ?? '' },
      { label: 'Muestras en CQM', name: 'cqm_quantity', value: cqm_quantity },
      { label: 'Muestras', name: 'sampleAuditory', value: sampleAuditory }
    ];
    setFields(vals);
  }, [workOrder, sampleAuditory]);

  const handleSubmit = async () => {
    await acceptWorkOrderFlowColorEdgeAuditory(workOrder?.id, sampleAuditory);
    router.push('/aceptarAuditoria');
  };

  return <AreaForm areaName={workOrder?.area?.name || ''} fields={fields} onSubmit={handleSubmit} />;
}
