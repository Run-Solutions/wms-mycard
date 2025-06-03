import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
const avatar = require('../../../assets/logos/users.webp');
/**
 * Componente de tabla dinámica en React Native.
 * Props:
 * - headers: array de objetos { key: string, label: string, width?: number } (requerido)
 * - data: array de objetos con campos correspondientes a headers.key (requerido)
 * - searchEnabled: boolean (por defecto true)
 * - searchFunction: función opcional (item, search) => boolean
 * - renderActions: función opcional (item) => ReactNode para la columna de acciones
 */
type Header = { key: string; label: string; width?: number };
type TableProps = {
  
  headers?: Header[];
  data?: Record<string, any>[];
  searchEnabled?: boolean;
  searchFunction?: (item: Record<string, any>, search: string) => boolean;
  renderActions?: (item: Record<string, any>) => React.ReactNode;
};

export default function Table({
  headers = [],
  data = [],
  searchEnabled = true,
  searchFunction,
  renderActions,
}: TableProps) {
  const [search, setSearch] = useState('');

  // Filtrado
  const filteredData = () => {
    if (!searchEnabled) return data;
    const lower = search.toLowerCase();
    return data.filter(item =>
      searchFunction
        ? searchFunction(item, search)
        : Object.values(item).some(
            val => typeof val === 'string' && val.toLowerCase().includes(lower)
          )
    );
  };
  const filtered = filteredData();

  // Renderizar header
  const renderHeader = () => (
    <View style={styles.tableHeader}>
      {headers.map(({ key, label, width }) => (
        <Text
          key={key}
          style={[styles.headerText, width ? { width } : styles.flexCell]}
        >
          {label}
        </Text>
      ))}
      {renderActions && (
        <Text style={[styles.headerText, styles.actionsCol]}>Acciones</Text>
      )}
    </View>
  );

  // Renderizar fila
  const renderItem = ({ item }:any) => (
    <View style={styles.rowContainer}>
      {headers.map(({ key, width }) => (
        key === 'profile_image' ? (
          <View
            key={key}
            style={[styles.cell, width ? { width } : styles.flexCell]}
          >
            <Image source={item[key] || avatar} style={styles.avatar} />
          </View>
        ) : (
          <Text
            key={key}
            style={[styles.cell, width ? { width } : styles.flexCell]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item[key] ?? 'N/A'}
          </Text>
        )
      ))}
      {renderActions && (
        <View style={[styles.actionsCell, styles.actionsCol]}>
          {renderActions(item)}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {searchEnabled && (
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          value={search}
          onChangeText={setSearch}
        />
      )}
      <ScrollView horizontal>
        <View>
          {renderHeader()}
          <FlatList
            data={filtered}
            keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.empty}>No hay datos</Text>}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  headerText: { fontWeight: 'bold', textAlign: 'center', padding: 8 },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  cell: { textAlign: 'center', padding: 8 },
  flexCell: { flex: 1 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  actionsCol: { width: 160 },
  actionsCell: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 20, color: '#888' },
});