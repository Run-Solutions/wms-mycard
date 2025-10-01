// myorg/apps/frontend-web/src/components/SeguimientoDeOts/BadQuantityModal.tsx
import React from 'react';
import { AreaData } from '@/app/(protected)/seguimientoDeOts/[id]/page';

export interface BadQuantityModalResult {
  inputsByArea: Array<{
    areaId: number;
    areaName: string;
    values: Array<{ label: string; value: number }>;
  }>;
  updatedAreas: AreaData[];
}

interface Props {
  areas: AreaData[];
  areaBadQuantities: { [key: string]: string };
  setAreaBadQuantities: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onConfirm: (result: BadQuantityModalResult) => void;
  onClose: () => void;
  isEditable?: boolean;
}

const BadQuantityModal: React.FC<Props> = ({
  areas,
  areaBadQuantities,
  setAreaBadQuantities,
  onConfirm,
  onClose,
  isEditable = true,
}) => {
  const normalizeKey = (value: string | undefined | null) =>
    (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s/g, '');

  const handleConfirm = () => {
    const parseValue = (value: string | number | undefined) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
    };

    const updatedAreas = areas.map((area) => {
      const key = normalizeKey(area.name);
      const badValue = parseValue(areaBadQuantities[`${key}_bad`]);
      const materialValue = parseValue(areaBadQuantities[`${key}_material`]);

      return {
        ...area,
        malas: badValue,
        defectuoso: area.id >= 6 ? materialValue : area.defectuoso,
      };
    });

    const inputsByArea = areas.map((area) => {
      const key = normalizeKey(area.name);
      const badValue = parseValue(areaBadQuantities[`${key}_bad`]);

      const values: Array<{ label: string; value: number }> = [
        { label: 'Malas', value: badValue },
      ];

      if (area.id >= 6) {
        const materialValue = parseValue(areaBadQuantities[`${key}_material`]);
        values.push({ label: 'Malo de fábrica', value: materialValue });
      }

      return {
        areaId: area.id,
        areaName: area.name,
        values,
      };
    });

    onConfirm({ updatedAreas, inputsByArea });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[70vh] shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <h4 className="text-xl font-bold text-gray-800">
            Registrar cantidades por área
          </h4>
        </div>

        {/* Contenido con scroll */}
        <div className="overflow-y-auto px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {areas.map((area, index) => {
              const areaKey = normalizeKey(area.name);
              return (
                <div
                  key={`${area.id}-${index}`}
                  className="border rounded-lg p-4 bg-gray-50 shadow-sm"
                >
                  <h5 className="font-semibold text-gray-700 mb-3 border-b pb-1">
                    {area.name.toUpperCase()}
                  </h5>

                  <div className="space-y-3">
                    {/* Malas */}
                    <div>
                      <label className="block text-sm text-gray-600 font-medium mb-1">
                        Malas
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-blue-500"
                        value={areaBadQuantities[`${areaKey}_bad`] || '0'}
                        onChange={(e) =>
                          setAreaBadQuantities((prev) => ({
                            ...prev,
                            [`${areaKey}_bad`]: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Defectuoso */}
                    {area.id >= 6 && (
                      <div>
                        <label className="block text-sm text-gray-600 font-medium mb-1">
                          Materia Prima Defectuosa
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-blue-500"
                          value={areaBadQuantities[`${areaKey}_material`] || '0'}
                          onChange={(e) =>
                            setAreaBadQuantities((prev) => ({
                              ...prev,
                              [`${areaKey}_material`]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Cancelar
          </button>
          {isEditable &&(<button
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg"
          >
            Confirmar
          </button>)}
        </div>
      </div>
    </div>
  );
};

export default BadQuantityModal;