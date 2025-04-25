import { database } from '../config/firebase';
import { ref, set, update, get, query, orderByChild, equalTo, push, serverTimestamp } from 'firebase/database';
import { handleFirebaseError } from '../utils/errorHandler';

// Validate order status transitions
const validateOrderStatus = (currentStatus, newStatus, userRole) => {
  const validTransitions = {
    customer: {
      'pending': ['cancelled'],
      'approved': ['cancelled'],
      'delivered': ['customerRating']
    },
    driver: {
      'approved': ['picked_up'],
      'picked_up': ['washing'],
      'washing': ['drying_folding'],
      'drying_folding': ['out_for_delivery'],
      'out_for_delivery': ['delivered']
    }
  };

  return validTransitions[userRole]?.[currentStatus]?.includes(newStatus) || false;
};

// Validate order data
const validateOrderData = (orderData) => {
  const requiredFields = [
    'customerId',
    'items',
    'pickupAddress',
    'deliveryAddress',
    'pickupSchedule',
    'deliverySchedule',
    'subtotal',
    'deliveryFee',
    'total',
    'paymentMethod',
    'paymentStatus'
  ];

  // Check required fields
  if (!requiredFields.every(field => orderData[field] !== undefined)) {
    return false;
  }

  // Validate addresses
  const addressFields = ['street', 'barangay', 'city', 'province', 'latitude', 'longitude'];
  if (!addressFields.every(field => orderData.pickupAddress[field] !== undefined) ||
      !addressFields.every(field => orderData.deliveryAddress[field] !== undefined)) {
    return false;
  }

  // Validate timestamps
  const now = Date.now();
  if (orderData.pickupSchedule < now || orderData.deliverySchedule < now) {
    return false;
  }

  // Validate payment
  if (!['cod', 'cop'].includes(orderData.paymentMethod) ||
      !['pending', 'paid'].includes(orderData.paymentStatus)) {
    return false;
  }

  // Validate amounts
  if (orderData.subtotal <= 0 || orderData.deliveryFee < 0 || orderData.total <= 0) {
    return false;
  }

  return true;
};

// Create a new order
export const createOrder = async (orderData, currentUser) => {
  try {
    if (!currentUser || currentUser.role !== 'customer') {
      throw new Error('Only customers can create orders');
    }

    // Validate order data
    if (!validateOrderData(orderData)) {
      throw new Error('Invalid order data. Please check all required fields.');
    }

    // Check if service is available
    const serviceRef = ref(database, `services/${orderData.serviceId}`);
    const serviceSnapshot = await get(serviceRef);
    
    if (!serviceSnapshot.exists()) {
      throw new Error('Selected service is no longer available');
    }

    const service = serviceSnapshot.val();
    if (!service.isActive) {
      throw new Error('Selected service is currently unavailable');
    }

    // Check for concurrent orders
    const ordersRef = ref(database, 'orders');
    const ordersQuery = query(
      ordersRef,
      orderByChild('customerId'),
      equalTo(currentUser.uid)
    );

    const ordersSnapshot = await get(ordersQuery);
    if (ordersSnapshot.exists()) {
      const orders = [];
      ordersSnapshot.forEach((childSnapshot) => {
        const order = childSnapshot.val();
        if (order.status === 'pending' || order.status === 'approved') {
          orders.push(order);
        }
      });

      if (orders.length >= 5) {
        throw new Error('You have too many active orders. Please complete or cancel some orders before creating a new one.');
      }
    }

    // Create order with transaction
    const orderRef = push(ref(database, 'orders'));
    const timestamp = Date.now();

    const newOrder = {
      ...orderData,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1 // Add version for optimistic concurrency control
    };

    await set(orderRef, newOrder);

    // Update service statistics
    const serviceStatsRef = ref(database, `services/${orderData.serviceId}/stats`);
    await update(serviceStatsRef, {
      totalOrders: serverTimestamp(),
      lastOrderAt: timestamp
    });

    return { id: orderRef.key, ...newOrder };
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw handleFirebaseError(error);
  }
};

