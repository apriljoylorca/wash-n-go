import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { handleError, ErrorTypes } from './errorService';

const db = getFirestore();

const validateLocationData = (location) => {
  if (!location || typeof location !== 'object') {
    throw new Error('Invalid location data');
  }

  const { latitude, longitude, timestamp, accuracy, speed, heading } = location;

  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude');
  }

  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude');
  }

  if (!timestamp || typeof timestamp !== 'string') {
    throw new Error('Invalid timestamp');
  }

  if (typeof accuracy !== 'number' || accuracy < 0) {
    throw new Error('Invalid accuracy');
  }

  if (typeof speed !== 'number' || speed < 0) {
    throw new Error('Invalid speed');
  }

  if (typeof heading !== 'number' || heading < 0 || heading > 360) {
    throw new Error('Invalid heading');
  }

  return true;
};

const validateOrderStatus = (currentStatus, newStatus) => {
  const validTransitions = {
    'approved': ['picked_up'],
    'picked_up': ['washing'],
    'washing': ['drying_folding'],
    'drying_folding': ['out_for_delivery'],
    'out_for_delivery': ['delivered']
  };

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  return true;
};

export const registerDriver = async (driverData) => {
  try {
    const { uid } = getAuth().currentUser;
    if (!uid) {
      throw { type: ErrorTypes.AUTHENTICATION, message: 'User not authenticated' };
    }

    // Validate driver data
    if (!driverData.licenseNumber || !driverData.vehicleType || !driverData.vehicleNumber) {
      throw { type: ErrorTypes.VALIDATION, message: 'Missing required driver information' };
    }

    const driverRef = doc(db, 'drivers', uid);
    
    await runTransaction(db, async (transaction) => {
      const driverDoc = await transaction.get(driverRef);
      if (driverDoc.exists()) {
        throw { type: ErrorTypes.VALIDATION, message: 'Driver already registered' };
      }

      transaction.set(driverRef, {
        ...driverData,
        status: 'offline',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    return { success: true };
  } catch (error) {
    return handleError(error, 'registerDriver');
  }
};

export const getDriverProfile = async () => {
  try {
    const { uid } = getAuth().currentUser;
    if (!uid) {
      throw { type: ErrorTypes.AUTHENTICATION, message: 'User not authenticated' };
    }

    const driverRef = doc(db, 'drivers', uid);
    const driverDoc = await getDoc(driverRef);

    if (!driverDoc.exists()) {
      throw { type: ErrorTypes.VALIDATION, message: 'Driver profile not found' };
    }

    return { success: true, data: driverDoc.data() };
  } catch (error) {
    return handleError(error, 'getDriverProfile');
  }
};

export const updateDriverLocation = async (location) => {
  try {
    const { uid } = getAuth().currentUser;
    if (!uid) {
      throw { type: ErrorTypes.AUTHENTICATION, message: 'User not authenticated' };
    }

    if (!location.latitude || !location.longitude) {
      throw { type: ErrorTypes.VALIDATION, message: 'Invalid location data' };
    }

    const driverRef = doc(db, 'drivers', uid);
    
    await runTransaction(db, async (transaction) => {
      const driverDoc = await transaction.get(driverRef);
      if (!driverDoc.exists()) {
        throw { type: ErrorTypes.VALIDATION, message: 'Driver profile not found' };
      }

      transaction.update(driverRef, {
        location,
        updatedAt: new Date()
      });
    });

    return { success: true };
  } catch (error) {
    return handleError(error, 'updateDriverLocation');
  }
};

export const updateDriverStatus = async (status) => {
  try {
    const { uid } = getAuth().currentUser;
    if (!uid) {
      throw { type: ErrorTypes.AUTHENTICATION, message: 'User not authenticated' };
    }

    if (!['online', 'offline', 'busy'].includes(status)) {
      throw { type: ErrorTypes.VALIDATION, message: 'Invalid driver status' };
    }

    const driverRef = doc(db, 'drivers', uid);
    
    await runTransaction(db, async (transaction) => {
      const driverDoc = await transaction.get(driverRef);
      if (!driverDoc.exists()) {
        throw { type: ErrorTypes.VALIDATION, message: 'Driver profile not found' };
      }

      transaction.update(driverRef, {
        status,
        updatedAt: new Date()
      });
    });

    return { success: true };
  } catch (error) {
    return handleError(error, 'updateDriverStatus');
  }
};

export const getAvailableOrders = async () => {
  try {
    const { uid } = getAuth().currentUser;
    if (!uid) {
      throw { type: ErrorTypes.AUTHENTICATION, message: 'User not authenticated' };
    }

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);

    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: orders };
  } catch (error) {
    return handleError(error, 'getAvailableOrders');
  }
}; 