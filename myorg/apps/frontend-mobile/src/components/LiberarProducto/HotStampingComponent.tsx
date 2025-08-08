import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  submitToCQMHotStamping,
  releaseProductFromHotStamping,
} from '../../api/liberarProducto';
import { updateWorkOrderAreas } from '../../api/seguimientoDeOts';
import { useAuth } from '../../contexts/AuthContext';
import { calcularCantidadPorLiberar } from './util/calcularCantidadPorLiberar';
import BadQuantityModal from './util/BadQuantityModal';
import { AreaData } from './PersonalizacionComponent';

interface PartialRelease {
  validated: boolean;
  quantity: number;
}
const HotStampingComponent = ({ workOrder }: { workOrder: any }) => {
  console.log('Order', workOrder);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sampleQuantity, setSampleQuantity] = useState('');
  const [goodQuantity, setGoodQuantity] = useState('');
  const [badQuantity, setBadQuantity] = useState('');
  const [excessQuantity, setExcessQuantity] = useState('');
  const [comments, setComments] = useState('');
  const [showCqmModal, setShowCqmModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checkedQuestion, setCheckedQuestion] = useState<number[]>([]);
  const [showQuality, setShowQuality] = useState<boolean>(false);
  const [revisarPosicionChecks, setRevisarPosicionChecks] = useState<string[]>(
    []
  );
  const [imagenHologramaChecks, setImagenHologramaChecks] = useState<string[]>(
    []
  );

  const [revisarPosicion, setRevisarPosicion] = useState<string>(''); // Valor combinado
  const [imagenHolograma, setImagenHolograma] = useState<string>(''); // Valor combinado
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [areaName: string]: string;
  }>({});
  const [materialBadQuantity, setMaterialBadQuantity] = useState<string>('0');
  const [lastAreaBadQuantity, setLastBadQuantity] = useState<string>('0');

  const questions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === null) || [];
  const qualityQuestions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === 3) || [];
  const isDisabled = workOrder.status === 'En proceso';

  const { user } = useAuth();
  const currentUserId = user?.sub;
  const flowList = [...workOrder.workOrder.flow];
  const currentFlow = workOrder.workOrder.flow.find(
    (f: any) =>
      f.area_id === workOrder.area.id &&
      [
        'Pendiente',
        'En proceso',
        'Parcial',
        'Pendiente parcial',
        'Listo',
        'Enviado a CQM',
        'En Calidad',
        'Enviado a auditoria parcial',
      ].includes(f.status) &&
      f.user?.id === currentUserId
  );
  if (!currentFlow) {
    alert('No tienes una orden activa para esta área.');
    return;
  }
  const currentIndex = flowList.findIndex(
    (item) => item.id === currentFlow?.id
  );
  console.log('el currentIndex', currentIndex);
  // Anterior (si hay)
  const lastCompletedOrPartial =
    currentIndex > 0 ? flowList[currentIndex - 1] : null;
  // Siguiente (si hay)
  const nextFlow =
    currentIndex !== -1 && currentIndex < flowList.length - 1
      ? flowList[currentIndex + 1]
      : null;
  console.log('El flujo actual (currentFlow)', currentFlow);
  console.log('El siguiente flujo (nextFlow)', nextFlow);
  console.log('Ultimo parcial o completado', lastCompletedOrPartial);

  const allParcialsValidated = currentFlow.partialReleases?.every(
    (r: PartialRelease) => r.validated
  );

  const enviarACQM = async () => {
    const numValue = Number(sampleQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
      Alert.alert('Cantidad de muestra inválida');
      return;
    }
    const isFrenteVueltaValid =
      checkedQuestion.length > 0 || checkedQuestion.length > 0;
    if (!questions.length || !isFrenteVueltaValid) {
      Alert.alert('Completa todas las preguntas y cantidad de muestra.');
      return;
    }

    const answeredQuestions = questions.filter((q: any) =>
      checkedQuestion.includes(q.id)
    );

    const payload = {
      question_id: answeredQuestions.map((q: any) => q.id),
      work_order_flow_id: currentFlow.id,
      work_order_id: currentFlow.workOrder.id,
      area_id: currentFlow.area.id,
      response: answeredQuestions.map(() => true), // todas las marcadas son true
      reviewed: false,
      user_id: currentFlow.assigned_user,
      sample_quantity: Number(sampleQuantity),
      revisar_posicion: revisarPosicion,
      imagen_holograma: imagenHolograma,
    };

    try {
      await submitToCQMHotStamping(payload);
      Alert.alert('Formulario enviado a CQM');
      navigation.goBack();
      setShowCqmModal(false);
    } catch (err) {
      Alert.alert('Error al Enviar a Calidad/CQM.');
    }
  };

  const liberarProducto = async () => {
    const numValue = Number(goodQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
      Alert.alert('Cantidad de muestra inválida');
      return;
    }
    const payload = {
      workOrderId: workOrder.workOrder.id,
      workOrderFlowId: currentFlow.id,
      areaId: workOrder.area.id,
      assignedUser: currentFlow.assigned_user,
      goodQuantity: Number(goodQuantity),
      badQuantity: Number(lastAreaBadQuantity),
      materialBadQuantity: Number(materialBadQuantity),
      excessQuantity: Number(excessQuantity),
      comments,
      formAnswerId: currentFlow.answers?.[0]?.id,
    };

    try {
      await releaseProductFromHotStamping(payload);
      setShowConfirm(false);
      Alert.alert('Producto liberado correctamente');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error del servidor al liberar.');
    }
  };

  const cantidadEntregadaLabel =
    lastCompletedOrPartial.areaResponse &&
    lastCompletedOrPartial.partialReleases.length === 0
      ? 'Cantidad entregada:'
      : lastCompletedOrPartial.partialReleases?.some(
          (r: PartialRelease) => r.validated
        )
      ? 'Cantidad entregada validada:'
      : 'Cantidad faltante por liberar:';

  const cantidadEntregadaValue =
    lastCompletedOrPartial.areaResponse &&
    lastCompletedOrPartial.partialReleases.length === 0
      ? // Mostrar cantidad según sub-área disponible
        lastCompletedOrPartial.areaResponse.prepress?.plates ??
        lastCompletedOrPartial.areaResponse.impression?.release_quantity ??
        lastCompletedOrPartial.areaResponse.serigrafia?.release_quantity ??
        lastCompletedOrPartial.areaResponse.empalme?.release_quantity ??
        lastCompletedOrPartial.areaResponse.laminacion?.release_quantity ??
        lastCompletedOrPartial.areaResponse.corte?.good_quantity ??
        lastCompletedOrPartial.areaResponse.colorEdge?.good_quantity ??
        lastCompletedOrPartial.areaResponse.hotStamping?.good_quantity ??
        lastCompletedOrPartial.areaResponse.millingChip?.good_quantity ??
        lastCompletedOrPartial.areaResponse.personalizacion?.good_quantity ??
        'Sin cantidad'
      : lastCompletedOrPartial.partialReleases?.some(
          (r: PartialRelease) => r.validated
        )
      ? lastCompletedOrPartial.partialReleases
          .filter((release: PartialRelease) => release.validated)
          .reduce(
            (sum: number, release: PartialRelease) => sum + release.quantity,
            0
          )
      : (lastCompletedOrPartial.workOrder?.quantity ?? 0) -
        (lastCompletedOrPartial.partialReleases?.reduce(
          (sum: number, release: PartialRelease) => sum + release.quantity,
          0
        ) ?? 0);

  const cantidadporliberar = calcularCantidadPorLiberar(
    currentFlow,
    lastCompletedOrPartial
  );
  console.log('Cantidad final por liberar:', cantidadporliberar);

  const previousFlows = flowList
    .slice(0, currentIndex + 1)
    .filter((flow) => flow.area_id !== 1);

  console.log('Áreas anteriores sin Preprensa:', previousFlows);

  const handleOpenBadQuantityModal = () => {
    const initialValues: { [areaName: string]: string } = {
      ...areaBadQuantities,
    };

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
      // ⚠️ SOLO setear si no están ya definidos
      if (initialValues[`${areaName}_bad`] === undefined) {
        initialValues[`${areaName}_bad`] =
          badQuantity !== null && badQuantity !== undefined
            ? String(badQuantity)
            : '';
      }

      if (
        flow.area.id >= 6 &&
        initialValues[`${areaName}_material`] === undefined
      ) {
        initialValues[`${areaName}_material`] =
          materialBadQuantity !== null && materialBadQuantity !== undefined
            ? String(materialBadQuantity)
            : '';
      }
    });

    setAreaBadQuantities(initialValues);
    setShowBadQuantity(true);
    console.log('Valores iniciales para malas por área:', initialValues);
  };
  const normalizedAreas: AreaData[] = previousFlows.map((item) => ({
    id: item.area?.id ?? item.id,
    name: item.area?.name ?? item.name ?? '',
    malas: item.malas ?? 0,
    defectuoso: item.defectuoso ?? 0,

    // Valores ficticios para completar el tipo requerido
    status: item.status ?? '',
    response: item.areaResponse ?? {},
    answers: item.answers ?? [],
    usuario: item.user?.username ?? '',
    auditor: '',
    buenas: 0,
    cqm: 0,
    excedente: 0,
    muestras: 0,
  }));

  const handleSaveChanges = async (updatedAreas: AreaData[]) => {
    const effectiveAreas = updatedAreas ?? previousFlows;
    const payload = {
      areas: previousFlows.flatMap((flow) => {
        const areaKey = flow.area.name.toLowerCase().replace(/\s/g, '');

        const blockMap: Record<string, string> = {
          impresion: 'impression',
          serigrafia: 'serigrafia',
          empalme: 'empalme',
          laminacion: 'laminacion',
          corte: 'corte',
          'color edge': 'colorEdge',
        };

        const block = blockMap[flow.area.name.toLowerCase()] || 'otros';
        if (block === 'otros') {
          return []; // Descarta si no es bloque conocido
        }

        const blockData = flow.areaResponse?.[block];
        const blockId = blockData?.id || null;
        const formId = blockData?.form_auditory_id || null;
        const cqmId = blockData?.form_answer_id || null;

        const badKey = `${areaKey}_bad`;
        const materialKey = `${areaKey}_material`;

        const bad_quantity = Number(areaBadQuantities[badKey] || 0);
        const material_quantity =
          flow.area.id > 6
            ? Number(areaBadQuantities[materialKey] || 0)
            : undefined;

        return {
          areaId: flow.area_id,
          block,
          blockId,
          formId,
          cqmId,
          data: {
            bad_quantity,
            ...(material_quantity !== undefined && { material_quantity }),
          },
        };
      }),
    };

    console.log('Payload a enviar:', payload);

    try {
      await updateWorkOrderAreas(workOrder.workOrder.ot_id, payload);
      alert('Cambios guardados correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios');
    }
  };

  const sumaBadQuantity = useMemo(() => {
    return previousFlows.reduce((sum, flow) => {
      const areaKey = flow.area.name.toLowerCase();

      // Leer del input del usuario
      const userBad = areaBadQuantities[`${areaKey}_bad`];
      const userMaterial = areaBadQuantities[`${areaKey}_material`];

      // Valores numéricos o null
      const bad =
        userBad !== undefined && userBad !== '' ? Number(userBad) : null;

      const material =
        userMaterial !== undefined && userMaterial !== ''
          ? Number(userMaterial)
          : null;

      // Si hay valores del usuario, usarlos
      if (bad !== null || material !== null) {
        const safeBad = bad ?? 0;
        const safeMaterial = flow.area.id >= 6 ? material ?? 0 : 0;
        return sum + safeBad + safeMaterial;
      }

      // Si no hay input del usuario, usar partialReleases como fallback
      if (flow.partialReleases?.length > 0) {
        const fallbackBad = flow.partialReleases.reduce(
          (acc: any, release: any) => {
            const badQty = release.bad_quantity ?? 0;
            const materialQty =
              flow.area.id >= 6 ? release.material_quantity ?? 0 : 0;
            return acc + badQty + materialQty;
          },
          0
        );

        return sum + fallbackBad;
      }

      // Si no hay nada, suma 0
      return sum;
    }, 0);
  }, [areaBadQuantities, previousFlows]);
  const shouldDisableLiberar = () => {
    const currentInvalidStatuses = [
      'Enviado a CQM',
      'En Calidad',
      'Parcial',
      'Enviado a auditoria parcial',
      'Pendiente',
      'Pendiente parcial',
      'En proceso',
    ];
    const nextInvalidStatuses = [
      'Enviado a CQM',
      'Listo',
      'En Calidad',
      'Enviado a auditoria parcial',
      'Pendiente',
      'Parcial',
      'Pendiente parcial',
      'En inconformidad CQM',
    ];
    const nextCorteStatuses = ['Enviado a auditoria parcial'];

    const isCurrentInvalid = currentInvalidStatuses.includes(
      currentFlow.status?.trim()
    );
    const isNextInvalid = nextInvalidStatuses.includes(
      nextFlow?.status?.trim()
    );
    const afterCorte =
      nextCorteStatuses.includes(currentFlow?.status?.trim()) &&
      nextFlow?.area?.id >= 6;
    const isNextInvalidAndNotValidated =
      nextInvalidStatuses.includes(nextFlow?.status?.trim()) &&
      !allParcialsValidated;

    return (
      isDisabled ||
      isCurrentInvalid ||
      afterCorte ||
      isNextInvalidAndNotValidated ||
      isNextInvalid
    );
  };
  const shouldDisableCQM = () => {
    const estadosBloqueadosBase = [
      'Enviado a CQM',
      'En Calidad',
      'Listo',
      'Pendiente',
      'Pendiente parcial',
      'Enviado a auditoria parcial',
      'En inconformidad CQM',
      'Enviado a Auditoria',
    ];
    const estadosBloqueadosExtra = [
      'Listo',
      'Enviado a auditoria parcial',
      'Enviado a Auditoria',
    ];
    const statusesToCheck = [
      currentFlow.status,
      nextFlow?.status,
      lastCompletedOrPartial.status,
    ];
    const matchBloqueadosBase = statusesToCheck.some((status) =>
      estadosBloqueadosBase.includes(status)
    );
    const matchBloqueadosExtra = statusesToCheck.some((status) =>
      estadosBloqueadosExtra.includes(status)
    );
    const algunoBloqueado = workOrder.workOrder.flow.some((flow: any) =>
      estadosBloqueadosBase.includes(flow.status)
    );
    return (
      matchBloqueadosBase ||
      matchBloqueadosExtra ||
      algunoBloqueado ||
      Number(cantidadporliberar) === 0
    );
  };
  const disableLiberarButton = shouldDisableLiberar();
  const disableLiberarCQM = shouldDisableCQM();
  const isListo = workOrder.status === 'Listo';

  const toggleCheckbox = (
    id: number,
    target: number[],
    setter: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    setter(
      target.includes(id) ? target.filter((i) => i !== id) : [...target, id]
    );
  };

  const handleRevisarPosicionChange = (value: string) => {
    setRevisarPosicionChecks((prev) => {
      const newValues = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];

      const finalValue =
        newValues.length === 2 ? 'hologramafoil' : newValues[0] || '';
      setRevisarPosicion(finalValue);
      return newValues;
    });
  };

  const handleImagenHologramaChange = (value: string) => {
    setImagenHologramaChecks((prev) => {
      const newValues = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];

      const finalValue =
        newValues.length === 2 ? 'hologramafoil' : newValues[0] || '';
      setImagenHolograma(finalValue);
      return newValues;
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área: Hot Stamping</Text>

      <View style={styles.cardDetail}>
        <Text style={styles.labelDetail}>
          Área que lo envía:
          <Text style={styles.valueDetail}>
            {' '}
            {lastCompletedOrPartial.area.name}
          </Text>
        </Text>
        <Text style={styles.labelDetail}>
          Usuario del área previa:{' '}
          <Text style={styles.valueDetail}>
            {lastCompletedOrPartial.user.username}
          </Text>
        </Text>
        <Text style={styles.labelDetail}>
          {cantidadEntregadaLabel}
          <Text style={styles.valueDetail}> {cantidadEntregadaValue}</Text>
        </Text>

        {workOrder?.partialReleases?.length > 0 && (
          <Text style={styles.labelDetail}>
            Cantidad por Liberar:
            <Text style={styles.valueDetail}> {cantidadporliberar}</Text>
          </Text>
        )}
      </View>

      <Text style={styles.label}>Cantidad a liberar</Text>
      <Text style={styles.label}>Buenas:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 100"
        value={goodQuantity}
        onChangeText={setGoodQuantity}
      />
      <Text style={styles.label}>Malas:</Text>
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
          value={sumaBadQuantity}
          editable={false} // deshabilita edición
          pointerEvents="none" // evita que se abra el teclado
        />
      </TouchableOpacity>
      <Text style={styles.label}>Excedente:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 100"
        value={excessQuantity}
        onChangeText={setExcessQuantity}
      />

      <Text style={styles.label}>Comentarios:</Text>
      <TextInput
        style={styles.textarea}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        multiline
        placeholder="Agrega comentarios..."
        value={comments}
        onChangeText={setComments}
      />

      <TouchableOpacity
        style={[
          styles.button,
          disableLiberarCQM && styles.disabledButton,
          isListo && styles.greenDisabledButton,
        ]}
        onPress={() => !disableLiberarCQM && setShowCqmModal(true)}
        disabled={disableLiberarCQM}
      >
        <Text style={styles.buttonText}>Enviar a Calidad/CQM</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.buttonSecondary,
          disableLiberarButton && styles.disabledButton,
        ]}
        onPress={() => !disableLiberarButton && setShowConfirm(true)}
        disabled={disableLiberarButton}
      >
        <Text style={styles.buttonText}>Liberar Producto</Text>
      </TouchableOpacity>

      <View style={{ marginBottom: 60 }}></View>

      {/* Modal para marcar malas por areas previas al liberar */}
      <BadQuantityModal
        visible={showBadQuantity}
        areas={normalizedAreas}
        areaBadQuantities={areaBadQuantities}
        setAreaBadQuantities={setAreaBadQuantities}
        onConfirm={({
          updatedAreas,
          totalBad,
          totalMaterial,
          lastAreaBad,
          lastAreaMaterial,
        }) => {
          setShowBadQuantity(false);

          // Guarda lo necesario
          handleSaveChanges(updatedAreas);

          // Actualiza variables como antes
          setBadQuantity(String(totalBad));
          setMaterialBadQuantity(String(totalMaterial));
          setLastBadQuantity(String(lastAreaBad));
        }}
        onClose={() => setShowBadQuantity(false)}
      />

      {/* Modal CQM */}
      <Modal visible={showCqmModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#fdfaf6' }}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalTitle}>
              Preguntas del Área: {workOrder.area.name}
            </Text>

            {/* Encabezado estilo tabla */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
              <Text style={styles.tableCell}>Respuesta</Text>
            </View>

            {/* Preguntas normales */}
            {questions.map((q: any) => (
              <View key={q.id} style={styles.tableRow}>
                {/* Pregunta */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.questionText}>{q.title}</Text>
                </View>

                {/* Respuesta */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <TouchableOpacity
                    onPress={() =>
                      toggleCheckbox(q.id, checkedQuestion, setCheckedQuestion)
                    }
                    style={styles.radioCircle}
                  >
                    {checkedQuestion.includes(q.id) && (
                      <View style={styles.radioDot} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Revisar Posición Vs Ot:</Text>
              <View style={styles.radioGroup}>
                {['holograma', 'foil'].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={styles.radioOption}
                    onPress={() => handleRevisarPosicionChange(value)}
                  >
                    <View style={styles.checkbox}>
                      {revisarPosicionChecks.includes(value) && (
                        <View style={styles.checkboxChecked} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Imagen de Holograma Vs Ot:</Text>
              <View style={styles.radioGroup}>
                {['holograma', 'foil'].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={styles.radioOption}
                    onPress={() => handleImagenHologramaChange(value)}
                  >
                    <View style={styles.checkbox}>
                      {imagenHologramaChecks.includes(value) && (
                        <View style={styles.checkboxChecked} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Muestras */}
            <Text style={styles.label}>Muestras:</Text>
            <TextInput
              style={styles.input}
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              keyboardType="numeric"
              placeholder="Ej: 2"
              value={sampleQuantity}
              onChangeText={(text) => {
                const numericOnly = text.replace(/[^0-9]/g, '');
                setSampleQuantity(numericOnly);
              }}
            />

            {/* Sección expandible de calidad */}
            <TouchableOpacity
              onPress={() => setShowQuality((prev) => !prev)}
              style={styles.toggleSection}
            >
              <Text style={styles.subtitle}>
                Preguntas de Calidad {showQuality ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showQuality && (
              <>
                {qualityQuestions.map((q: any) => (
                  <View key={q.id} style={styles.qualityRow}>
                    <Text style={styles.qualityQuestion}>{q.title}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Botones */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCqmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={enviarACQM}
              >
                <Text style={styles.modalButtonText}>Enviar Respuestas</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal confirmación de liberación */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>¿Deseas liberar este producto?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={liberarProducto}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default HotStampingComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 2,
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
    marginBottom: 12,
  },
  label: { fontWeight: '600', marginTop: 12, fontSize: 16, marginBottom: 8 },
  labelDetail: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: { marginBottom: 8 },
  valueDetail: {
    fontWeight: 'normal',
    fontSize: 16,
  },
  input: {
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    minHeight: 30,
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
  cardDetail: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 'auto',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  buttonSecondary: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    padding: 20,
    paddingTop: 80, // mejor control que marginTop
  },
  questionText: {
    fontSize: 15,
    color: '#1f2937',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    width: '80%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  modalButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    marginTop: 60,
    backgroundColor: '#fdfaf6',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  questionGroup: {
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkedBox: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  checkboxText: {
    fontSize: 14,
    color: '#111827',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF', // gris como en web
    opacity: 0.7,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  checkboxBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  toggleSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  qualityRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  qualityQuestion: {
    fontSize: 14,
    color: '#374151',
  },
  radioDisabled: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  greenDisabledButton: {
    backgroundColor: '#4CAF50',
    opacity: 1,
  },
  inputGroup: {
    width: '100%',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 9,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 4,
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
  checkboxChecked: {
    width: 12,
    height: 12,
    backgroundColor: '#000',
  },
});