// Get orders for a customer
export const getOrdersByCustomerId = async (customerId, currentUser) => {
  try {
    if (!currentUser || currentUser.role !== 'customer' || currentUser.uid !== customerId) {
      throw new Error('Unauthorized access to orders');
    }

    const ordersRef = ref(database, 'orders');
    const ordersQuery = query(
      ordersRef,
      orderByChild('customerId'),
      equalTo(customerId)
    );

    const snapshot = await get(ordersQuery);
    if (!snapshot.exists()) {
      return [];
    }

    const orders = [];
    snapshot.forEach((childSnapshot) => {
      orders.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    return orders.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw handleFirebaseError(error);
  }
};

// Get orders for a driver
export const getOrdersByDriverId = async (driverId, currentUser) => {
  try {
    if (!currentUser || currentUser.role !== 'driver' || currentUser.uid !== driverId) {
      throw new Error('Unauthorized access to orders');
    }

    const ordersRef = ref(database, 'orders');
    const ordersQuery = query(
      ordersRef,
      orderByChild('driverId'),
      equalTo(driverId)
    );

    const snapshot = await get(ordersQuery);
    if (!snapshot.exists()) {
      return [];
    }

    const orders = [];
    snapshot.forEach((childSnapshot) => {
      orders.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    return orders.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

// Get available orders for drivers
export const getAvailableOrders = async (currentUser) => {
  try {
    if (!currentUser || currentUser.role !== 'driver') {
      throw new Error('Only drivers can view available orders');
    }

    const ordersRef = ref(database, 'orders');
    const ordersQuery = query(
      ordersRef,
      orderByChild('status'),
      equalTo('approved')
    );

    const snapshot = await get(ordersQuery);
    if (!snapshot.exists()) {
      return [];
    }

    const orders = [];
    snapshot.forEach((childSnapshot) => {
      const order = childSnapshot.val();
      if (!order.driverId) {
        orders.push({
          id: childSnapshot.key,
          ...order
        });
      }
    });

    return orders.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

// Update order status
export const updateOrderStatus = async (orderId, newStatus, currentUser) => {
  try {
    if (!currentUser) {
      throw new Error('User must be authenticated to update order status');
    }

    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error('Order not found');
    }

    const order = orderSnapshot.val();
    const userRole = currentUser.role;

    // Check authorization
    if (userRole === 'customer' && order.customerId !== currentUser.uid) {
      throw new Error('Unauthorized to update this order');
    }
    if (userRole === 'driver' && order.driverId !== currentUser.uid) {
      throw new Error('Unauthorized to update this order');
    }

    // Validate status transition
    if (!validateOrderStatus(order.status, newStatus, userRole)) {
      throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
    }

    await update(orderRef, {
      status: newStatus,
      updatedAt: Date.now()
    });

    return { id: orderId, ...order, status: newStatus };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

// Assign driver to order
export const assignDriverToOrder = async (orderId, driverId, currentUser) => {
  try {
    if (!currentUser || currentUser.uid !== driverId) {
      throw new Error('Unauthorized to assign driver');
    }

    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error('Order not found');
    }

    const order = orderSnapshot.val();

    if (order.status !== 'approved' && order.status !== 'pending') {
      throw new Error('Can only assign driver to pending or approved orders');
    }

    if (order.driverId) {
      throw new Error('Order already has a driver assigned');
    }

    await update(orderRef, {
      driverId: driverId,
      status: 'approved',
      updatedAt: serverTimestamp()
    });

    return { id: orderId, ...order, driverId, status: 'approved' };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

// Submit customer rating
export const submitCustomerRating = async (orderId, rating, comment, currentUser) => {
  try {
    if (!currentUser) {
      throw new Error('User must be authenticated to submit rating');
    }

    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error('Order not found');
    }

    const order = orderSnapshot.val();

    if (order.customerId !== currentUser.uid) {
      throw new Error('Unauthorized to submit rating for this order');
    }

    if (order.status !== 'delivered') {
      throw new Error('Can only rate delivered orders');
    }

    await update(orderRef, {
      customerRating: {
        rating,
        comment,
        createdAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    return { id: orderId, ...order, customerRating: { rating, comment } };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

// Submit driver rating
export const submitDriverRating = async (orderId, rating, comment, currentUser) => {
  try {
    if (!currentUser) {
      throw new Error('User must be authenticated to submit rating');
    }

    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error('Order not found');
    }

    const order = orderSnapshot.val();

    if (order.driverId !== currentUser.uid) {
      throw new Error('Unauthorized to submit rating for this order');
    }

    if (order.status !== 'delivered') {
      throw new Error('Can only rate delivered orders');
    }

    await update(orderRef, {
      driverRating: {
        rating,
        comment,
        createdAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    return { id: orderId, ...order, driverRating: { rating, comment } };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const updateOrderLocation = async (orderId, location) => {
  try {
    const timestamp = Date.now();
    await update(ref(database, `orders/${orderId}/driverLocation`), {
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: timestamp
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const getOrderById = async (orderId, currentUser) => {
  try {
    if (!currentUser) {
      throw new Error('User must be authenticated to fetch order');
    }

    const orderRef = ref(database, `orders/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (!snapshot.exists()) {
      throw new Error('Order not found');
    }

    const order = snapshot.val();
    if (order.customerId !== currentUser.uid && order.driverId !== currentUser.uid) {
      throw new Error('Unauthorized access to order');
    }

    return {
      id: snapshot.key,
      ...order
    };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const fetchCustomerOrders = async (customerId, status = null) => {
  try {
    console.log('Fetching orders for customer:', customerId);
    
    const ordersRef = ref(database, 'orders');
    const ordersQuery = query(
      ordersRef,
      orderByChild('customerId'),
      equalTo(customerId)
    );

    console.log('Executing query...');
    const snapshot = await get(ordersQuery);
    
    if (!snapshot.exists()) {
      console.log('No orders found for customer:', customerId);
      return [];
    }

    console.log('Orders found:', snapshot.val());
    const orders = [];
    snapshot.forEach((childSnapshot) => {
      const order = {
        id: childSnapshot.key,
        ...childSnapshot.val()
      };
      
      // Convert timestamps to Date objects
      if (order.pickupSchedule) {
        order.pickupSchedule = new Date(order.pickupSchedule);
      }
      if (order.deliverySchedule) {
        order.deliverySchedule = new Date(order.deliverySchedule);
      }
      if (order.createdAt) {
        order.createdAt = new Date(order.createdAt);
      }
      if (order.updatedAt) {
        order.updatedAt = new Date(order.updatedAt);
      }

      // Filter by status if provided
      if (!status || order.status === status) {
        orders.push(order);
      }
    });

    console.log('Processed orders:', orders);
    // Sort orders by creation date (newest first)
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    throw error;
  }
};