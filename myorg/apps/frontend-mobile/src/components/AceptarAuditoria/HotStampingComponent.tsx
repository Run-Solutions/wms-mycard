// myorg/apps/frontend-mobile/src/components/AceptarAuditoria/HotStampingComponent.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  acceptWorkOrderFlowHotStampingAuditory,
  registrarInconformidadAuditory,
} from '../../api/aceptarAuditoria';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { TextInput } from 'react-native-paper';
import { AfterCorteData } from './CorteComponents';
import {
  buildDefaultValuesByArea,
  AreaBlock,
  DefaultValues,
  toNum,
} from './util/quantityWorkOrder';
import { getPrevAreaGoodPlusExcess } from './util/lastWorkOrder';
import BadQuantityModal, { AreaForBadQty } from './util/BadQuantityModal';
import { AreaData } from '../LiberarProducto/PersonalizacionComponent';
import {
  blockSupportsMaterial,
  normalizeAreaKey,
  resolveBlockKey,
} from '../LiberarProducto/util/areaMappings';
import { calcularCantidadPorLiberarYParcial } from './util/calcularCantidadPorLiberar';

const HotStampingComponentAcceptAuditory: React.FC<{ workOrder: any }> = ({
  workOrder,
}) => {
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

  const flowList = useMemo(
    () => [...(workOrder?.workOrder?.flow ?? [])],
    [workOrder]
  );

  const currentIndex = useMemo(
    () => flowList.findIndex((item) => item?.id === workOrder?.id),
    [flowList, workOrder?.id]
  );

  const previousFlows = useMemo(
    () =>
      flowList.slice(0, currentIndex + 1).filter((flow) => flow.area_id !== 1),
    [flowList, currentIndex]
  );

  const areaKeyActual = useMemo(() => {
    const n = workOrder?.area?.name ?? '';
    return n.toLowerCase().replace(/\s/g, '');
  }, [workOrder?.area?.name]);

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
  const sumaBadQuantity = useMemo(() => {
    if (!Array.isArray(normalizedAreas) || normalizedAreas.length === 0)
      return 0;

    return normalizedAreas.reduce((acc, area: any) => {
      const key = normalizeAreaKey(area.name);
      const bad = Number(areaBadQuantities[`${key}_bad`] ?? 0);
      const mat = area.supportsMaterial
        ? Number(areaBadQuantities[`${key}_material`] ?? 0)
        : 0;
      return acc + bad + mat;
    }, 0);
  }, [normalizedAreas, areaBadQuantities]);

  const areaKey: AreaBlock = 'hotStamping';

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

  const computeInitialBadQuantities = useCallback(() => {
    const makeAreaKey = (name?: string) =>
      (name ?? '').toLowerCase().replace(/\s/g, '');
    const initialValues: Record<string, string> = {};
  
    const currentPartial = workOrder?.partialReleases?.find((p: any) => !p.validated);
  
    const selectedPartial =
      currentPartial ||
      [...(workOrder?.partialReleases ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
  
    console.log("🧩 Parcial activo:", currentPartial?.id ?? "N/A");
    console.log("🧩 Parcial seleccionado:", selectedPartial?.id ?? "N/A");
  
    const currentBadDetails = workOrder?.badQuantityDetails ?? [];
    console.log("📦 Total de badQuantityDetails:", currentBadDetails.length);
  
    currentBadDetails.forEach((d: any) => {
      console.log(
        `🧾 Detail ID ${d.id} | Área: ${d.targetArea?.name} | Parcial: ${d.partial_release_id ?? 'null'} | Malas: ${d.bad_quantity}`
      );
    });
  
    // 🧠 Determinar modo: parcial o liberación total
    const isFullRelease =
      !workOrder?.partialReleases?.length ||
      workOrder?.partialReleases?.every((p: any) => p.validated);
  
    let detailsForSelected: any[] = [];
  
    if (isFullRelease) {
      console.log("🚀 Modo: Liberación total → usando partial_release_id === null");
      detailsForSelected = currentBadDetails.filter((d: any) => d.partial_release_id == null);
    } else {
      console.log("📦 Modo: Parcial → usando parcial", selectedPartial?.id);
      detailsForSelected = currentBadDetails.filter(
        (d: any) => d.partial_release_id === selectedPartial?.id
      );
    }
  
    console.log("🎯 Detalles del parcial o liberación:", detailsForSelected.length);
    detailsForSelected.forEach((d: any) => {
      console.log(
        `➡️ Usado: ${d.targetArea?.name} (malas ${d.bad_quantity}, material ${d.material_quantity})`
      );
    });
  
    const allAreas = Array.from(
      new Set(currentBadDetails.map((d: any) => makeAreaKey(d?.targetArea?.name ?? '')))
    );
  
    console.log("🌎 Áreas detectadas:", allAreas);
  
    allAreas.forEach((areaKey) => {
      initialValues[`${areaKey}_bad`] = '0';
      initialValues[`${areaKey}_material`] = '0';
    });
  
    detailsForSelected.forEach((detail: any) => {
      const areaName = makeAreaKey(detail?.targetArea?.name);
      initialValues[`${areaName}_bad`] = String(detail?.bad_quantity ?? 0);
      initialValues[`${areaName}_material`] = String(detail?.material_quantity ?? 0);
    });
  
    console.log("🧮 Valores finales calculados:", initialValues);
    return initialValues;
  }, [workOrder]);

  // 2) Precarga al montar / cambiar workOrder
  useEffect(() => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities(initial);
    }
  }, [computeInitialBadQuantities]);

  const lastCompletedOrPartial = useMemo(
    () => (currentIndex > 0 ? flowList[currentIndex - 1] : null),
    [flowList, currentIndex]
  );

  const { cantidadPorLiberar, lastValidatedPartial } = useMemo(
    () => calcularCantidadPorLiberarYParcial(workOrder, lastCompletedOrPartial),
    [workOrder, lastCompletedOrPartial]
  );
  console.log('Cantidad por liberar', cantidadPorLiberar);
  console.log('Cantidad total', defaultValues.total_quantity);

  const handleOpenModal = async () => {
    const partialsActual = workOrder?.partialReleases ?? [];

    if (!sampleAuditory) {
      alert('Por favor, asegurate de ingresar muestras.');
      return;
    } else if (
      (defaultValues.total_quantity ?? 0) + Number(sampleAuditory) !==
        prevAreaSum &&
      workOrder?.areaResponse?.hotStamping &&
      partialsActual.length === 0
    ) {
      alert(
        `La cantidad total a liberar ${
          (defaultValues.total_quantity ?? 0) + Number(sampleAuditory)
        } es mayor a la entregada por parte del área previa ${
          defaultValues.total_quantity
        }.`
      );
      return;
    } else if (
      partialsActual.length > 0 &&
      lastValidatedPartial !== null &&
      Number(defaultValues.total_quantity ?? 0) + Number(sampleAuditory) !==
        cantidadPorLiberar
    ) {
      alert(
        `La cantidad total a liberar ${
          (defaultValues.total_quantity ?? 0) + Number(sampleAuditory)
        } es diferente a la entregada por parte del la parcialidad previa ${cantidadPorLiberar}.`
      );
      return;
    } else if (
      partialsActual.length > 0 &&
      lastValidatedPartial === null &&
      Number(defaultValues.total_quantity ?? 0) + Number(sampleAuditory) !==
        prevAreaSum
    ) {
      alert(
        `La cantidad total a liberar ${
          (defaultValues.total_quantity ?? 0) + Number(sampleAuditory)
        } es mayor a la entregada por parte del área previa ${
          prevAreaSum
        }.`
      );
      return;
    }
    setShowConfirm(true);
  };

  const prevAreaSum = useMemo(
    () => getPrevAreaGoodPlusExcess(workOrder),
    [workOrder]
  );
  console.log('prevAreaSum', prevAreaSum);

  const handleSubmit = async () => {
    const HotStampingId =
      workOrder?.areaResponse?.hotStamping?.id ?? workOrder.id;
    try {
      await acceptWorkOrderFlowHotStampingAuditory(
        HotStampingId,
        sampleAuditory
      );
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

  const handleOpenBadQuantityModal = () => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities(initial);
    }
    setShowBadQuantity(true);
  };

  console.log(defaultValues.total_quantity);

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
        <TouchableOpacity style={styles.acceptButton} onPress={handleOpenModal}>
          <Text style={styles.buttonText}>Aceptar recepción de producto</Text>
        </TouchableOpacity>
      </View>
      {/* Modal para marcar malas por areas previas al liberar */}
      <BadQuantityModal
        visible={showBadQuantity}
        areas={normalizedAreas}
        areaBadQuantities={areaBadQuantities}
        setAreaBadQuantities={setAreaBadQuantities}
        onClose={() => setShowBadQuantity(false)}
      />
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

export default HotStampingComponentAcceptAuditory;

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
