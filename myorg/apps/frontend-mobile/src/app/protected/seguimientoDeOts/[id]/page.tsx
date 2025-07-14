'use client';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { InternalStackParamList } from '../../../../navigation/types';
import {
  fetchWorkOrderById,
  closeWorkOrder,
  updateWorkOrderAreas,
} from '../../../../api/seguimientoDeOts';
import { TextInput } from 'react-native-paper';

type WorkOrderDetailRouteProp = RouteProp<
  InternalStackParamList,
  'WorkOrderDetailScreen'
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
};

const WorkOrderDetailScreen: React.FC = () => {
  const route = useRoute<WorkOrderDetailRouteProp>();
  const { id } = route.params;
  const navigation = useNavigation();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [areas, setAreas] = useState<AreaData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchWorkOrderById(id);
      setWorkOrder(data);
      const areaData =
        data?.flow?.map((item: any, index: number) => ({
          id: item.area_id,
          name: item.area?.name || 'Sin nombre',
          status: item.status || 'Desconocido',
          response: item.areaResponse || {},
          answers: item.answers?.[0] || {},
          ...getAreaData(
            item.area_id,
            item.areaResponse,
            item.partialReleases,
            item.user,
            index
          ),
        })) || [];
      setAreas(areaData);
    };
    loadData();
  }, [id]);

  const renderCell = (area: AreaData, field: keyof AreaData) => {
    // 1. Si la orden está cerrada, todo es lectura
    if (workOrder?.status === 'Cerrado') {
      return <Text style={styles.cellUser}>{area[field]}</Text>;
    }

    // 2. Si el área no está Completado, todo es lectura
    if (area.status !== 'Completado') {
      return <Text style={styles.cellUser}>{area[field]}</Text>;
    }

    // 3. Preprensa: solo 'buenas' editable
    if (area.id === 1) {
      if (field === 'buenas') {
        return (
          <TextInput
            mode="outlined"
            activeOutlineColor="#000"
            value={String(area[field])}
            keyboardType="numeric"
            onChangeText={(text) => handleValueChange(area.id, field, text)}
            style={[styles.input, {height:40}]}
          />
        );
      } else {
        return <Text style={styles.cellUser}>{area[field]}</Text>;
      }
    }

    // 4. CQM solo editable desde Impresión (id >=2)
    if (field === 'cqm') {
      if (area.id >= 2) {
        return (
          <TextInput
            mode="outlined"
            activeOutlineColor="#000"
            keyboardType="numeric"
            value={String(area[field])}
            onChangeText={(text) => handleValueChange(area.id, field, text)}
            style={[styles.input, {height:40}]}
          />
        );
      } else {
        return <Text style={styles.cellUser}>{area[field]}</Text>;
      }
    }

    // 5. Muestras solo editable desde Corte (id >=6)
    if (field === 'muestras') {
      if (area.id >= 6) {
        return (
          <TextInput
            mode="outlined"
            activeOutlineColor="#000"
            keyboardType="numeric"
            value={String(area[field])}
            onChangeText={(text) => handleValueChange(area.id, field, text)}
            style={[styles.input, {height:40}]}
          />
        );
      } else {
        return <Text style={styles.cellUser}>{area[field]}</Text>;
      }
    }

    // 6. Resto de campos (buenas, malas, excedente) editables si área Completado
    return (
      <TextInput
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        value={String(area[field])}
        onChangeText={(text) => handleValueChange(area.id, field, text)}
        style={[styles.input, {height:40}]}
      />
    );
  };

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
      case 1:
        return getCommonData('prepress');
      case 2:
        return getCommonData('impression');
      case 3:
        return getCommonData('serigrafia');
      case 4:
        return getCommonData('empalme');
      case 5:
        return getCommonData('laminacion');
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

  const cantidadHojasRaw = Number(workOrder?.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const ultimaArea = areas[areas.length - 1];
  const totalMalas = areas.reduce((acc, area) => acc + (area.malas || 0), 0);
  const totalCqm = areas
    .filter((area) => area.id >= 6)
    .reduce((acc, area) => acc + (area.cqm || 0), 0);
  const totalMuestras = areas.reduce(
    (acc, area) => acc + (area.muestras || 0),
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

  const handleCloseOrder = async () => {
    try {
      await closeWorkOrder(workOrder?.ot_id);
      Alert.alert('Orden cerrada', 'La orden de trabajo ha sido cerrada.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cerrar la orden.');
    }
  };

  const handleValueChange = (
    areaId: number,
    field: keyof AreaData,
    value: string | number
  ) => {
    setAreas((prev) =>
      prev.map((area) =>
        area.id === areaId ? { ...area, [field]: Number(value) } : area
      )
    );
  };

  const handleSaveChanges = async () => {
    const payload = {
      areas: areas
        .filter((area) => area.status === 'Completado')
        .map((area) => {
          // Este mapa relaciona nombre del área con el nombre del bloque en el objeto
          const blockMap: Record<string, string> = {
            preprensa: 'prepress',
            impresion: 'impression',
            serigrafia: 'serigrafia',
            empalme: 'empalme',
            laminacion: 'laminacion',
            corte: 'corte',
            coloredge: 'colorEdge',
            millingchip: 'millingChip',
            hotstamping: 'hotStamping',
            personalizacion: 'personalizacion',
          };

          // Normaliza nombre a minúscula sin espacios
          const normalizedName = area.name.toLowerCase().replace(/\s/g, '');

          const block = blockMap[normalizedName] || 'otros';
          const blockId = (area.response as any)?.[block]?.id;
          const formId = (area.response as any)?.[block]?.form_auditory_id;
          const cqmId = (area.response as any)?.[block]?.form_answer_id;

          // Prepara los campos que compartes para la mayoría de áreas
          let data: Record<string, number> = {
            good_quantity: area.buenas,
            bad_quantity: area.malas,
            excess_quantity: area.excedente,
          };
          let sample_data: Record<string, number> = {
            sample_quantity: area.cqm,
            sample_auditory: area.muestras,
          };

          // Para áreas con campos específicos
          if (block === 'prepress') {
            data = {
              plates: area.buenas,
            };
          }
          if (
            ['impression', 'serigrafia', 'laminacion', 'empalme'].includes(
              block
            )
          ) {
            data = {
              release_quantity: area.buenas,
              bad_quantity: area.malas,
              excess_quantity: area.excedente,
            };
            sample_data = {
              sample_quantity: area.cqm,
            };
          }

          return {
            areaId: area.id,
            block,
            blockId,
            formId,
            cqmId,
            data,
            sample_data,
          };
        }),
    };

    console.log('Payload a enviar:', payload);

    // Aquí haces el fetch

    try {
      await updateWorkOrderAreas(workOrder.ot_id, payload);
      Alert.alert('Éxito', 'Cambios guardados correctamente');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Error al guardar los cambios');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Información de la Orden #{id}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Número de Orden:</Text>
        <Text style={styles.value}>{workOrder?.ot_id}</Text>

        <Text style={styles.label}>Id del Presupuesto:</Text>
        <Text style={styles.value}>{workOrder?.mycard_id}</Text>

        <Text style={styles.label}>Cantidad (TARJETAS):</Text>
        <Text style={styles.value}>{workOrder?.quantity}</Text>

        <Text style={styles.label}>Cantidad (KITS):</Text>
        <Text style={styles.value}>{cantidadHojas}</Text>

        <Text style={styles.label}>Fecha de Creación:</Text>
        <Text style={styles.value}>
          {new Date(workOrder?.createdAt).toLocaleDateString()}
        </Text>

        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{workOrder?.comments}</Text>
      </View>

      <Text style={styles.subtitle}>Datos de Producción por Área</Text>
      <ScrollView horizontal>
        <View style={styles.table}>
          {/* Encabezado */}
          <View style={styles.headerRow}>
            <Text style={[styles.cellHeader, { width: 180 }]}></Text>
            {areas.map((area, index) => (
              <Text
                key={`${area.id}-${index}`}
                style={[styles.cellHeader, { minWidth: 90 }]}
              >
                {area.name}
              </Text>
            ))}
          </View>

          {/* Usuario */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Usuario</Text>
            {areas.map((area, index) => (
              <Text key={`${area.id}-usuario-${index}`} style={styles.cellUser}>
                {area.usuario}
              </Text>
            ))}
          </View>

          {/* Auditor */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Auditor</Text>
            {areas.map((area, index) => (
              <Text key={`${area.id}-auditor-${index}`} style={styles.cellUser}>
                {area.auditor}
              </Text>
            ))}
          </View>

          {/* Estado */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Estado</Text>
            {areas.map((area, index) => (
              <Text key={`${area.id}-status-${index}`} style={styles.cellUser}>
                {area.status}
              </Text>
            ))}
          </View>

          {/* Buenas */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Buenas</Text>
            {areas.map((area, index) => (
              <View key={`${area.id}-buenas-${index}`} style={styles.cellUser}>
                {renderCell(area, 'buenas')}
              </View>
            ))}
          </View>

          {/* Malas */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Malas</Text>
            {areas.map((area, index) => (
              <View key={`${area.id}-malas-${index}`} style={styles.cellUser}>
                {renderCell(area, 'malas')}
              </View>
            ))}
          </View>

          {/* Excedente */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Excedente</Text>
            {areas.map((area, index) => (
              <View
                key={`${area.id}-excedente-${index}`}
                style={styles.cellUser}
              >
                {renderCell(area, 'excedente')}
              </View>
            ))}
          </View>

          {/* CQM */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>CQM</Text>
            {areas.map((area, index) => (
              <View key={`${area.id}-cqm-${index}`} style={styles.cellUser}>
                {renderCell(area, 'cqm')}
              </View>
            ))}
          </View>

          {/* Muestras */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Muestras</Text>
            {areas.map((area, index) => (
              <View
                key={`${area.id}-muestras-${index}`}
                style={styles.cellUser}
              >
                {renderCell(area, 'muestras')}
              </View>
            ))}
          </View>

          {/* Suma Total */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>SUMA TOTAL</Text>
            {areas.map((area, index) => (
              <Text key={`${area.id}-suma-${index}`} style={styles.cellUser}>
                {Number(area.buenas) +
                  Number(area.malas) +
                  Number(area.excedente) +
                  Number(area.cqm) +
                  Number(area.muestras)}
              </Text>
            ))}
          </View>

          {/* Buenas + Excedente */}
          <View style={[styles.row, { backgroundColor: '#d7e6d1' }]}>
            <Text style={styles.cellLabel}>BUENAS + EXCEDENTE</Text>
            {areas.map((area, index) => (
              <Text
                key={`${area.id}-buenas-excedente-${index}`}
                style={styles.cellUser}
              >
                {area.id >= 6 ? area.buenas + area.excedente : ''}
              </Text>
            ))}
          </View>
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
              <Text style={styles.cellLabel}>TOTAL</Text>
              <Text style={styles.cellValue}>{totalGeneral}</Text>
            </View>
          </View>
        </>
      )}

      {workOrder?.status !== 'Cerrado' && (
        <>
        <TouchableOpacity
          style={styles.buttonSave}
          onPress={handleSaveChanges}
        >
          <Text style={styles.buttonText}>Guardar Cambios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowConfirm(true)}
        >
          <Text style={styles.buttonText}>Cerrar Orden de Trabajo</Text>
        </TouchableOpacity>
        </>
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
                onPress={handleCloseOrder}
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

export default WorkOrderDetailScreen;

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
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 7,
  },
  cell: {
    width: 85,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  input: {
    width: 80,
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonSave: {
    backgroundColor: '#A9A9A9',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  modalButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
});
