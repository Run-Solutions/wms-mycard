import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';

type Option = { label: string; value: string, component?: React.ReactNode };

export interface DropdownProps {
  label: string;
  options: Option[];
  selectedValue: string | null;
  onSelect?: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect
}) => {
  const [visible, setVisible] = useState(false);
  const selectedLabel =
    options.find(opt => opt.value === selectedValue)?.label || label;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.buttonText}>{selectedLabel}</Text>
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <FlatList
                data={options}
                keyExtractor={item => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      if (!item.component) {
                        onSelect?.(item.value);
                        setVisible(false);
                      }
                    }}
                    activeOpacity={item.component ? 1 : 0.7}
                  >
                    <Text style={styles.optionText}>{item.label}</Text>
                    {item.component ? (
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {item.component}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 12, minWidth: 30 },
  button: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 6,
    backgroundColor: '#fff',
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, color: '#333' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modal: { backgroundColor: '#fff', borderRadius: 8, maxHeight: 300 },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: { fontSize: 16 },
});

export default Dropdown;