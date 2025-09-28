// myorg/apps/frontend-mobile/src/components/AceptarAuditoria/CorteComponents.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  acceptWorkOrderFlowAuditory,
  registrarInconformidadAuditory,
} from '../../api/aceptarAuditoria';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { TextInput } from 'react-native-paper';
import {
  buildDefaultValuesByArea,
  AreaBlock,
  DefaultValues,
  toNum
} from './util/quantityWorkOrder';

export type AfterCorteData = {
  good_quantity: number | string;
  bad_quantity: number | string;
  excess_quantity: number | string;
  noprocess_quantity: number | string;
  cqm_quantity: number | string; // <- antes era string
  comments: string;
  total_quantity: number;
  total_execbuen: number;
};



const CorteComponentAcceptAuditory: React.FC<{ workOrder: any }> = ({
  workOrder,
}) => {
  const [defaultValues, setDefaultValues] = useState<AfterCorteData>({
    good_quantity: '',
    bad_quantity: '',
    excess_quantity: '',
    noprocess_quantity: '',
    cqm_quantity: '',     // <- puede ser '' o número
    comments: '',
    total_quantity: 0,
    total_execbuen: 0,
  });
  const navigation =
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');
  const [sampleAuditory, setSampleAuditory] = useState('');
  const isValidArea = (workOrder?.area_id ?? 0) >= 2;
  const asStrNum = (v: unknown): string | number => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v as string | number; // ya restringimos los otros casos
  };
  
  const toAfterCorteData = (
    d: DefaultValues,
    prev?: AfterCorteData
  ): AfterCorteData => {
    return {
      ...(prev ?? ({} as AfterCorteData)),
  
      good_quantity: asStrNum(d.good_quantity),
      bad_quantity: asStrNum(d.bad_quantity),
      excess_quantity: asStrNum(d.excess_quantity),
      noprocess_quantity: asStrNum(d.noprocess_quantity),
      cqm_quantity: asStrNum(d.cqm_quantity),
  
      comments: (d.comments ?? '') as string,
      total_quantity: d.total_quantity ?? 0,
  
      // Si quieres otro criterio, cámbialo aquí
      total_execbuen: toNum(d.good_quantity),
    };
  };
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [areaName: string]: string;
  }>({});

  const cqm_quantity = workOrder.answers.reduce(
    (total: number, answer: { sample_quantity?: number | string }) => {
      return total + (Number(answer.sample_quantity) || 0);
    },
    0
  );

  const makeAreaKey = (name?: string) =>
    (name ?? '').toLowerCase().replace(/\s/g, '');

  const areaKeyActual = useMemo(() => {
    return makeAreaKey(workOrder?.area?.name);
  }, [workOrder?.area?.name]);

  const sumaBadQuantity = useMemo(() => {
    const bad = Number(areaBadQuantities[`${areaKeyActual}_bad`] || 0);
    const mat =
      (workOrder?.area?.id ?? 0) >= 6
        ? Number(areaBadQuantities[`${areaKeyActual}_material`] || 0)
        : 0;
    return bad + mat;
  }, [areaBadQuantities, areaKeyActual, workOrder?.area?.id]);

  const areaKey: AreaBlock = 'corte';

  useEffect(() => {
    const result = buildDefaultValuesByArea(areaKey, workOrder, sumaBadQuantity, {
      // filterPartialsByArea: (p) => p.area === areaKey
    });
  
    if (result) {
      setDefaultValues(prev => toAfterCorteData(result, prev)); // 
    }
  }, [workOrder, sumaBadQuantity]);

  // Prefill de malas por área (para que sumaBadQuantity se vea sin abrir el modal)
  const currentFlow = workOrder;
  const flowList = [...workOrder.workOrder.flow];
  const currentIndex = flowList.findIndex(
    (item) => item.id === currentFlow?.id
  );
  const previousFlows = flowList
    .slice(0, currentIndex + 1)
    .filter((flow) => flow.area_id !== 1);

  useEffect(() => {
    if (!workOrder) return;
    const initial: Record<string, string> = {};
    (previousFlows ?? []).forEach((flow) => {
      const areaKey = makeAreaKey(flow?.area?.name);

      let badQuantity: number | null | undefined = null;
      let materialBadQuantity: number | null | undefined = null;

      if (flow?.areaResponse?.impression) {
        badQuantity = flow.areaResponse.impression.bad_quantity;
      } else if (flow?.areaResponse?.serigrafia) {
        badQuantity = flow.areaResponse.serigrafia.bad_quantity;
      } else if (flow?.areaResponse?.empalme) {
        badQuantity = flow.areaResponse.empalme.bad_quantity;
      } else if (flow?.areaResponse?.laminacion) {
        badQuantity = flow.areaResponse.laminacion.bad_quantity;
      } else if (flow?.areaResponse?.corte) {
        badQuantity = flow.areaResponse.corte.bad_quantity;
        materialBadQuantity = flow.areaResponse.corte.material_quantity;
      }

      if (badQuantity == null && flow?.partialReleases?.length > 0) {
        badQuantity = flow.partialReleases.reduce(
          (sum: number, r: any) => sum + (r.bad_quantity ?? 0),
          0
        );
        materialBadQuantity = flow.partialReleases.reduce(
          (sum: number, r: any) => sum + (r.material_quantity ?? 0),
          0
        );
      }

      initial[`${areaKey}_bad`] =
        badQuantity != null ? String(badQuantity) : '';
      initial[`${areaKey}_material`] =
        materialBadQuantity != null ? String(materialBadQuantity) : '';
    });
    setAreaBadQuantities(initial);
  }, [workOrder, currentIndex]); // o [previousFlows]

  const handleOpenModal = async () => {
    if (!sampleAuditory) {
      Alert.alert('Error', 'Por favor, asegurate de ingresar muestras.');
      return;
    } else if (
      ((defaultValues.total_quantity ?? 0) + Number(sampleAuditory)) % 24 !==
        0 &&
      workOrder?.areaResponse?.corte
    ) {
      Alert.alert(
        'Error',
        'Por favor, asegurate de ingresar muestras correctas, ya que la cantidad total no es divisible entre 24.'
      );
      return;
    }
    setShowConfirm(true);
  }

  const handleSubmit = async () => {
    const CorteId = workOrder?.areaResponse?.corte?.id ?? workOrder.id;
    try {
      await acceptWorkOrderFlowAuditory(CorteId, sampleAuditory);
      Alert.alert('Recepción aceptada');
      navigation.goBack();
    } catch (err: any) {
      console.error(
        'Error al aceptar orden:',
        err?.response?.data || err.message
      );
      Alert.alert('Error', 'No se pudo aceptar la orden');
    }
  };

  const handleInconformidad = async () => {
    if (!inconformidad.trim()) {
      Alert.alert('Por favor describe la inconformidad.');
      return;
    }
    try {
      await registrarInconformidadAuditory(workOrder?.id, inconformidad);
      Alert.alert('Inconformidad registrada');
      setShowInconformidad(false);
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error al enviar inconformidad');
    }
  };

  console.log('Áreas anteriores sin Preprensa:', previousFlows);

  const handleOpenBadQuantityModal = useCallback(() => {
    if (!isValidArea) return;

    const initialValues: Record<string, string> = {};

    (previousFlows ?? []).forEach((flow) => {
      const areaKey = makeAreaKey(flow?.area?.name);

      let badQuantity: number | null | undefined = null;
      let materialBadQuantity: number | null | undefined = null;

      if (flow?.areaResponse?.impression) {
        badQuantity = flow.areaResponse.impression.bad_quantity;
      } else if (flow?.areaResponse?.serigrafia) {
        badQuantity = flow.areaResponse.serigrafia.bad_quantity;
      } else if (flow?.areaResponse?.empalme) {
        badQuantity = flow.areaResponse.empalme.bad_quantity;
      } else if (flow?.areaResponse?.laminacion) {
        badQuantity = flow.areaResponse.laminacion.bad_quantity;
      } else if (flow?.areaResponse?.corte) {
        badQuantity = flow.areaResponse.corte.bad_quantity;
        materialBadQuantity = flow.areaResponse.corte.material_quantity;
      }

      if (badQuantity == null && flow?.partialReleases?.length > 0) {
        badQuantity = flow.partialReleases.reduce(
          (sum: number, r: any) => sum + (r.bad_quantity ?? 0),
          0
        );
        materialBadQuantity = flow.partialReleases.reduce(
          (sum: number, r: any) => sum + (r.material_quantity ?? 0),
          0
        );
      }

      initialValues[`${areaKey}_bad`] =
        badQuantity != null ? String(badQuantity) : '';
      initialValues[`${areaKey}_material`] =
        materialBadQuantity != null ? String(materialBadQuantity) : '';
    });

    setAreaBadQuantities(initialValues);
    setShowBadQuantity(true);
    console.log('Valores iniciales para malas por área:', initialValues);
  }, [isValidArea, previousFlows]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.subtitle}>Buenas:</Text>
      <TextInput
        style={styles.input}
        editable={false}
        value={String(defaultValues.good_quantity)}
        mode="outlined"
        activeOutlineColor="#000"
        theme={{ roundness: 30 }}
      />
      <Text style={styles.subtitle}>Malas:</Text>
      <TouchableOpacity
        onPress={handleOpenBadQuantityModal}
        activeOpacity={0.7}
      >
        <TextInput
          style={styles.input}
          theme={{ roundness: 30 }}
          mode="outlined"
          activeOutlineColor="#000"
          keyboardType="numeric"
          value={String(sumaBadQuantity)}
          editable={false}
        />
      </TouchableOpacity>
      <Text style={styles.subtitle}>Excedente:</Text>
      <TextInput
        style={styles.input}
        editable={false}
        value={String(defaultValues.excess_quantity)}
        mode="outlined"
        activeOutlineColor="#000"
        theme={{ roundness: 30 }}
      />
      <Text style={styles.subtitle}>Sin procesar:</Text>
      <TextInput
        style={styles.input}
        editable={false}
        value={String(defaultValues.noprocess_quantity)}
        mode="outlined"
        activeOutlineColor="#000"
        theme={{ roundness: 30 }}
      />
      <Text style={styles.subtitle}>Muestras CQM:</Text>
      <TextInput
        style={styles.input}
        editable={false}
        value={String(defaultValues.cqm_quantity)}
        mode="outlined"
        activeOutlineColor="#000"
        theme={{ roundness: 30 }}
      />
      <Text style={styles.subtitle}>Muestras:</Text>
      <TextInput
        style={styles.inputActive}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 2"
        value={sampleAuditory}
        onChangeText={setSampleAuditory}
      />
      <Text style={styles.subtitle}>Comentarios</Text>
      <TextInput
        style={styles.input}
        editable={false}
        value={String(defaultValues.comments)}
        mode="outlined"
        activeOutlineColor="#000"
        theme={{ roundness: 30 }}
      />
      <View style={styles.modalActions}>
        <TouchableOpacity
          style={styles.incoButton}
          onPress={() => setShowInconformidad(true)}
        >
          <Text style={styles.buttonText}>Inconformidad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleOpenModal}
        >
          <Text style={styles.buttonText}>Aceptar recepción de producto</Text>
        </TouchableOpacity>
      </View>
      {/* Modal para marcar malas por areas previas al liberar */}
      <Modal visible={showBadQuantity} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBoxScrollable}>
            <Text style={styles.modalTitle}>Registrar malas por área</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {previousFlows.map((flow, index) => {
                const areaKey = makeAreaKey(flow?.area?.name);
                return (
                  <View key={`${flow.id}-${index}`} style={{ marginTop: 16 }}>
                    <Text style={styles.areaLabel}>
                      {flow.area.name.toUpperCase()}
                    </Text>

                    <View style={styles.areaInputsContainer}>
                      <View style={[styles.inputGroup, { maxWidth: '40%' }]}>
                        <Text style={styles.inputLabel}>Malas</Text>
                        <TextInput
                          style={styles.input}
                          theme={{ roundness: 30 }}
                          mode="outlined"
                          activeOutlineColor="#000"
                          keyboardType="numeric"
                          value={areaBadQuantities[`${areaKey}_bad`] || '0'}
                          onChangeText={(text) =>
                            setAreaBadQuantities((prev) => ({
                              ...prev,
                              [`${areaKey}_bad`]: text,
                            }))
                          }
                        />
                      </View>

                      {flow.area_id >= 6 && (
                        <View style={[styles.inputGroup, { maxWidth: '40%' }]}>
                          <Text style={styles.inputLabel}>
                            Materia Prima Defectuosa
                          </Text>
                          <TextInput
                            style={styles.input}
                            theme={{ roundness: 30 }}
                            mode="outlined"
                            activeOutlineColor="#000"
                            keyboardType="numeric"
                            value={
                              areaBadQuantities[`${areaKey}_material`] || '0'
                            }
                            onChangeText={(text) =>
                              setAreaBadQuantities((prev) => ({
                                ...prev,
                                [`${areaKey}_material`]: text,
                              }))
                            }
                          />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBadQuantity(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal confirmación */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              ¿Deseas aceptar la recepción del producto?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSubmit}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal inconformidad */}
      <Modal visible={showInconformidad} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>Describe la inconformidad:</Text>
            <TextInput
              value={inconformidad}
              onChangeText={setInconformidad}
              placeholder="Escribe la inconformidad..."
              multiline
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              style={styles.textarea}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInconformidad(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleInconformidad}
              >
                <Text style={styles.modalButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default CorteComponentAcceptAuditory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 8,
    backgroundColor: '#fdfaf6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: 'black',
    padding: Platform.OS === 'ios' ? 10 : 0,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  label: {
    fontWeight: '600',
    marginTop: 2,
    fontSize: 14,
    color: '#374151',
  },
  value: { marginBottom: 6 },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    padding: 10,
    marginBottom: 12,
    height: 30,
    fontSize: 16,
  },
  inputActive: {
    padding: 10,
    backgroundColor: '#fff',
    height: 50,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#fff',
    padding: 12,
    textAlignVertical: 'top',
    height: 100,
  },
  acceptButton: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  incoButton: {
    backgroundColor: '#A9A9A9',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '85%',
  },
  modalText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalBoxScrollable: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  areaLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  areaInputsContainer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  inputGroup: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
});
