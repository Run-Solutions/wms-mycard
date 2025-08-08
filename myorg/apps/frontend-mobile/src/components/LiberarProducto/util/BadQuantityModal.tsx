// myorg/apps/frontend-mobile/src/components/LiberarProducto/util/BadQuantityModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { AreaData } from '../../../app/protected/seguimientoDeOts/[id]/page';

interface Props {
  visible: boolean;
  areas: AreaData[];
  areaBadQuantities: { [key: string]: string };
  setAreaBadQuantities: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  onConfirm: (params: {
    updatedAreas: AreaData[];
    totalBad: number;
    totalMaterial: number;
    lastAreaBad: number;
    lastAreaMaterial: number;
  }) => void;
  onClose: () => void;
}

const BadQuantityModal: React.FC<Props> = ({
  visible,
  areas,
  areaBadQuantities,
  setAreaBadQuantities,
  onConfirm,
  onClose,
}) => {
  const handleConfirm = () => {
    const updatedAreas = areas.map((area) => {
      const key = area.name.toLowerCase().replace(/\s/g, '');
      return {
        ...area,
        malas: Number(areaBadQuantities[`${key}_bad`] || 0),
        defectuoso:
          area.id >= 6
            ? Number(areaBadQuantities[`${key}_material`] || 0)
            : area.defectuoso,
      };
    });
  
    const lastArea = updatedAreas[updatedAreas.length - 1];
    const areaKey = lastArea.name.toLowerCase().replace(/\s/g, '');
  
    const lastAreaBad = Number(areaBadQuantities[`${areaKey}_bad`] || 0);
    const lastAreaMaterial = Number(areaBadQuantities[`${areaKey}_material`] || 0);
  
    const totalBad = Object.keys(areaBadQuantities)
      .filter((key) => key.endsWith('_bad'))
      .reduce((sum, key) => sum + Number(areaBadQuantities[key] || 0), 0);
  
    const totalMaterial = Object.keys(areaBadQuantities)
      .filter((key) => key.endsWith('_material'))
      .reduce((sum, key) => sum + Number(areaBadQuantities[key] || 0), 0);
    onConfirm({
      updatedAreas,
      totalBad,
      totalMaterial,
      lastAreaBad,
      lastAreaMaterial,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Registrar cantidades por área</Text>
          <ScrollView style={styles.scroll}>
            {areas.map((area, index) => {
              const areaKey = area.name.toLowerCase().replace(/\s/g, '');
              return (
                <View key={`${area.id}-${index}`} style={styles.areaCard}>
                  <Text style={styles.areaTitle}>{area.name.toUpperCase()}</Text>

                  {/* Malas */}
                  <Text style={styles.label}>Malas</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={areaBadQuantities[`${areaKey}_bad`] || '0'}
                    onChangeText={(text) =>
                      setAreaBadQuantities((prev) => ({
                        ...prev,
                        [`${areaKey}_bad`]: text,
                      }))
                    }
                  />

                  {/* Defectuoso */}
                  {area.id >= 6 && (
                    <>
                      <Text style={styles.label}>Malo de fábrica</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={areaBadQuantities[`${areaKey}_material`] || '0'}
                        onChangeText={(text) =>
                          setAreaBadQuantities((prev) => ({
                            ...prev,
                            [`${areaKey}_material`]: text,
                          }))
                        }
                      />
                    </>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  scroll: {
    marginBottom: 16,
  },
  areaCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  areaTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    color: 'black',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#9ca3af',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default BadQuantityModal;