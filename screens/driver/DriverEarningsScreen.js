import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../config/firebase';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import GradientBackground from '../../components/common/GradientBackground';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { Colors } from '../../constants/colors';

const DriverEarningsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({
    today: 0,
    weekly: 0,
    monthly: 0,
    history: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    try {
      const ordersRef = ref(database, 'orders');
      const driverQuery = query(
        ordersRef,
        orderByChild('driverId'),
        equalTo(user.uid)
      );

      const unsubscribe = onValue(driverQuery, (snapshot) => {
        const orders = [];
        let todayTotal = 0;
        let weeklyTotal = 0;
        let monthlyTotal = 0;

        snapshot.forEach(child => {
          const order = { id: child.key, ...child.val() };
          if (order.status === 'delivered') {
            const orderDate = new Date(order.updatedAt);
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

            if (orderDate.toDateString() === today.toDateString()) {
              todayTotal += order.total || 0;
            }
            if (orderDate >= weekAgo) {
              weeklyTotal += order.total || 0;
            }
            if (orderDate >= monthAgo) {
              monthlyTotal += order.total || 0;
            }

            orders.push(order);
          }
        });

        setEarnings({
          today: todayTotal,
          weekly: weeklyTotal,
          monthly: monthlyTotal,
          history: orders.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        });
        setLoading(false);
      }, (error) => {
        console.error('Error fetching earnings:', error);
        setError('Failed to load earnings data');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error in useEffect:', error);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }, [user]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              setEarnings({ today: 0, weekly: 0, monthly: 0, history: [] });
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingContainer}>
          <LoadingIndicator />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Today</Text>
            <Text style={styles.summaryAmount}>₱{earnings.today.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>This Week</Text>
            <Text style={styles.summaryAmount}>₱{earnings.weekly.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryAmount}>₱{earnings.monthly.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Earnings History</Text>
        {earnings.history.map(order => (
          <View key={order.id} style={styles.historyItem}>
            <View style={styles.historyInfo}>
              <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.orderAmount}>₱{order.total.toFixed(2)}</Text>
          </View>
        ))}

        {earnings.history.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No earnings history yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.primary,
    fontSize: 16,
    marginTop: 10,
  },
});

export default DriverEarningsScreen; 