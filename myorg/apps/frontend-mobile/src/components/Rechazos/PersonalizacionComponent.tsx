import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { InconformityData } from './CorteComponent';
import BadQuantityModal from '../AceptarAuditoria/util/BadQuantityModal';
import {
  blockSupportsMaterial,
  resolveBlockKey,
} from '../LiberarProducto/util/areaMappings';
import { normalizeAreaKey } from '../LiberarProducto/util/areaMappings';
import type { AreaForBadQty } from '../LiberarProducto/util/BadQuantityModal';

interface Props {
  workOrder: any;
  currentFlow: any;
}
interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  work_order_flow_id: number;
  inconformities: any[];
}
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
      noprocess: '',
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
    const lastPartialRelease = currentFlow.partialReleases
      .filter((r: PartialRelease) => r.validated)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

    console.log('Ultima parcialidad validar:', lastPartialRelease);

    const allValidated =
      partials.length > 0 && partials.every((p: any) => p.validated);

    if (personalizacion && partials.length === 0) {
      // Caso sin parciales
      setInconformityValues({
        quantity: personalizacion.good_quantity || '',
        excess: personalizacion.excess_quantity || '',
        noprocess: personalizacion.noprocess_quantity || '',
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
      const totalNoProcess = partials.reduce(
        (acc: any, p: any) => acc + (p.noprocess_quantity || 0),
        0
      );

      setInconformityValues({
        quantity: Math.max((personalizacion.good_quantity || 0) - totalGood, 0),
        excess: Math.max(
          (personalizacion.excess_quantity || 0) - totalExcess,
          0
        ),
        noprocess: Math.max(
          (personalizacion.noprocess_quantity || 0) - totalNoProcess,
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
      const firstUnvalidated = partials
        .filter((r: PartialRelease) => r.validated)
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

      setInconformityValues({
        quantity: firstUnvalidated?.quantity || '',
        excess: firstUnvalidated?.excess_quantity || '',
        noprocess: firstUnvalidated?.noprocess_quantity || '',
        sample: firstUnvalidated?.formAuditory?.sample_auditory || '',
        comments: firstUnvalidated?.observation || '',
        user:
          firstUnvalidated.formAuditory.inconformities.at(-1)?.user.username ||
          '',
        inconformity:
          firstUnvalidated.formAuditory.inconformities.at(-1)?.comments || '',
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

  // 1) No recrees flowList en cada render
  const flowList = useMemo(() => workOrder?.flow ?? [], [workOrder?.flow]);

  // 2) Memoiza previousFlows basado en refs estables
  const currentIndex = useMemo(
    () => flowList.findIndex((item: any) => item.id === currentFlow?.id),
    [flowList, currentFlow?.id]
  );

  const previousFlows = useMemo(
    () =>
      flowList
        .slice(0, currentIndex + 1)
        .filter((flow: any) => flow.area_id !== 1),
    [flowList, currentIndex]
  );

  // 3) Arregla las deps y evita setState si no cambió
  const computeInitialBadQuantities = useCallback(() => {
    const initialValues: Record<string, string> = {};
    const makeAreaKey = (name?: string) =>
      (name ?? '').toLowerCase().replace(/\s/g, '');

    previousFlows.forEach((flow: any) => {
      (flow?.badQuantityDetails ?? []).forEach((detail: any) => {
        const currentAreaId = currentFlow?.area_id ?? currentFlow?.area?.id;
        if (detail?.source_area_id === currentAreaId) {
          const areaName = makeAreaKey(detail?.targetArea?.name);
          initialValues[`${areaName}_bad`] = detail?.bad_quantity
            ? String(detail.bad_quantity)
            : '0';
          initialValues[`${areaName}_material`] = detail?.material_quantity
            ? String(detail.material_quantity)
            : '0';
        }
      });
    });

    return initialValues;
  }, [previousFlows, currentFlow?.area_id, currentFlow?.area?.id]);

  // 4) Solo setear si realmente cambió (comparación simple por string)
  useEffect(() => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities((prev) => {
        const same = JSON.stringify(prev) === JSON.stringify(initial); // barato y suficiente aquí
        return same ? prev : initial;
      });
    }
  }, [computeInitialBadQuantities]);

  // 5) Y lo mismo al abrir el modal
  const handleOpenBadQuantityModal = () => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities((prev) => {
        const same = JSON.stringify(prev) === JSON.stringify(initial);
        return same ? prev : initial;
      });
    }
    setShowBadQuantity(true);
  };

  const normalizedAreas: AreaForBadQty[] = useMemo(
    () =>
      previousFlows.map((item: any) => ({
        supportsMaterial: blockSupportsMaterial(
          resolveBlockKey(item.area?.name ?? '')
        ),
        id: item.area?.id ?? item.id,
        name: item.area?.name ?? item.name ?? '',
        malas: item.malas ?? 0,
        defectuoso: item.defectuoso ?? 0,
        status: item.status ?? '',
        response: item.areaResponse ?? {},
        answers: item.answers ?? [],
        usuario: item.user?.username ?? '',
        auditor: '',
        buenas: 0,
        cqm: 0,
        excedente: 0,
        muestras: 0,
      })),
    [previousFlows]
  );

  const sumaBadQuantity = useMemo(() => {
    if (!Array.isArray(normalizedAreas) || normalizedAreas.length === 0)
      return 0;

    return normalizedAreas.reduce((acc, area) => {
      const key = normalizeAreaKey(area.name);
      const bad = Number(areaBadQuantities[`${key}_bad`] ?? 0);
      const mat = area.supportsMaterial
        ? Number(areaBadQuantities[`${key}_material`] ?? 0)
        : 0;
      return acc + bad + mat;
    }, 0);
  }, [normalizedAreas, areaBadQuantities]);

  return (
    <View style={{ paddingBottom: 16 }}>
      <View style={styles.container /* sin marginBottom gigante */}>
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
              value={String(sumaBadQuantity)} // ✅ siempre string
              placeholder={
                sumaBadQuantity > 0 ? sumaBadQuantity.toString() : '0'
              }
              editable={false} // deshabilita edición
              pointerEvents="none" // evita que se abra el teclado
            />
          </TouchableOpacity>
          <Text style={styles.subtitle}>Sin procesar:</Text>
          <TextInput
            style={styles.input}
            editable={false}
            value={String(inconformityValues.noprocess)}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
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
        {showBadQuantity && (
          <BadQuantityModal
            visible={true}
            areas={normalizedAreas}
            areaBadQuantities={areaBadQuantities}
            setAreaBadQuantities={setAreaBadQuantities}
            onClose={() => setShowBadQuantity(false)}
          />
        )}
        
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
      </View>
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
    backgroundColor: '#fff',
    padding: 10,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    elevation: 3,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
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
});
