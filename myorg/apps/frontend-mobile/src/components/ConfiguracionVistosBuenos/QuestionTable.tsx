import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Checkbox } from 'react-native-paper';

interface Area {
  id: number;
  name?: string;
}

interface Question {
  id: number;
  title: string;
  role_id: number | null;
  areas: Area[];
}

interface QuestionTableProps {
  title: string;
  questions: Question[];
  areaId: number;
  roleFilter: number | null;
  onEdit: (question: Question) => void;
  onDelete: (id: number) => void;
}

export function QuestionTable({
  title,
  questions,
  areaId,
  roleFilter,
  onEdit,
  onDelete,
}: QuestionTableProps) {
  const [checked, setChecked] = React.useState<
    'unchecked' | 'checked' | 'indeterminate'
  >('unchecked');
  const filtered = questions.filter(
    (q) => q.role_id === roleFilter && q.areas.some((a) => a.id === areaId)
  );

  if (filtered.length === 0) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.modalScrollContent}
    >
      <Text style={styles.modalTitle}>{title}</Text>

      {/* Encabezado estilo tabla */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
        <Text style={styles.tableCell}>Respuesta</Text>
      </View>

      {filtered.map((q) => (
        <View key={q.id} style={styles.tableRow}>
          {/* Pregunta */}
          <View style={[styles.tableCell, styles.questionCell]}>
            <Text
              style={styles.questionText}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {q.title}
            </Text>
          </View>

          <View style={[styles.tableCell, styles.actionsCell]}>
            <Checkbox status={checked} />
            <TouchableOpacity
              onPress={() => onEdit(q)}
              style={styles.iconButton}
            >
              <Text style={styles.buttonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(q.id)}
              style={styles.iconButton}
            >
              <Text style={styles.buttonText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fdfaf6',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
  },
  row: {
    flexDirection: 'column',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {},
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#d1d5db',
    borderRadius: 6,
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tableCell: {
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 14,
    color: '#111827',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  modalScrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  questionCell: {
    flex: 2,
    paddingRight: 10,
  },
  actionsCell: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  iconButton: {
    backgroundColor: '#e5e7eb',
    padding: 6,
    borderRadius: 6,
  },
});

export default QuestionTable;
