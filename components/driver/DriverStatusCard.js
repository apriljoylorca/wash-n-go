import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const DriverStatusCard = ({ 
  status, 
  totalDeliveries, 
  rating, 
  onStatusPress,
  onStatsPress 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'busy':
        return '#FFC107';
      case 'inactive':
        return '#F44336';
      default:
        return Colors.primary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'Available';
      case 'busy':
        return 'On Delivery';
      case 'inactive':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.statusSection, { backgroundColor: getStatusColor() }]}
        onPress={onStatusPress}
      >
        <MaterialIcons name="circle" size={12} color="#fff" style={styles.statusIcon} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => onStatsPress('deliveries')}
        >
          <MaterialIcons name="local-shipping" size={24} color={Colors.primary} />
          <Text style={styles.statNumber}>{totalDeliveries}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => onStatsPress('rating')}
        >
          <MaterialIcons name="star" size={24} color={Colors.primary} />
          <Text style={styles.statNumber}>{rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </TouchableOpacity>
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
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default DriverStatusCard; 