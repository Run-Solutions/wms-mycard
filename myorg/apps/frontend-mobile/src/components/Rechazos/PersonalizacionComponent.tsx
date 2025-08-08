import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { acceptPersonalizacionInconformityAuditory } from '../../api/rechazos';

interface Props {
  workOrder: any; // toda la OT con .flow
  currentFlow: any; // flujo actual (ej: corte)
}
interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  work_order_flow_id: number;
  inconformities: any[];
}
type InconformityData = {
  quantity: number | string;
  excess: number | string;
  sample: number | string;
  comments: string;
  user: string;
  inconformity: string;
};

const PersonalizacionComponent: React.FC<Props> = ({
  workOrder,
  currentFlow,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [areaName: string]: string;
  }>({});
  const [inconformityValues, setInconformityValues] =
    useState<InconformityData>({
      quantity: '',
      excess: '',
      sample: '',
      comments: '',
      user: '',
      inconformity: '',
    });
  useEffect(() => {
    if (!currentFlow) return;

    const personalizacion = currentFlow.areaResponse?.personalizacion;
    const partials = currentFlow.partialReleases || [];
    console.log('personalizacion:', personalizacion);
    const lastPartialRelease = currentFlow.partialReleases.find(
      (release: PartialRelease) => release.validated
    );
    console.log('Ultima parcialidad validar:', lastPartialRelease);

    const allValidated =
      partials.length > 0 && partials.every((p: any) => p.validated);

    if (personalizacion && partials.length === 0) {
      // Caso sin parciales
      setInconformityValues({
        quantity: personalizacion.good_quantity || '',
        excess: personalizacion.excess_quantity || '',
        sample: personalizacion.formAuditory?.sample_auditory || '',
        comments: personalizacion.comments || '',
        user:
          personalizacion.formAuditory?.inconformities.at(-1)?.user.username ||
          '',
        inconformity:
          personalizacion.formAuditory?.inconformities.at(-1)?.comments || '',
      });
    } else if (personalizacion && allValidated) {
      // Caso con todos parciales validados
      const totalGood = partials.reduce(
        (acc: any, p: any) => acc + (p.quantity || 0),
        0
      );
      const totalExcess = partials.reduce(
        (acc: any, p: any) => acc + (p.excess_quantity || 0),
        0
      );

      setInconformityValues({
        quantity: Math.max((personalizacion.good_quantity || 0) - totalGood, 0),
        excess: Math.max(
          (personalizacion.excess_quantity || 0) - totalExcess,
          0
        ),
        sample: personalizacion.formAuditory?.sample_auditory || '',
        comments: personalizacion.comments || '',
        user:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.user
            .username || '',
        inconformity:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.comments || '',
      });
    } else {
      // Primer parcial no validado
      const firstUnvalidated = partials.find((p: any) => p.validated);

      setInconformityValues({
        quantity: firstUnvalidated?.quantity || '',
        excess: firstUnvalidated?.excess_quantity || '',
        sample: firstUnvalidated?.formAuditory?.sample_auditory || '',
        comments: firstUnvalidated?.observation || '',
        user:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.user
            .username || '',
        inconformity:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.comments || '',
      });
    }
  }, [currentFlow]);

  const handleSubmit = async () => {
    const partialRelease = currentFlow.partialReleases.find(
      (release: PartialRelease) => release.validated
    );
    const areaResponseFlowId = currentFlow.areaResponse
      ? currentFlow.areaResponse.work_order_flow_id
      : partialRelease?.work_order_flow_id;

    console.log(areaResponseFlowId);
    try {
      await acceptPersonalizacionInconformityAuditory(areaResponseFlowId);
      setShowModal(false);
      Alert.alert('Inconformidad aceptada');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error al aceptar', error.message || 'Ocurrió un error');
    } finally {
      setShowModal(false);
    }
  };

  const flowList = [...workOrder.flow];
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
    } else if (flow.areaResponse?.personalizacion) {
      const personalizacion = flow.areaResponse.personalizacion;
      const personalizacionBad = personalizacion.bad_quantity || 0;
      const personalizacionMaterial = personalizacion.material_quantity || 0; // ← suma también este
      bad = personalizacionBad + personalizacionMaterial;
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
    <View>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 230 }]}
      >
        <Text style={styles.title}>Área: Personalización</Text>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Buenas:</Text>
          <TextInput
            style={styles.input}
            editable={false}
            value={String(inconformityValues.quantity)}
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
              value={sumaBadQuantity}
              placeholder={
                sumaBadQuantity > 0 ? sumaBadQuantity.toString() : '0'
              }
              editable={false} // deshabilita edición
              pointerEvents="none" // evita que se abra el teclado
            />
          </TouchableOpacity>
          <Text style={styles.subtitle}>Excedente:</Text>
          <TextInput
            style={styles.input}
            editable={false}
            value={String(inconformityValues.excess)}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
          <Text style={styles.subtitle}>Muestras:</Text>
          <TextInput
            style={styles.input}
            editable={false}
            value={String(inconformityValues.sample)}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.textarea}
            multiline
            editable={false}
            value={inconformityValues.comments}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Inconformidad:</Text>

          <Text style={styles.label}>Respuesta de Usuario</Text>
          <TextInput
            style={styles.input}
            editable={false}
            value={inconformityValues.user}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.textarea}
            multiline
            editable={false}
            value={inconformityValues.inconformity}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={openModal}>
          <Text style={styles.buttonText}>Aceptar Inconformidad</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />

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
                          <View
                            style={[styles.inputGroup, { maxWidth: '40%' }]}
                          >
                            <Text style={styles.inputLabel}>
                              Malo de fábrica
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

        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalText}>
                ¿Estás segura/o que deseas aceptar la inconformidad? Deberás
                liberar nuevamente.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeModal}
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
      </ScrollView>
    </View>
  );
};

export default PersonalizacionComponent;

const styles = StyleSheet.create({
  container: {
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
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    color: '#374151',
  },
  input: {
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
  },
  textarea: {
    padding: 10,
    borderWidth: 1,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 14,
    width: '85%',
  },
  modalText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
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
