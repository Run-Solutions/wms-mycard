import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
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

export function QuestionTable({ title, questions, areaId, roleFilter, onEdit, onDelete }: QuestionTableProps) {
  const [checked, setChecked] = React.useState<"unchecked" | "checked" | "indeterminate">("unchecked");
  const filtered = questions.filter(
    (q) => q.role_id === roleFilter && q.areas.some((a) => a.id === areaId)
  );



  if (filtered.length === 0) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {filtered.map((q) => (
        <View key={q.id} style={styles.row}>
          <Text style={styles.title}>{q.title}</Text>
          <View style={styles.rightSide}>
            <Checkbox status={checked} />
            <TouchableOpacity onPress={() => onEdit(q)} style={styles.button}>
              <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(q.id)} style={styles.button}>
              <Text style={styles.buttonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  row: {
    flexDirection: 'column',
    paddingVertical: 12,
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
  switch: {
    marginRight: 16,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#d1d5db',
    borderRadius: 6,
    marginLeft: 8,
  },
  buttonText: {
    color: '#111827',
    fontWeight: '500',
  },
});

export default QuestionTable;