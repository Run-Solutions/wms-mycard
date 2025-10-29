// myorg/apps/frontend-web/src/components/SeguimientoDeOts/BadQuantityModal.tsx
import React, { useEffect } from 'react';
import { normalizeAreaKey } from '@/components/LiberarProducto/util/areaMappings';

export type AreaForBadQty = {
  id: number;
  name: string;
  malas: number;
  defectuoso: number;
  supportsMaterial?: boolean;
};

export interface BadQuantityModalResult {
  inputsByArea: Array<{
    areaId: number;
    areaName: string;
    values: Array<{ label: string; value: number }>;
  }>;
  updatedAreas: AreaForBadQty[];
  totalBad: number;
  totalMaterial: number;
  lastAreaBad: number;
  lastAreaMaterial: number;
}

interface Props {
  areas: AreaForBadQty[];
  areaBadQuantities: { [key: string]: string };
  setAreaBadQuantities: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
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
  useEffect(() => {
    setAreaBadQuantities((prev) => {
      let hasChanges = false;
      const next = { ...prev };

      areas.forEach((area) => {
        const areaKey = normalizeAreaKey(area.name);
        const badKey = `${areaKey}_bad`;
        const materialKey = `${areaKey}_material`;

        if (!Object.prototype.hasOwnProperty.call(next, badKey)) {
          next[badKey] = String(area.malas ?? 0);
          hasChanges = true;
        }

        if (
          (area.supportsMaterial ?? false) &&
          !Object.prototype.hasOwnProperty.call(next, materialKey)
        ) {
          next[materialKey] = String(area.defectuoso ?? 0);
          hasChanges = true;
        }
      });

      return hasChanges ? next : prev;
    });
  }, [areas, setAreaBadQuantities]);

  const parseValue = (value: string | number | undefined) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
  };

  const handleConfirm = () => {
    if (!isEditable) return;

    const updatedAreas = areas.map((area) => {
      const key = normalizeAreaKey(area.name);
      const supportsMaterial = area.supportsMaterial ?? false;
      const badValue = parseValue(areaBadQuantities[`${key}_bad`]);
      const materialValue = supportsMaterial
        ? parseValue(areaBadQuantities[`${key}_material`])
        : area.defectuoso;

      return {
        ...area,
        malas: badValue,
        defectuoso: supportsMaterial ? materialValue : area.defectuoso,
      };
    });

    const inputsByArea = areas.map((area) => {
      const key = normalizeAreaKey(area.name);
      const supportsMaterial = area.supportsMaterial ?? false;
      const badValue = parseValue(areaBadQuantities[`${key}_bad`]);

      const values: Array<{ label: string; value: number }> = [
        { label: 'Malas', value: badValue },
      ];

      if (supportsMaterial) {
        values.push({
          label: 'Malo de fábrica',
          value: parseValue(areaBadQuantities[`${key}_material`]),
        });
      }

      return {
        areaId: area.id,
        areaName: area.name,
        values,
      };
    });

    const lastArea = areas[areas.length - 1];
    const lastKey = normalizeAreaKey(lastArea?.name ?? '');
    const lastSupportsMaterial = lastArea?.supportsMaterial ?? false;

    const lastAreaBad = lastArea
      ? parseValue(areaBadQuantities[`${lastKey}_bad`])
      : 0;
    const lastAreaMaterial = lastSupportsMaterial
      ? parseValue(areaBadQuantities[`${lastKey}_material`])
      : 0;

    const totalBad = areas.reduce((sum, area) => {
      const key = normalizeAreaKey(area.name);
      return sum + parseValue(areaBadQuantities[`${key}_bad`]);
    }, 0);

    const totalMaterial = areas.reduce((sum, area) => {
      if (!(area.supportsMaterial ?? false)) return sum;
      const key = normalizeAreaKey(area.name);
      return sum + parseValue(areaBadQuantities[`${key}_material`]);
    }, 0);

    onConfirm({
      updatedAreas,
      inputsByArea,
      totalBad,
      totalMaterial,
      lastAreaBad,
      lastAreaMaterial,
    });
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
              const areaKey = normalizeAreaKey(area.name);
              const supportsMaterial = area.supportsMaterial ?? area.id >= 6;
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
                        style={{ color: '#374151' }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-blue-500"
                        disabled={!isEditable}
                        readOnly={!isEditable}
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
                    {supportsMaterial && (
                      <div>
                        <label className="block text-sm text-gray-600 font-medium mb-1">
                          Malo de fábrica
                        </label>
                        <input
                          type="number"
                          min="0"
                          style={{ color: '#374151' }}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-blue-500"
                          disabled={!isEditable}
                          readOnly={!isEditable}
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
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isEditable}
            className={`px-5 py-2 rounded-lg font-semibold text-white transition-colors ${
              isEditable
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-300 cursor-not-allowed'
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadQuantityModal;
