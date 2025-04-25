import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const DriverEarningsCard = ({ 
  todayEarnings, 
  weeklyEarnings, 
  monthlyEarnings,
  onViewDetails 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={onViewDetails}
        >
          <Text style={styles.detailsText}>View Details</Text>
          <MaterialIcons name="chevron-right" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.earningsContainer}>
        <View style={styles.earningItem}>
          <Text style={styles.earningLabel}>Today</Text>
          <Text style={styles.earningAmount}>₱{todayEarnings.toFixed(2)}</Text>
        </View>

        <View style={styles.earningItem}>
          <Text style={styles.earningLabel}>This Week</Text>
          <Text style={styles.earningAmount}>₱{weeklyEarnings.toFixed(2)}</Text>
        </View>

        <View style={styles.earningItem}>
          <Text style={styles.earningLabel}>This Month</Text>
          <Text style={styles.earningAmount}>₱{monthlyEarnings.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 4,
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  earningLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  earningAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
});

export default DriverEarningsCard; 