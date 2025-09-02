import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { InternalStackParamList } from '../../../../navigation/types';
import { getWorkOrderInconformidadById } from '../../../../api/inconformidades';
import InfoCard from '../../../../components/SeguimientoDeOts/InfoCard';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import FileViewer from 'react-native-file-viewer';
import { getFileByName } from '../../../../api/finalizacion';

// Componentes por área (ajusta según los que tengas)
import PreprensaComponent from '../../../../components/Inconformidades/PreprensaComponent';
import ImpresionComponent from '../../../../components/Inconformidades/ImpresionComponent';
import ImpresionComponentCQM from '../../../../components/Inconformidades/ImpresionComponentCQM';
import SerigrafiaComponentCQM from '../../../../components/Inconformidades/SerigrafiaComponentCQM';
import SerigrafiaComponent from '../../../../components/Inconformidades/SerigrafiaComponent';
import EmpalmeComponent from '../../../../components/Inconformidades/EmpalmeComponent';
import LaminacionComponent from '../../../../components/Inconformidades/LaminacionComponent';
import CorteComponent from '../../../../components/Inconformidades/CorteComponent';
import ColorEdgeComponent from '../../../../components/Inconformidades/ColorEdgeComponent';
import HotStampingComponent from '../../../../components/Inconformidades/HotStampingComponent';
import MillingChipComponent from '../../../../components/Inconformidades/MillingChipComponent';
import PersonalizacionComponent from '../../../../components/Inconformidades/PersonalizacionComponent';
import EmpalmeComponentCQM from '../../../../components/Inconformidades/EmpalmeComponentCQM';
import LaminacionComponentCQM from '../../../../components/Inconformidades/LaminacionComponentCQM';
import CorteComponentCQM from '../../../../components/Inconformidades/CorteComponentCQM';
import ColorEdgeComponentCQM from '../../../../components/Inconformidades/ColorEdgeComponentCQM';
import HotStampingComponentCQM from '../../../../components/Inconformidades/HotStampingComponentCQM';
import MillingChipComponentCQM from '../../../../components/Inconformidades/MillingChipComponentCQM';
import PersonalizacionComponentCQM from '../../../../components/Inconformidades/PersonalizacionComponentCQM';

// ...otros componentes

type RouteParams = RouteProp<
  InternalStackParamList,
  'InconformidadesAuxScreen'
>;

const InconformidadesAuxScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<any>(null);

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        const data = await getWorkOrderInconformidadById(id);
        setWorkOrder(data);
      } catch (err) {
        console.error('Error al obtener la orden', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0038A8" />;
  }

  if (!workOrder) {
    return <Text style={styles.title}>No se encontró la OT</Text>;
  }

  const lastCompleted = [...workOrder.flow]
    .reverse()
    .find((item) => item.status === 'En inconformidad');
  const areaInconformidadCQM = [...workOrder.flow]
    .reverse()
    .find((item) => item.status === 'En inconformidad CQM');

  function getLabelByType(type: string) {
    switch (type) {
      case 'OT':
        return 'Ver OT';
      case 'SKU':
        return 'Ver SKU';
      case 'OP':
        return 'Ver OP';
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

  const renderComponentByArea = () => {
    if (lastCompleted) {
      switch (lastCompleted.area_id) {
        case 1:
          return <PreprensaComponent workOrder={lastCompleted} />;
        case 2:
          return <ImpresionComponent workOrder={lastCompleted} />;
        case 3:
          return <SerigrafiaComponent workOrder={lastCompleted} />;
        case 4:
          return <EmpalmeComponent workOrder={lastCompleted} />;
        case 5:
          return <LaminacionComponent workOrder={lastCompleted} />;
        case 6:
          return <CorteComponent workOrder={lastCompleted} />;
        case 7:
          return <ColorEdgeComponent workOrder={lastCompleted} />;
        case 8:
          return <HotStampingComponent workOrder={lastCompleted} />;
        case 9:
          return <MillingChipComponent workOrder={lastCompleted} />;
        case 10:
          return <PersonalizacionComponent workOrder={lastCompleted} />;
        default:
          return <Text style={styles.title}>Área no reconocida</Text>;
      }
    }
    if (areaInconformidadCQM) {
      switch (areaInconformidadCQM.area_id) {
        case 2:
          return <ImpresionComponentCQM workOrder={areaInconformidadCQM} />;
        case 3:
          return <SerigrafiaComponentCQM workOrder={areaInconformidadCQM} />;
        case 4:
          return <EmpalmeComponentCQM workOrder={areaInconformidadCQM} />;
        case 5:
          return <LaminacionComponentCQM workOrder={areaInconformidadCQM} />;
        case 6:
          return <CorteComponentCQM workOrder={areaInconformidadCQM} />;
        case 7:
          return <ColorEdgeComponentCQM workOrder={areaInconformidadCQM} />;
        case 8:
          return <HotStampingComponentCQM workOrder={areaInconformidadCQM} />;
        case 9:
          return <MillingChipComponentCQM workOrder={areaInconformidadCQM} />;
        case 10:
          return (
            <PersonalizacionComponentCQM workOrder={areaInconformidadCQM} />
          );
        default:
          return <Text style={styles.title}>Área CQM no reconocida</Text>;
      }
    }
    return <Text style={styles.title}>No hay área con inconformidad</Text>;
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 8,
        paddingTop: 16,
        backgroundColor: '#fdfaf6',
        flexGrow: 1,
      }}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      // iOS:
      contentInsetAdjustmentBehavior="automatic"
      // Android (opcional):
      // removeClippedSubviews={false}
    >
      {/* Información fija */}
      <Text style={styles.header}>Información de la OT</Text>
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Número de Orden"
              value={String(workOrder?.ot_id ?? '')}
            />
          </View>

          <View style={{ flex: 1 }}>
            <InfoCard
              label="Id del Presupuesto"
              value={String(workOrder?.mycard_id ?? '')}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <InfoCard
            label="Cantidad (TARJETAS)"
            value={String(workOrder?.quantity ?? '')}
          />
          <InfoCard
            label="Fecha de Creación"
            value={
              workOrder?.createdAt
                ? new Date(workOrder.createdAt).toLocaleDateString()
                : '—'
            }
          />
        </View>
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
      {/* Componente que podría contener listas */}
      {renderComponentByArea()}
    </ScrollView>
  );
};

export default InconformidadesAuxScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 2,
    paddingHorizontal: 8,
    backgroundColor: '#fdfaf6',
  },
  header: {
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
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontWeight: 'normal',
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
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
