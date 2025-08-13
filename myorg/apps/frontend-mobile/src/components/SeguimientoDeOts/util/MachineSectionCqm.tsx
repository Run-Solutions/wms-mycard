// MachineSection.tsx (versión React Native)
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';

interface MachineSectionProps {
  machine: string;
  visible: boolean;
  questions: any[];
  areaId: number;
  roleId: number | null;
  questionSlice?: [number, number];
  extras?: React.ReactNode;
  title?: string;
  answers: { question_id: number; response_cqm: any }[];
}

export function MachineSectionCqm({
  visible,
  questions,
  areaId,
  roleId,
  questionSlice,
  extras,
  title,
  answers,
}: MachineSectionProps) {
  if (!visible) return null;

  const filteredQuestions = (
    questionSlice
      ? questions.slice(questionSlice[0], questionSlice[1])
      : questions
  ).filter((q) => q.role_id === roleId);

  return (
    <View style={{ marginBottom: 20 }}>
      {title && <Text style={styles.title}>{title}</Text>}

      <ScrollView horizontal>
        <View style={styles.table}>
          {/* Encabezado */}
          <View style={[styles.row, styles.header]}>
            <Text
              style={[
                styles.cell,
                styles.headerText,
                { flex: 2, minWidth: 500 },
              ]}
            >
              Pregunta
            </Text>
            <Text
              style={[
                styles.cell,
                styles.headerText,
                { flex: 1, textAlign: 'center' },
              ]}
            >
              Respuesta
            </Text>
          </View>

          {/* Filas */}
          {filteredQuestions.map((q) => {
            const answer = answers.find((a) => a.question_id === q.id);
            const operatorResponse = answer?.response_cqm;

            return (
              <View key={q.id} style={styles.row}>
                <Text style={[styles.cell, { flex: 1, minWidth: 500 }]}>
                  {q.title}
                </Text>
                <View style={[styles.cell, { flex: 1, alignItems: 'center' }]}>
                  {typeof operatorResponse === 'boolean' ? (
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radioOuter,
                          operatorResponse && styles.radioOuterActive,
                        ]}
                      >
                        {operatorResponse && <View style={styles.radioDot} />}
                      </View>
                    </View>
                  ) : (
                    <Text>
                      {operatorResponse !== undefined &&
                      operatorResponse !== null
                        ? operatorResponse.toString()
                        : ''}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {extras}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
    fontWeight: '600',
    fontSize: 18,
    color: '#000',
  },
  table: {
    padding: 5,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    borderColor: '#e5e7eb',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: 1,
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#f3f4f6',
  },
  headerText: {
    fontWeight: '600',
    color: '#374151',
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#2563eb',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
});
