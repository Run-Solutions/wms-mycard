import InfoCard from '../../SeguimientoDeOts/InfoCard';
import { getFileByName } from '../../../api/finalizacion';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import FileViewer from 'react-native-file-viewer';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  workOrder: any;
  lastCompletedOrPartial?: any;
  defaultValues?: any;
}
interface PartialRelease {
  validated: boolean;
  quantity: number;
}

export default function WorkOrderInfo({
  workOrder,
  defaultValues,
  lastCompletedOrPartial,
}: Props) {
  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const totalSheetsEffective = workOrder?.workOrder?.total_sheets ?? cantidadHojas;

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
    <>
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
              label="Presupuesto"
              value={String(workOrder?.workOrder.mycard_id ?? '')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Cantidad (Tarjetas)"
              value={String(workOrder?.workOrder.quantity ?? '')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              style={{ backgroundColor: "#93C5FD" }}
              label="Cantidad (Hojas Frente / Hojas Vuelta):"
              value={String(totalSheetsEffective)}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Área que lo envía"
              value={lastCompletedOrPartial?.area?.name || 'No definida'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Usuario"
              value={lastCompletedOrPartial?.user?.username || 'No definido'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Auditor que lo envía:"
              value={defaultValues.auditor}
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
    </>
  );
}
export function WorkOrderHojasInfo({
  workOrder,
  lastCompletedOrPartial,
}: Props) {
  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const totalSheetsEffective = workOrder?.workOrder?.total_sheets ?? cantidadHojas;

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
    <>
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
              label="Presupuesto"
              value={String(workOrder?.workOrder.mycard_id ?? '')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Cantidad (Tarjetas)"
              value={String(workOrder?.workOrder.quantity ?? '')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              style={{ backgroundColor: "#93C5FD" }}
              label="Cantidad (Hojas Frente / Hojas Vuelta):"
              value={String(totalSheetsEffective)}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Área que lo envía"
              value={lastCompletedOrPartial?.area?.name || 'No definida'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Usuario que lo envía:"
              value={lastCompletedOrPartial?.user?.username || 'No definido'}
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
    </>
  );
}
export function WorkOrderPrePressInfo({
  workOrder,
  lastCompletedOrPartial,
}: Props) {
  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const totalSheetsEffective = workOrder?.workOrder?.total_sheets ?? cantidadHojas;

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
    <>
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
              label="Presupuesto"
              value={String(workOrder?.workOrder.mycard_id ?? '')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Cantidad (Tarjetas)"
              value={String(workOrder?.workOrder.quantity ?? '')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              style={{ backgroundColor: "#93C5FD" }}
              label="Cantidad (Hojas Frente / Hojas Vuelta):"
              value={String(totalSheetsEffective)}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Área que lo envía"
              value={lastCompletedOrPartial?.area?.name || 'No definida'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InfoCard
              label="Usuario que lo envía:"
              value={lastCompletedOrPartial?.user?.username || 'No definido'}
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
    </>
  );
}
const styles = StyleSheet.create({

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
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
