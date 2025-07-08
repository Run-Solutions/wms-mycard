// myorg/apps/frontend-mobile/src/components/LiberarProducto/WorkOrderList.tsx
'use client';

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { InternalStackParamList } from '../../navigation/types';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import FileViewer from 'react-native-file-viewer';
import styled from 'styled-components/native';
import { TextInput } from 'react-native-paper';

type Navigation = NavigationProp<
  InternalStackParamList,
  'LiberarProductoAuxScreen'
>;
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { getFileByName } from '../../api/finalizacion';

interface File {
  id: number;
  type: string;
  file_path: string;
}

interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  status: string;
  validated: boolean;
  createdAt: string;
  user: {
    username: string;
  };
  flow: {
    area_id: number;
    status: string;
    area?: { name?: string };
  }[];
  files: File[];
}

interface Props {
  orders: WorkOrder[];
  title?: string;
  onSelectOrder?: (id: number) => void;
  isTouchable?: boolean;
}

const WorkOrderList: React.FC<Props> = ({ orders, onSelectOrder }) => {
  const [searchValue, setSearchValue] = React.useState('');
  const navigation = useNavigation<any>();
  const validOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = validOrders.filter((order) =>
    order.ot_id.toLowerCase().includes(searchValue.toLowerCase())
  );
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
  const renderItem = ({ item }: { item: WorkOrder }) => {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Principal', {
              screen: 'LiberarProductoAuxScreen',
              params: { id: item.ot_id },
            })
          }
        >
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.title}>OT: {item.ot_id}</Text>
              <Text>Id del presupuesto: {item.mycard_id}</Text>
              <Text>Cantidad: {item.quantity}</Text>
              <Text>Estado: {item.status}</Text>
              <Text>Creado por: {item.user?.username}</Text>
            </View>

            <View style={styles.filesBlock}>
              {item.files.length > 0 ? (
                item.files.map((file) => {
                  const label = file.file_path.toLowerCase().includes('ot')
                    ? 'Ver OT'
                    : file.file_path.toLowerCase().includes('sku')
                    ? 'Ver SKU'
                    : file.file_path.toLowerCase().includes('op')
                    ? 'Ver OP'
                    : 'Ver Archivo';
                  return (
                    <TouchableOpacity
                      key={file.id}
                      onPress={() => downloadFile(file.file_path)}
                      style={styles.fileButton}
                    >
                      <Text style={styles.fileText}>{label}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.noFiles}>No hay archivos</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.flowLine}
          contentContainerStyle={styles.timelineContainer}
        >
          {item.flow.map((step, index) => {
            const isActive = ['proceso', 'listo'].some((word) =>
              step.status?.toLowerCase().includes(word)
            );
            const isParcial = ['parcial'].some((word) =>
              step.status?.toLowerCase().includes(word)
            );
            const isCompleted = step.status
              ?.toLowerCase()
              .includes('completado');
            const isCalidad = ['enviado a cqm', 'en calidad'].some((status) =>
              step.status?.toLowerCase().includes(status)
            );
            const isLast = index === item.flow.length - 1;

            const getColor = () => {
              if (isCompleted) return '#22c55e';
              if (isCalidad) return '#facc15';
              if (isActive) return '#4a90e2';
              if (isParcial) return '#f5945c';
              return '#d1d5db';
            };

            return (
              <View key={index} style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    { backgroundColor: getColor(), shadowColor: getColor() },
                  ]}
                >
                  <Text style={styles.circleText}>{index + 1}</Text>
                </View>
                <Text
                  style={[
                    styles.areaLabel,
                    {
                      color: isCompleted
                        ? '#22c55e'
                        : isCalidad
                        ? '#facc15'
                        : isActive
                        ? '#4a90e2'
                        : isParcial
                        ? '#f5945c'
                        : '#6b7280',
                      fontWeight: isActive ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {step.area?.name ?? `Área ${step.area_id}`}
                </Text>
                {!isLast && <View style={styles.line} />}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 5, backgroundColor: '#fdfaf6' }}>
      <Container>
        <Label>Buscar OT</Label>
        <TextInput
          label="Buscar OT"
          value={searchValue}
          onChangeText={setSearchValue}
          mode="outlined"
          activeOutlineColor="#000"
          style={styles.input}
          theme={{ roundness: 30 }}
        />
      </Container>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default WorkOrderList;

const Container = styled.View`
  margin-vertical: 8px;
  margin-horizontal: 10px;
`;

const Label = styled.Text`
  color: black;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: bold;
`;

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 30,
    fontSize: 14,
    width: '90%',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'column',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  flowLine: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginTop: 10,
    overflow: 'scroll',
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  stepItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 2,
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  areaLabel: {
    fontSize: 12,
    marginTop: 6,
    textTransform: 'capitalize',
    maxWidth: 90,
    textAlign: 'center',
  },
  line: {
    position: 'absolute',
    top: 14,
    left: 30,
    height: 2,
    backgroundColor: '#d1d5db',
    width: 90,
    zIndex: 1,
  },
  fileButton: {
    borderColor: '#c2c2c2',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#f7f7f7',
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  fileText: {
    fontSize: 12,
    color: '#000',
  },
  noFiles: {
    color: '#888',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  infoBlock: {
    flex: 1,
  },
  filesBlock: {
    flexShrink: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
});
