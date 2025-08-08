import {
    View,
    Text,
    StyleSheet,
  } from 'react-native';
  
  const InfoCard = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.cardItem}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
  
  const styles = StyleSheet.create({
    cardItem: {
        marginBottom: 12,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      },
      cardLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
      },
      cardValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1f2937',
      },
  });
  
  export default InfoCard;