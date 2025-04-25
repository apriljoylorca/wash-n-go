import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import OrderCard from '../../components/customer/OrderCard';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { database } from '../../config/firebase';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByCustomerId } from '../../services/orderService';
import { handleFirebaseError } from '../../utils/errorHandler';
import { Colors } from '../../constants/colors';

const OrdersScreen = ({ navigation }) => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to view orders');
      }
      
      const userOrders = await getOrdersByCustomerId(user.uid, user);
      setOrders(userOrders);
      setError(null);
    } catch (error) {
      const handledError = handleFirebaseError(error);
      setError(handledError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <LoadingIndicator message="Loading..." />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view your orders</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingIndicator message="Loading orders..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          style={styles.iconButton}
        >
          <MaterialIcons name="notifications" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No orders found</Text>
          <TouchableOpacity
            style={styles.newOrderButton}
            onPress={() => navigation.navigate('CustomerOrderBooking')}
          >
            <Text style={styles.newOrderButtonText}>Place New Order</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard 
              order={item} 
              onPress={() => navigation.navigate('CustomerTrackOrder', { orderId: item.id })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {orders.length > 0 && (
        <TouchableOpacity
          style={styles.newOrderButton}
          onPress={() => navigation.navigate('CustomerOrderBooking')}
        >
          <MaterialIcons name="add" size={24} color={Colors.white} />
          <Text style={styles.newOrderButtonText}>Place New Order</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  iconButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  newOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  newOrderButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default OrdersScreen;