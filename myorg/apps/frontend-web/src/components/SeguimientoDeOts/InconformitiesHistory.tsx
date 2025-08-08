// myorg/apps/frontend-web/src/components/SeguimientoDeOts/InconformitiesHistory.tsx
import React from 'react';
import { InconformityData } from '@/app/(protected)/seguimientoDeOts/[id]/page';

interface Props {
  inconformities: InconformityData[];
  qualitySectionOpen: boolean;
  toggleQualitySection: () => void;
}

const InconformitiesHistory: React.FC<Props> = ({
  inconformities,
  qualitySectionOpen,
  toggleQualitySection,
}) => {
  if (inconformities.length === 0) return (
    <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl mt-4 mb-2">
      ⚠️ No hay inconformidades registradas.
    </div>
  );

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Historial de Inconformidades
        </h3>
        <button
          onClick={toggleQualitySection}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          {qualitySectionOpen ? 'Ocultar' : 'Mostrar'}
          <span>{qualitySectionOpen ? '▼' : '▶'}</span>
        </button>
      </div>

      {qualitySectionOpen && (
        <div className="overflow-x-auto border rounded-xl bg-white shadow mb-2">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3 text-left">Área</th>
                <th className="p-3 text-left">Comentario</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Reportado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inconformities.map((inc) => (
                <tr key={inc.id}>
                  <td className="p-3 font-medium">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {inc.area}
                    </span>
                  </td>
                  <td className="p-3 max-w-sm">
                    <span
                      className="block text-gray-800 truncate"
                      title={inc.comments}
                    >
                      {inc.comments}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">
                    {new Date(inc.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {inc.createdBy}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InconformitiesHistory;