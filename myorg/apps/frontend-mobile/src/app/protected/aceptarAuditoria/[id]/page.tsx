// myorg/apps/frontend-mobile/src/app/protected/aceptarAuditoria/[id]/page.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getWorkOrderByFlowId } from '../../../../api/aceptarAuditoria';
import InfoCard from '../../../../components/SeguimientoDeOts/InfoCard';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import FileViewer from 'react-native-file-viewer';
import { getFileByName } from '../../../../api/finalizacion';
// Componentes por área
import CorteComponentAcceptAuditory from '../../../../components/AceptarAuditoria/CorteComponents';
import ColorEdgeComponentAcceptAuditory from '../../../../components/AceptarAuditoria/ColorEdgeComponents';
import HotStampingComponentAcceptAuditory from '../../../../components/AceptarAuditoria/HotStampingComponent';
import MillingChipComponentAcceptAuditory from '../../../../components/AceptarAuditoria/MillingChipComponent';
import PersonalizacionComponentAcceptAuditory from '../../../../components/AceptarAuditoria/PersonalizacionComponent';

import { InternalStackParamList } from '../../../../navigation/types';

type RouteParams = RouteProp<
  InternalStackParamList,
  'AceptarAuditoriaAuxScreen'
>;

const AceptarAuditoriaAuxScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const { flowId } = route.params;

  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<any>(null);

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        const data = await getWorkOrderByFlowId(flowId);
        console.log('Orden:', data);
        setWorkOrder(data);
      } catch (error) {
        console.error('Error al obtener la OT:', error);
        Alert.alert('Error', 'No se pudo cargar la orden.');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [flowId]);

  const renderComponentByArea = () => {
    switch (workOrder.area_id) {
      case 6:
        return <CorteComponentAcceptAuditory workOrder={workOrder} />;
      case 7:
        return <ColorEdgeComponentAcceptAuditory workOrder={workOrder} />;
      case 8:
        return <HotStampingComponentAcceptAuditory workOrder={workOrder} />;
      case 9:
        return <MillingChipComponentAcceptAuditory workOrder={workOrder} />;
      case 10:
        return <PersonalizacionComponentAcceptAuditory workOrder={workOrder} />;
      default:
        return <Text style={styles.title}>Área no reconocida.</Text>;
    }
  };

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
      <Text style={styles.header}>Información de la OT</Text>
      <Text style={styles.title}>Área: {workOrder?.area?.name}</Text>
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Número de Orden"
              value={String(workOrder?.workOrder.ot_id ?? '')}
            />
          </View>

          <View style={{ flex: 1 }}>
            <InfoCard
              label="Id del Presupuesto"
              value={String(workOrder?.workOrder.mycard_id ?? '')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Cantidad (TARJETAS)"
              value={String(workOrder?.workOrder.quantity ?? '')}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Área que lo envía"
              value={workOrder?.area?.name || 'No definida'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Usuario"
              value={workOrder?.user?.username || 'No definido'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Fecha de Creación"
              value={
                workOrder?.workOrder.createdAt
                  ? new Date(workOrder.workOrder.createdAt).toLocaleDateString()
                  : '—'
              }
            />
          </View>
        </View>
        <InfoCard
          label="Comentarios"
          value={String(workOrder?.workOrder.comments ?? '')}
        />
        <InfoCard label="Archivos de la Orden de Trabajo">
          {Array.isArray(workOrder?.workOrder.files) &&
          workOrder.workOrder.files.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={fileStyles.row}
            >
              {workOrder.workOrder.files.map((file: any) => (
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
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : (
        renderComponentByArea()
      )}
    </ScrollView>
  );
};

export default AceptarAuditoriaAuxScreen;

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
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
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
