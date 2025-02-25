// packages/frontend-mobile/src/screens/RecibosScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RecibosScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>RecibosScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RecibosScreen;
