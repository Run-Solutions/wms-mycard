import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Impresion from './Impresion';
import Serigrafia from './Serigrafia';
import Empalme from './Empalme';
import Laminacion from './Laminacion';
import Corte from './Corte';
import ColorEdge from './ColorEdge';
import HotStamping from './HotStamping';
import MillingChip from './MillingChip';
import Personalizacion from './Personalizacion';
import { getFormQuestionsByArea } from '../../api/configVistosBuenos';
import { black } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

export default function ConfiguracionVistosBuenosOption({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const [formQuestions, setFormQuestions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFormQuestions = useCallback(async () => {
    try {
      const data = await getFormQuestionsByArea(id);
      setFormQuestions(data);
    } catch (error) {
      console.error('Error al obtener preguntas del formulario:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFormQuestions();
  }, []);

  const renderComponentByArea = () => {
    switch (id) {
      case 2:
        return <Impresion formQuestion={formQuestions} />;
      case 3:
        return <Serigrafia formQuestion={formQuestions} />;
      case 4:
        return <Empalme formQuestion={formQuestions} />;
      case 5:
        return <Laminacion formQuestion={formQuestions} />;
      case 6:
        return <Corte formQuestion={formQuestions} />;
      case 7:
        return <ColorEdge formQuestion={formQuestions} />;
      case 8:
        return <HotStamping formQuestion={formQuestions} />;
      case 9:
        return <MillingChip formQuestion={formQuestions} />;
      case 10:
        return <Personalizacion formQuestion={formQuestions} />;
      default:
        return <Text>Área no reconocida.</Text>;
    }
  };

  if (loading || !formQuestions) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {renderComponentByArea()}
      <View style={{ marginBottom: 30, alignItems: 'flex-end' }}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 60,
    backgroundColor: '#fdfaf6', 
    borderRadius: 12
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
