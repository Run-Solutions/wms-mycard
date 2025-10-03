import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { acceptCorteInconformity } from '../../api/inconformidades';
import {
  blockSupportsMaterial,
  resolveBlockKey,
} from '../LiberarProducto/util/areaMappings';
import type { AreaForBadQty } from '../LiberarProducto/util/BadQuantityModal';
import { normalizeAreaKey } from '../LiberarProducto/util/areaMappings';
import { AfterCorteData } from '../AceptarAuditoria/CorteComponents';
import {
  buildDefaultValuesByArea,
  DefaultValues,
  AreaBlock,
  toNum,
} from '../AceptarAuditoria/util/quantityWorkOrder';
import BadQuantityModal from '../AceptarAuditoria/util/BadQuantityModal';

interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  work_order_flow_id: number;
  inconformities: any[];
}

const CorteComponent: React.FC<{ workOrder: any }> = ({ workOrder }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showModal, setShowModal] = useState(false);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<
    Record<string, string>
  >({});
  const [defaultValues, setDefaultValues] = useState<AfterCorteData>({
    good_quantity: '',
    bad_quantity: '',
    excess_quantity: '',
    noprocess_quantity: '',
    cqm_quantity: '',
    comments: '',
    total_quantity: 0,
    total_execbuen: 0,
  });

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

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

  // Obtener la última parcialidad sin validar
  const lastPartialRelease = workOrder.partialReleases.find(
    (release: PartialRelease) => !release.validated
  );
  const flowList = useMemo(
    () => [...(workOrder?.workOrder?.flow ?? [])],
    [workOrder]
  );

  const currentIndex = useMemo(
    () => flowList.findIndex((item) => item?.id === workOrder?.id),
    [flowList, workOrder?.id]
  );
  console.log('flow', currentIndex);

  const previousFlows = useMemo(
    () =>
      flowList.slice(0, currentIndex + 1).filter((flow) => flow.area_id !== 1),
    [flowList, currentIndex]
  );

  const normalizedAreas: AreaForBadQty[] = useMemo(
    () =>
      previousFlows.map((item) => ({
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
  console.log(defaultValues.total_quantity);

  const areaKey: AreaBlock = 'corte';

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

  useEffect(() => {
    const result = buildDefaultValuesByArea(
      areaKey,
      workOrder,
      sumaBadQuantity,
      {
        // filterPartialsByArea: (p) => p.area === areaKey
      }
    );

    if (result) {
      setDefaultValues((prev) => toAfterCorteData(result, prev)); //
    }
  }, [workOrder, sumaBadQuantity]);

  const inconformityList = lastPartialRelease
    ? lastPartialRelease.inconformities
    : workOrder.areaResponse?.inconformities || [];

  const lastUnreviewedInconformity = [...inconformityList]
    .reverse()
    .find((i) => i.reviewed === false);

  const inconformityUser = lastUnreviewedInconformity?.user.username;
  const inconformityComments = lastUnreviewedInconformity?.comments;
  const computeInitialBadQuantities = useCallback(() => {
    const initialValues: Record<string, string> = {};
    const makeAreaKey = (name?: string) =>
      (name ?? '').toLowerCase().replace(/\s/g, '');

    previousFlows.forEach((flow) => {
      (flow?.badQuantityDetails ?? []).forEach((detail: any) => {
        // OJO: usa siempre el mismo campo para el área actual (consistencia)
        // Si tu objeto tiene area_id, úsalo; si no, usa workOrder?.area?.id
        const currentAreaId = workOrder?.area_id ?? workOrder?.area?.id;
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
  }, [previousFlows, workOrder?.area_id, workOrder?.area?.id]);

  useEffect(() => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities(initial);
    }
  }, [computeInitialBadQuantities]);

  const handleOpenBadQuantityModal = () => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities(initial);
    }
    setShowBadQuantity(true);
  };

  const handleSubmit = async () => {
    const partialRelease = workOrder.partialReleases.find(
      (release: PartialRelease) => !release.validated
    );
    const areaResponseFlowId = workOrder.areaResponse
      ? workOrder.areaResponse.work_order_flow_id
      : partialRelease?.work_order_flow_id;

    console.log(areaResponseFlowId);
    try {
      await acceptCorteInconformity(areaResponseFlowId);
      setShowModal(false);
      Alert.alert('Inconformidad aceptada');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error al aceptar', error.message || 'Ocurrió un error');
    } finally {
      setShowModal(false);
    }
  };

  return (
    <View>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 230 }]}
      >
        <Text style={styles.title}>Área: Corte</Text>

        <View style={styles.card}>
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
          <Text style={styles.subtitle}>Sin procesar:</Text>
          <TextInput
            style={styles.input}
            editable={false}
            value={String(defaultValues.excess_quantity)}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
          <Text style={styles.subtitle}>Excedente:</Text>
          <TextInput
            style={styles.input}
            editable={false}
            value={String(defaultValues.noprocess_quantity)}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.textarea}
            multiline
            editable={false}
            value={defaultValues.comments}
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
            value={inconformityUser}
          />

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.textarea}
            multiline
            editable={false}
            value={inconformityComments}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={openModal}>
          <Text style={styles.buttonText}>Aceptar Inconformidad</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
        <BadQuantityModal
          visible={showBadQuantity}
          areas={normalizedAreas}
          areaBadQuantities={areaBadQuantities}
          setAreaBadQuantities={setAreaBadQuantities}
          onClose={() => setShowBadQuantity(false)}
        />
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

export default CorteComponent;

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
    height: 30,
    fontSize: 16,
  },
  textarea: {
    padding: 10,
    marginBottom: 12,
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
});
