// cmyorg/apps/frontend-web/src/components/SeguimientoDeOts/ProgressBarAreas.tsx
import React from 'react';
import { AreaData } from '@/app/(protected)/seguimientoDeOts/[id]/page';

interface Props {
  areas: AreaData[];
  progressWidth: number;
}

const ProgressBarAreas: React.FC<Props> = ({ areas, progressWidth }) => {
  const completed = areas.filter((a) => a.status === 'Completado').length;
  const total = areas.length;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="bg-white shadow rounded-xl p-6 mb-8 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Progreso General</h3>

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          {completed} de {total} áreas completadas
        </p>
        <p className="text-sm font-medium text-blue-600">{percentage}%</p>
      </div>

      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-700 ease-out"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBarAreas;