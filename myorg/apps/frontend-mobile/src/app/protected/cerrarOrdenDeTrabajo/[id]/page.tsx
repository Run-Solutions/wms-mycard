// myorg/apps/frontend-mobile/src/app/protected/cerrarOrdenDeTrabajo/[id]/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { InternalStackParamList } from '../../../../navigation/types';
import {
  liberarWorkOrderAuditory,
  fetchWorkOrderById,
  cerrarParcialWorkOrderAuditory,
} from '../../../../api/cerrarOrdenDeTrabajo';
import { getFileByName } from '../../../../api/finalizacion';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import FileViewer from 'react-native-file-viewer';
import InfoCard from '../../../../components/SeguimientoDeOts/InfoCard';
import PartialHistory from '../../../../components/SeguimientoDeOts/PartialHistory';

type WorkOrderDetailRouteProp = RouteProp<
  InternalStackParamList,
  'CerrarOrdenDeTrabajoAuxScreen'
>;

type AreaTotals = {
  buenas: number;
  malas: number;
  excedente: number;
  cqm: number;
  muestras: number;
};
type AreaData = {
  id: number;
  name: string;
  status: string;
  response: {
    user: {
      username: string;
    };
  };
  answers: any;
  usuario: string;
  auditor: string;
  buenas: number;
  malas: number;
  cqm: number;
  excedente: number;
  muestras: number;
  parciales: number;
  parcialesValidados: number;
  partials: Array<{
    id: number;
    quantity: number;
    bad_quantity: number;
    excess_quantity: number;
    noprocess_quantity?: number;
    material_quantity?: number;
    release_quantity?: number;
    validated?: boolean;
    user?: { username: string } | null;
    formAuditory?: { user?: { username?: string | null } | null } | null;
    created_at?: string;
  }>;
};

const CerrarOrdenDeTrabajoAuxScreen: React.FC = () => {
  const route = useRoute<WorkOrderDetailRouteProp>();
  const { id } = route.params;
  const navigation = useNavigation();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [qtyToClient, setQtyToClient] = useState<string>('');
  const [qtyError, setQtyError] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchWorkOrderById(id);
      setWorkOrder(data);
    } catch (error) {
      console.error('Error al obtener la orden:', error);
      Alert.alert('Error', 'No se pudo cargar la orden de trabajo.');
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Función para obtener los datos específicos de cada área
  const getAreaData = (
    areaId: number,
    areaResponse: any,
    partialReleases: any[] = [],
    flowUser: any = null,
    index: number = -1
  ) => {
    const sumFromPartials = () => {
      return partialReleases.reduce(
        (acc: any, curr: any) => {
          acc.buenas += curr.quantity || 0;
          acc.malas += curr.bad_quantity || 0;
          acc.excedente += curr.excess_quantity || 0;
          return acc;
        },
        { buenas: 0, malas: 0, excedente: 0 }
      );
    };

    const getCommonData = (areaKey: string) => {
      const hasResponse = !!areaResponse?.[areaKey];
      const usuario = areaResponse?.user?.username || flowUser?.username || '';
      const auditor =
        areaResponse?.[areaKey]?.formAuditory?.user?.username || '';

      if (!hasResponse && partialReleases.length > 0) {
        const resumen = sumFromPartials();
        console.log('[PARCIAL DETECTADO]', areaKey, resumen);
        return { ...resumen, cqm: 0, muestras: 0, usuario, auditor: '' };
      }

      return {
        buenas:
          areaResponse?.[areaKey]?.good_quantity ||
          areaResponse?.[areaKey]?.release_quantity ||
          areaResponse?.[areaKey]?.plates ||
          0,
        malas: areaResponse?.[areaKey]?.bad_quantity || 0,
        excedente: areaResponse?.[areaKey]?.excess_quantity || 0,
        cqm: areaResponse?.[areaKey]?.form_answer?.sample_quantity ?? 0,
        muestras: areaResponse?.[areaKey]?.formAuditory?.sample_auditory ?? 0,
        usuario,
        auditor,
      };
    };

    switch (areaId) {
      case 6:
        return getCommonData('corte');
      case 7:
        return getCommonData('colorEdge');
      case 8:
        return getCommonData('hotStamping');
      case 9:
        return getCommonData('millingChip');
      case 10:
        return getCommonData('personalizacion');
      default:
        return {
          buenas: 0,
          malas: 0,
          excedente: 0,
          cqm: 0,
          muestras: 0,
          usuario: '',
          auditor: '',
        };
    }
  };

  console.log('Work Order Data:', workOrder);

  const areas: AreaData[] =
    workOrder?.workOrder.flow
      ?.filter((item: any, index: any) => item.area_id >= 6)
      .map((item: any, index: any) => ({
        id: item.area_id,
        name: item.area?.name || 'Sin nombre',
        status: item.status || 'Desconocido',
        response: item.areaResponse || {},
        answers: item.answers || [],
        ...getAreaData(
          item.area_id,
          item.areaResponse,
          item.partialReleases,
          item.user,
          index
        ),
        parciales: item.partialReleases?.length ?? 0,
        parcialesValidados:
          item.partialReleases?.filter((p: any) => p?.validated).length ?? 0,
        partials: item.partialReleases ?? [],
      })) || [];

  const cantidadHojasRaw = Number(workOrder?.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const totalSheetsEffective = workOrder?.total_sheets ?? cantidadHojas;
  const ultimaArea = areas[areas.length - 1];
  const totalMalas = areas.reduce(
    (acc: any, area: any) => acc + (area.malas || 0),
    0
  );
  const totalCqm = areas
    .filter((area: any) => area.id >= 6)
    .reduce((acc: any, area: any) => acc + (area.cqm || 0), 0);
  const totalMuestras = areas.reduce(
    (acc: any, area: any) => acc + (area.muestras || 0),
    0
  );
  const totalUltimaBuenas = ultimaArea?.buenas || 0;
  const totalUltimaExcedente = ultimaArea?.excedente || 0;

  const totalGeneral =
    totalUltimaBuenas +
    totalUltimaExcedente +
    totalMalas +
    totalCqm +
    totalMuestras;

  const lastFlow = workOrder?.flow?.[workOrder.flow.length - 1];
  const lastStatus = lastFlow?.status?.toLowerCase?.() ?? '';
  const lastPartialRelease = Array.isArray(lastFlow?.partialReleases)
    ? lastFlow?.partialReleases[lastFlow.partialReleases.length - 1]
    : undefined;
  const totalPartialQuantity = Array.isArray(lastFlow?.partialReleases)
    ? lastFlow.partialReleases.reduce(
        (sum: number, release: any) => sum + (Number(release?.quantity) || 0),
        0
      )
    : 0;
  const totalPartialReleased = Array.isArray(lastFlow?.partialReleases)
    ? lastFlow.partialReleases.reduce(
        (sum: number, release: any) =>
          sum + (Number(release?.release_quantity) || 0),
        0
      )
    : 0;
  const remainingPartialToRelease = totalPartialQuantity - totalPartialReleased;

  const handleCloseOrder = async () => {
    setShowConfirm(false);
    const payload = {
      workOrderFlowId: workOrder.id,
      workOrderId: workOrder.workOrder.id,
    };
    console.log('Payload to send:', payload);
    try {
      await liberarWorkOrderAuditory(payload);
      Alert.alert('Orden cerrada', 'La orden de trabajo ha sido cerrada.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cerrar la orden.');
    }
  };

  const handleConfirmClose = () => {
    if (lastStatus === 'parcial') {
      setShowConfirm(false);
      setShowQtyModal(true);
      return;
    }
    handleCloseOrder();
  };

  const handleConfirmQuantity = async () => {
    const numericQty = Number(qtyToClient);
    if (!Number.isFinite(numericQty) || numericQty <= 0) {
      setQtyError('Ingresa una cantidad válida mayor a 0.');
      return;
    }

    const partialQty = Number(lastPartialRelease?.quantity ?? 0);
    if (numericQty > partialQty) {
      setQtyError('La cantidad no puede ser mayor a la del parcial.');
      return;
    }

    if (!lastPartialRelease?.id) {
      setQtyError('No se encontró un parcial para cerrar.');
      return;
    }

    try {
      await cerrarParcialWorkOrderAuditory(lastPartialRelease.id, numericQty);
      Alert.alert('Parcial cerrado', 'Se registró la entrega parcial.');
      setShowQtyModal(false);
      setQtyToClient('');
      setQtyError('');
      await loadData();
    } catch (error) {
      console.error('Error al cerrar el parcial:', error);
      Alert.alert(
        'Error',
        'No se pudo cerrar la parcialidad. Inténtalo nuevamente.'
      );
    }
  };

  const handleCancelQuantity = () => {
    setShowQtyModal(false);
    setQtyToClient('');
    setQtyError('');
  };
  function getLabelByType(type: string) {
    switch (type) {
      case 'OT':
        return 'Ver OT';
      case 'SKU':
        return 'Ver SKU';
      case 'OP':
        return 'Ver OP';
      case 'CARD_IMAGE':
        return 'Ver TARJETA';
      default:
        return 'Adjunto';
    }
  }

  const downloadFile = async (filename: string) => {
    try {
      const res = await getFileByName(filename);
      if (!res) {
        console.error('❌ Error desde el backend');
        return;
      }
      const base64Data = Buffer.from(res, 'binary').toString('base64');
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileViewer.open(fileUri, {
        showOpenWithDialog: true,
        displayName: filename,
      });
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Información de la Orden #{id}</Text>

      <View style={styles.card}>
        <InfoCard
          label="Número de Orden"
          value={String(workOrder?.ot_id ?? '')}
        />
        <InfoCard
          label="Id del Presupuesto"
          value={String(workOrder?.mycard_id ?? '')}
        />
        <InfoCard
          label="Cantidad (TARJETAS)"
          value={String(workOrder?.quantity ?? '')}
        />
        <InfoCard
          style={{ backgroundColor: '#93C5FD' }}
          label="Cantidad (Hojas Frente / Hojas Vuelta)"
          value={String(totalSheetsEffective)}
        />
        <InfoCard
          label="Fecha de Creación"
          value={
            workOrder?.createdAt
              ? new Date(workOrder.createdAt).toLocaleDateString()
              : '—'
          }
        />
        <InfoCard
          label="Comentarios"
          value={String(workOrder?.comments ?? '')}
        />
        <InfoCard label="Archivos de la Orden de Trabajo">
          {Array.isArray(workOrder?.files) && workOrder.files.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={fileStyles.row}
            >
              {workOrder.files.map((file: any) => (
                <TouchableOpacity
                  key={file.id}
                  onPress={() => downloadFile(file.file_path)} // ver función abajo
                  style={fileStyles.button}
                  activeOpacity={0.8}
                >
                  <Text style={fileStyles.buttonText}>
                    {getLabelByType(file.type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={fileStyles.empty}>
              No se ha adjuntado ningún archivo
            </Text>
          )}
        </InfoCard>
      </View>

      <Text style={styles.subtitle}>Datos de Producción por Área</Text>
      <ScrollView horizontal>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.cellUser}>Área</Text>
            <Text style={styles.cell}>Buenas</Text>
            <Text style={styles.cell}>Malas</Text>
            <Text style={styles.cell}>Excedente</Text>
            <Text style={styles.cell}>CQM</Text>
            <Text style={styles.cell}>Muestras</Text>
            <Text style={styles.cell}>Totales</Text>
            <Text style={styles.cellUser}>Usuario</Text>
            <Text style={styles.cellUser}>Auditor</Text>
          </View>
          {areas
            .filter((area: any) => area.id >= 6)
            .map((area: any, index: number) => (
              <View key={index} style={styles.row}>
                <Text style={styles.cellUser}>{area.name}</Text>
                <Text style={styles.cell}>{area.buenas}</Text>
                <Text style={styles.cell}>{area.malas}</Text>
                <Text style={styles.cell}>{area.excedente}</Text>
                <Text style={styles.cell}>{area.cqm}</Text>
                <Text style={styles.cell}>{area.muestras}</Text>
                <Text style={styles.cell}>
                  {Number(area.buenas) +
                    Number(area.malas) +
                    Number(area.excedente) +
                    Number(area.cqm) +
                    Number(area.muestras)}
                </Text>
                <Text style={styles.cellUser}>{area?.usuario}</Text>
                <Text style={styles.cellUser}>{area?.auditor}</Text>
              </View>
            ))}
        </View>
      </ScrollView>

      {workOrder?.status !== 'En proceso' && (
        <>
          <Text style={styles.subtitle}>Cuadres</Text>
          <View style={styles.tableCuadres}>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Buenas Última Operación</Text>
              <Text style={styles.cellValue}>{ultimaArea?.buenas ?? ''}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Excedente Última Operación</Text>
              <Text style={styles.cellValue}>
                {ultimaArea?.excedente ?? ''}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Total Malas</Text>
              <Text style={styles.cellValue}>{totalMalas}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Total CQM</Text>
              <Text style={styles.cellValue}>{totalCqm}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Total Muestras</Text>
              <Text style={styles.cellValue}>{totalMuestras}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>
                Cantidad restante parcial por liberar
              </Text>
              <Text style={styles.cellValue}>{remainingPartialToRelease}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>TOTAL</Text>
              <Text style={styles.cellValue}>{totalGeneral}</Text>
            </View>
          </View>
        </>
      )}

      {workOrder && <PartialHistory workOrder={workOrder} />}

      {workOrder?.status !== 'Cerrado' && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowConfirm(true)}
        >
          <Text style={styles.buttonText}>Cerrar Orden de Trabajo</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              ¿Deseas cerrar esta Orden de Trabajo?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowConfirm(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmClose}
                style={styles.confirmButton}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showQtyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Esta OT está en estado parcial
            </Text>
            <Text style={[styles.modalText, { marginBottom: 12 }]}>
              Ingresa la{' '}
              <Text style={{ fontWeight: '700' }}>
                cantidad a enviar al cliente
              </Text>
              :
            </Text>
            <TextInput
              value={qtyToClient}
              onChangeText={(text) => {
                setQtyToClient(text);
                if (qtyError) setQtyError('');
              }}
              keyboardType="numeric"
              placeholder="Ej: 1000"
              style={styles.modalInput}
            />
            {qtyError ? <Text style={styles.errorText}>{qtyError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleCancelQuantity}
                style={styles.cancelButton}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmQuantity}
                style={styles.confirmButton}
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

export default CerrarOrdenDeTrabajoAuxScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fdfaf6',
  },
  cellHeader: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'left',
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  cellLabel: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'left',
    width: 180,
  },
  cellUser: {
    flex: 1,
    minWidth: 90,
    textAlign: 'left',
  },
  cellValue: {
    flex: 1,
    minWidth: 30,
    textAlign: 'right',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'black',
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
    marginTop: 8,
  },
  value: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  table: {
    padding: 10,
    backgroundColor: '#fff',
  },
  tableCuadres: {
    padding: 10,
    backgroundColor: '#fff',
    maxWidth: '76%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 6,
  },
  cell: {
    width: 85,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 8,
    color: '#111827',
  },
  cancelButton: {
    backgroundColor: '#ccc',
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
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
});
const fileStyles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
    marginRight: 8,
  },
  buttonText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  empty: { fontSize: 16, fontWeight: '600', color: '#111827' },
});
