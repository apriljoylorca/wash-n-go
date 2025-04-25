import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import DriverOrderCard from '../../components/driver/DriverOrderCard';
import { database } from '../../config/firebase';
import { ref, query, orderByChild, equalTo, onValue, off, get } from 'firebase/database';
import GradientBackground from '../../components/common/GradientBackground';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { getOrdersByDriverId, updateOrderStatus } from '../../services/orderService';
import { handleFirebaseError } from '../../utils/errorHandler';
import { Colors } from '../../constants/colors';

const DriverOrdersScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const setupOrdersListener = useCallback(() => {
    if (!user) {
      setLoading(false);
      setError('User not authenticated');
      return null;
    }

    try {
      // Query for orders assigned to this driver
      const ordersRef = query(
        ref(database, 'orders'),
        orderByChild('driverId'),
        equalTo(user.uid)
      );

      // Listen for real-time updates
      const unsubscribe = onValue(ordersRef, (snapshot) => {
        const ordersData = [];
        snapshot.forEach((childSnapshot) => {
          ordersData.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });
        setOrders(ordersData);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      }, (error) => {
        const handledError = handleFirebaseError(error);
        setError(handledError.message);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    } catch (error) {
      const handledError = handleFirebaseError(error);
      setError(handledError.message);
      setLoading(false);
      setRefreshing(false);
      return null;
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = setupOrdersListener();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setupOrdersListener]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const unsubscribe = setupOrdersListener();
      if (unsubscribe) {
        unsubscribe();
      }
    } catch (error) {
      const handledError = handleFirebaseError(error);
      setError(handledError.message);
    } finally {
      setRefreshing(false);
    }
  }, [setupOrdersListener]);

  const handleOrderPress = (orderId) => {
    navigation.navigate('DriverLocation', { orderId });
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      if (!isOnline) {
        Alert.alert('Error', 'Please go online to update order status');
        return;
      }

      setLoading(true);
      await updateOrderStatus(orderId, newStatus, user);
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      const handledError = handleFirebaseError(error);
      Alert.alert('Error', handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="receipt" size={48} color={Colors.primary} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>No orders yet</Text>
      <Text style={styles.emptySubText}>You will see your assigned orders here</Text>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRefresh}
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
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          style={styles.iconButton}
        >
          <MaterialIcons name="notifications" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {orders.length > 0 ? (
          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <DriverOrderCard 
                order={item} 
                onPress={() => handleOrderPress(item.id)}
                onUpdateStatus={(status) => handleUpdateStatus(item.id, status)}
                showStatusUpdate
              />
            )}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />
        ) : renderEmptyList()}
      </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    borderRadius: 10,
    marginTop: 10,
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  emptySubText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.error,
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
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverOrdersScreen;