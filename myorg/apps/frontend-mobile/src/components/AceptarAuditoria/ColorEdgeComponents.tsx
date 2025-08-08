// myorg/apps/frontend-mobile/src/components/AceptarAuditoria/ColorEdgeComponents.tsx
import React, { useEffect, useState } from 'react';
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
  acceptWorkOrderFlowColorEdgeAuditory,
  registrarInconformidadAuditory,
} from '../../api/aceptarAuditoria';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { TextInput } from 'react-native-paper';

type ColorEdgeData = {
  good_quantity: number;
  bad_quantity: number;
  excess_quantity: number;
  cqm_quantity: string;
  comments: string;
};

type PartialRelease = {
  area: string;
  quantity: string;
  bad_quantity: string;
  excess_quantity: string;
  observation: string;
  validated: boolean;
};

const ColorEdgeComponentAcceptAuditory: React.FC<{ workOrder: any }> = ({
  workOrder,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');
  const [sampleAuditory, setSampleAuditory] = useState('');
  const [defaultValues, setDefaultValues] = useState<ColorEdgeData>({
    good_quantity: 0,
    bad_quantity: 0,
    excess_quantity: 0,
    cqm_quantity: '',
    comments: '',
  });
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [areaName: string]: string;
  }>({});
  const [materialBadQuantity, setMaterialBadQuantity] = useState<string>('0');

  const cqm_quantity = workOrder.answers.reduce(
    (total: number, answer: { sample_quantity?: number | string }) => {
      return total + (Number(answer.sample_quantity) || 0);
    },
    0
  );

  useEffect(() => {
    if (!workOrder) return;

    const colorEdge = workOrder.areaResponse?.colorEdge;
    const partials = workOrder.partialReleases;

    const allValidated =
      partials.length > 0 && partials.every((p: any) => p.validated);

    if (colorEdge && partials.length === 0) {
      // Caso original: hay empalme pero no hay parciales
      const vals: ColorEdgeData = {
        good_quantity: colorEdge.good_quantity || '',
        bad_quantity: colorEdge.bad_quantity || '',
        excess_quantity: colorEdge.excess_quantity || '',
        cqm_quantity: cqm_quantity || '',
        comments: colorEdge.comments || '',
      };
      setDefaultValues(vals);
    } else if (colorEdge && allValidated) {
      // Nuevo caso: todos los parciales están validados y hay empalme
      const totalParciales = partials.reduce(
        (acc: any, curr: any) => acc + (curr.quantity || 0),
        0
      );
      const totalParcialesbad = partials.reduce(
        (acc: any, curr: any) => acc + (curr.bad_quantity || 0),
        0
      );
      const totalParcialesexec = partials.reduce(
        (acc: any, curr: any) => acc + (curr.excess_quantity || 0),
        0
      );
      const restante = (colorEdge.good_quantity || 0) - totalParciales;
      const restantebad = (colorEdge.bad_quantity || 0) - totalParcialesbad;
      const restanteexc = (colorEdge.excess_quantity || 0) - totalParcialesexec;

      const vals: ColorEdgeData = {
        good_quantity: restante > 0 ? restante : 0,
        bad_quantity: restantebad > 0 ? restantebad : 0,
        excess_quantity: restanteexc > 0 ? restanteexc : 0,
        cqm_quantity: cqm_quantity || '',
        comments: colorEdge.comments || '',
      };
      setDefaultValues(vals);
    } else {
      // Caso original: se busca el primer parcial sin validar
      const firstUnvalidatedPartial = partials.find((p: any) => !p.validated);

      const vals: ColorEdgeData = {
        good_quantity: firstUnvalidatedPartial.quantity || '',
        bad_quantity: firstUnvalidatedPartial.bad_quantity || '',
        excess_quantity: firstUnvalidatedPartial.excess_quantity || '',
        cqm_quantity: cqm_quantity || '',
        comments: firstUnvalidatedPartial.observation || '',
      };
      setDefaultValues(vals);
    }
  }, [workOrder]);

  const handleAceptar = async () => {
    if (!sampleAuditory) {
      Alert.alert('Error', 'Por favor, asegurate de ingresar muestras.');
      return;
    }
    const ColorEdgeId = workOrder?.areaResponse?.colorEdge?.id ?? workOrder.id;
    try {
      await acceptWorkOrderFlowColorEdgeAuditory(ColorEdgeId, sampleAuditory);
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

  const currentFlow = workOrder;
  const flowList = [...workOrder.workOrder.flow];
  const currentIndex = flowList.findIndex(
    (item) => item.id === currentFlow?.id
  );
  const previousFlows = flowList
    .slice(0, currentIndex + 1)
    .filter((flow) => flow.area_id !== 1);

  console.log('Áreas anteriores sin Preprensa:', previousFlows);
  const handleOpenBadQuantityModal = () => {
    const initialValues: { [areaName: string]: string } = {};

    previousFlows.forEach((flow) => {
      const areaName = flow.area.name;

      let badQuantity: number | null | undefined = null;
      let materialBadQuantity: number | null | undefined = null;

      // Primero, busca en areaResponse
      if (flow.areaResponse?.impression) {
        badQuantity = flow.areaResponse.impression.bad_quantity;
      } else if (flow.areaResponse?.serigrafia) {
        badQuantity = flow.areaResponse.serigrafia.bad_quantity;
      } else if (flow.areaResponse?.empalme) {
        badQuantity = flow.areaResponse.empalme.bad_quantity;
      } else if (flow.areaResponse?.laminacion) {
        badQuantity = flow.areaResponse.laminacion.bad_quantity;
      } else if (flow.areaResponse?.corte) {
        badQuantity = flow.areaResponse.corte.bad_quantity;
        materialBadQuantity = flow.areaResponse.corte.material_quantity;
      } else if (flow.areaResponse?.colorEdge) {
        badQuantity = flow.areaResponse.colorEdge.bad_quantity;
        materialBadQuantity = flow.areaResponse.colorEdge.material_quantity;
      } else if (flow.areaResponse?.hotStamping) {
        badQuantity = flow.areaResponse.hotStamping.bad_quantity;
        materialBadQuantity = flow.areaResponse.hotStamping.material_quantity;
      } else if (flow.areaResponse?.millingChip) {
        badQuantity = flow.areaResponse.millingChip.bad_quantity;
        materialBadQuantity = flow.areaResponse.millingChip.material_quantity;
      }

      // Si sigue sin valor, busca en partialReleases
      if (
        (badQuantity === null || badQuantity === undefined) &&
        flow.partialReleases?.length > 0
      ) {
        badQuantity = flow.partialReleases.reduce(
          (sum: number, release: any) => {
            return sum + (release.bad_quantity ?? 0);
          },
          0
        );
        materialBadQuantity = flow.partialReleases.reduce(
          (sum: number, release: any) => {
            return sum + (release.material_quantity ?? 0);
          },
          0
        );
      }

      // Guardar valores por separado
      initialValues[`${areaName}_bad`] =
        badQuantity !== null && badQuantity !== undefined
          ? String(badQuantity)
          : '';

      initialValues[`${areaName}_material`] =
        materialBadQuantity !== null && materialBadQuantity !== undefined
          ? String(materialBadQuantity)
          : '';
    });

    setAreaBadQuantities(initialValues);
    setShowBadQuantity(true);
    console.log('Valores iniciales para malas por área:', initialValues);
  };

  const sumaBadQuantity = previousFlows.reduce((sum, flow) => {
    let bad = 0;

    if (flow.areaResponse?.impression) {
      bad = flow.areaResponse.impression.bad_quantity || 0;
    } else if (flow.areaResponse?.serigrafia) {
      bad = flow.areaResponse.serigrafia.bad_quantity || 0;
    } else if (flow.areaResponse?.empalme) {
      bad = flow.areaResponse.empalme.bad_quantity || 0;
    } else if (flow.areaResponse?.laminacion) {
      bad = flow.areaResponse.laminacion.bad_quantity || 0;
    } else if (flow.areaResponse?.corte) {
      const corte = flow.areaResponse.corte;
      const corteBad = corte.bad_quantity || 0;
      const corteMaterial = corte.material_quantity || 0; // ← suma también este
      bad = corteBad + corteMaterial;
    } else if (flow.areaResponse?.colorEdge) {
      const colorEdge = flow.areaResponse.colorEdge;
      const colorEdgeBad = colorEdge.bad_quantity || 0;
      const colorEdgeMaterial = colorEdge.material_quantity || 0; // ← suma también este
      bad = colorEdgeBad + colorEdgeMaterial;
    } else if (flow.areaResponse?.hotStamping) {
      const hotStamping = flow.areaResponse.hotStamping;
      const hotStampingBad = hotStamping.bad_quantity || 0;
      const hotStampingMaterial = hotStamping.material_quantity || 0; // ← suma también este
      bad = hotStampingBad + hotStampingMaterial;
    } else if (flow.areaResponse?.millingChip) {
      const millingChip = flow.areaResponse.millingChip;
      const millingChipBad = millingChip.bad_quantity || 0;
      const millingChipMaterial = millingChip.material_quantity || 0; // ← suma también este
      bad = millingChipBad + millingChipMaterial;
    }

    // Si no hay respuesta y sí hay parciales
    if (bad === 0 && flow.partialReleases?.length > 0) {
      bad = flow.partialReleases.reduce((partialSum: number, release: any) => {
        const badQty = release.bad_quantity ?? 0;
        const materialQty = release.material_quantity ?? 0;
        return partialSum + badQty + materialQty; // ← también suma material aquí
      }, 0);
    }

    return sum + bad;
  }, 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Área: {workOrder.area.name}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>OT:</Text>
        <Text style={styles.value}>{workOrder.workOrder.ot_id}</Text>

        <Text style={styles.label}>Presupuesto:</Text>
        <Text style={styles.value}>{workOrder.workOrder.mycard_id}</Text>

        <Text style={styles.label}>Cantidad:</Text>
        <Text style={styles.value}>{workOrder.workOrder.quantity}</Text>

        <Text style={styles.label}>Área que lo envía:</Text>
        <Text style={styles.value}>
          {workOrder?.area?.name || 'No definida'}
        </Text>

        <Text style={styles.label}>Usuario:</Text>
        <Text style={styles.value}>
          {workOrder?.user?.username || 'No definido'}
        </Text>

        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{workOrder.workOrder.comments}</Text>
      </View>
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
          placeholder={sumaBadQuantity > 0 ? sumaBadQuantity.toString() : '0'}
          value={String(sumaBadQuantity)}
          editable={false} // deshabilita edición
          pointerEvents="none" // evita que se abra el teclado
        />
      </TouchableOpacity>{' '}
      <Text style={styles.subtitle}>Excedente:</Text>
      <TextInput
        style={styles.input}
        editable={false}
        value={String(defaultValues.excess_quantity)}
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
        style={styles.input}
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
        style={styles.inputActive}
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
          onPress={() => setShowConfirm(true)}
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
                const areaKey = flow.area.name.toLowerCase();
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
                          <Text style={styles.inputLabel}>Malo de fábrica</Text>
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
                onPress={handleAceptar}
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

export default ColorEdgeComponentAcceptAuditory;

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
    backgroundColor: '#fff',
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