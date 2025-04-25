import { database } from '../config/firebase';
import { ref, set, update, get, query, orderByChild, equalTo, serverTimestamp } from 'firebase/database';
import { handleFirebaseError } from '../utils/errorHandler';

const validateUserData = (userData) => {
  const requiredFields = [
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'role'
  ];

  // Check required fields
  if (!requiredFields.every(field => userData[field] !== undefined)) {
    return false;
  }

  // Validate name fields
  if (userData.firstName.length === 0 || userData.lastName.length === 0) {
    return false;
  }

  // Validate email format
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  if (!emailRegex.test(userData.email)) {
    return false;
  }

  // Validate phone number
  if (userData.phoneNumber.length < 10) {
    return false;
  }

  // Validate role
  if (!['customer', 'driver'].includes(userData.role)) {
    return false;
  }

  // Validate address if customer
  if (userData.role === 'customer' && userData.address) {
    const addressFields = ['street', 'barangay', 'city', 'province', 'latitude', 'longitude'];
    if (!addressFields.every(field => userData.address[field] !== undefined)) {
      return false;
    }
  }

  return true;
};

const validateAddress = (addressData) => {
  const requiredFields = ['street', 'barangay', 'city', 'province', 'latitude', 'longitude'];
  for (const field of requiredFields) {
    if (!addressData[field]) {
      throw new Error(`Address ${field} is required`);
    }
  }
  if (typeof addressData.latitude !== 'number' || typeof addressData.longitude !== 'number') {
    throw new Error('Invalid coordinates');
  }
};

export const createUser = async (userData, uid) => {
  try {
    if (!uid) {
      throw new Error('User ID is required');
    }

    if (!validateUserData(userData)) {
      throw new Error('Invalid user data');
    }

    const userRef = ref(database, `users/${uid}`);
    const timestamp = Date.now();

    const newUser = {
      ...userData,
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true
    };

    await set(userRef, newUser);
    return { id: uid, ...newUser };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const updateUserProfile = async (userId, userData, currentUser) => {
  try {
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Unauthorized to update profile');
    }

    if (!validateUserData(userData)) {
      throw new Error('Invalid user data');
    }

    const userRef = ref(database, `users/${userId}`);
    await update(userRef, {
      ...userData,
      updatedAt: Date.now()
    });

    return { id: userId, ...userData };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const updateUserAddress = async (userId, addressData, currentUser) => {
  try {
    // Check if user has permission to update this address
    if (currentUser.uid !== userId) {
      throw new Error('Unauthorized address update');
    }

    // Check if user is a customer
    const userSnapshot = await get(ref(database, `users/${userId}`));
    const user = userSnapshot.val();
    if (user.role !== 'customer') {
      throw new Error('Only customers can have addresses');
    }

    validateAddress(addressData);
    
    const updates = {
      address: {
        ...addressData,
        updatedAt: Date.now()
      }
    };
    
    await update(ref(database, `users/${userId}`), updates);
    return true;
  } catch (error) {
    console.error('Error updating user address:', error);
    throw handleFirebaseError(error);
  }
};

export const updateUserLocation = async (userId, location, currentUser) => {
  try {
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Unauthorized to update location');
    }

    if (!location || typeof location.latitude !== 'number' || 
        typeof location.longitude !== 'number') {
      throw new Error('Invalid location data');
    }

    const locationRef = ref(database, `users/${userId}/location`);
    await update(locationRef, {
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: Date.now()
    });

    return { id: userId, location };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const getUserById = async (userId, currentUser) => {
  try {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Only allow access to own profile or if driver accessing customer profile
    if (currentUser.uid !== userId && 
        (currentUser.role !== 'driver' || userId === currentUser.uid)) {
      throw new Error('Unauthorized access to user data');
    }

    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      throw new Error('User not found');
    }

    return { id: userId, ...snapshot.val() };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const getDrivers = async (currentUser) => {
  try {
    // Check if user has permission to view drivers
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    const snapshot = await get(ref(database, 'users'));
    const drivers = [];
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      if (user.role === 'driver' && user.isActive) {
        drivers.push({
          id: childSnapshot.key,
          ...user
        });
      }
    });
    return drivers;
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const getUserProfile = (userId, callback) => {
  const userRef = ref(database, `users/${userId}`);
  
  const unsubscribe = onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({
        id: snapshot.key,
        ...snapshot.val()
      });
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

export const updateDriverLocation = (userId, location) => {
  return update(ref(database, `drivers/${userId}/location`), {
    ...location,
    timestamp: new Date().getTime()
  });
};

export const getUserLocation = async (userId, currentUser) => {
  try {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Only allow access to own location or if driver accessing customer location
    if (currentUser.uid !== userId && 
        (currentUser.role !== 'driver' || userId === currentUser.uid)) {
      throw new Error('Unauthorized access to location');
    }

    const locationRef = ref(database, `users/${userId}/location`);
    const snapshot = await get(locationRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val();
  } catch (error) {
    throw handleFirebaseError(error);
  }
};