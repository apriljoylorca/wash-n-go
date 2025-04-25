import React, { createContext, useContext, useState, useEffect } from 'react';
import { database } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from './AuthContext';
import { handleFirebaseError } from '../utils/errorHandler';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const ordersRef = ref(database, 'orders');
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      try {
        const ordersData = [];
        snapshot.forEach((childSnapshot) => {
          ordersData.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setOrders(ordersData);
        setError(null);
      } catch (error) {
        const handledError = handleFirebaseError(error);
        setError(handledError.message);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      const handledError = handleFirebaseError(error);
      setError(handledError.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getCustomerOrders = () => {
    if (!user || user.role !== 'customer') {
      return [];
    }
    return orders.filter(order => order.customerId === user.uid);
  };

  const getDriverOrders = () => {
    if (!user || user.role !== 'driver') {
      return [];
    }
    return orders.filter(order => order.driverId === user.uid);
  };

  const getAvailableOrders = () => {
    if (!user || user.role !== 'driver') {
      return [];
    }
    return orders.filter(order => 
      order.status === 'approved' && !order.driverId
    );
  };

  const getUnassignedOrders = () => {
    if (!user || user.role !== 'driver') {
      return [];
    }
    return orders.filter(order => 
      (order.status === 'approved' || order.status === 'pending') && !order.driverId
    );
  };

  const getOrderById = (orderId) => {
    const order = orders.find(order => order.id === orderId);
    if (!order) return null;
    
    // Check if user has permission to view this order
    if (user.role === 'customer' && order.customerId !== user.uid) {
      return null;
    }
    if (user.role === 'driver' && order.driverId !== user.uid) {
      return null;
    }
    
    return order;
  };

  return (
    <OrderContext.Provider value={{ 
      orders,
      loading,
      error,
      getCustomerOrders,
      getDriverOrders,
      getAvailableOrders,
      getUnassignedOrders,
      getOrderById
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};