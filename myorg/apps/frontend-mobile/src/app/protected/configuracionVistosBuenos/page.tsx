import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { getConfigVistosBuenos } from '../../../api/configVistosBuenos';
import ConfiguracionVistosBuenosOption from '../../../components/ConfiguracionVistosBuenos/ConfiguracionVistosBuenosOption';

interface FormQuestion {
  id: number;
  title: string;
  key: string;
  role_id: number | null;
  areas: {
    id: number;
    name: string;
  }[];
  created_at: string;
  updated_at: string;
}

interface Area {
  id: number;
  name: string;
}

const ConfigVistosBuenosScreen: React.FC = () => {
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  useEffect(() => {
    fetchFormQuestions();
  }, []);

  async function fetchFormQuestions() {
    try {
      const response = await getConfigVistosBuenos();
      setFormQuestions(response);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Hubo un problema al cargar los datos.');
    }
  }

  const uniqueAreas = Array.from(
    new Map(
      formQuestions.flatMap((fq) => fq.areas).map((area) => [area.id, area])
    ).values()
  );

  const handlePress = (area: Area) => {
    setSelectedArea(area);
    setModalVisible(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Configuración de Vistos Buenos</Text>
      <View style={styles.grid}>
        {uniqueAreas.map((area) => (
          <TouchableOpacity
            key={area.id}
            style={styles.card}
            onPress={() => handlePress(area)}
          >
            <Text style={styles.cardTitle}>{area.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#fdfaf6' }}>
          <ScrollView style={styles.modalOverlay} contentContainerStyle={{ flexGrow: 1 }}>
            {selectedArea != null && (
              <ConfiguracionVistosBuenosOption id={selectedArea.id} onClose={() => setModalVisible(false)}/>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ConfigVistosBuenosScreen;

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fdfaf6',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: screenWidth * 0.43,
    alignItems: 'center',
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainerExpanded: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  scrollSection: {
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
