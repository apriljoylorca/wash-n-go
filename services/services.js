import { database } from '../config/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { handleFirebaseError } from '../utils/errorHandler';
import {
  SERVICE_FIELDS,
  REQUIRED_SERVICE_FIELDS,
  PRICE_BY_WEIGHT_FIELDS,
  SERVICE_STATUS,
  PRICING_TYPES
} from '../constants/services';

// Validate service data
const validateServiceData = (serviceData) => {
  // Check required fields
  if (!REQUIRED_SERVICE_FIELDS.every(field => serviceData[field] !== undefined)) {
    return false;
  }

  // Validate name and description
  if (serviceData[SERVICE_FIELDS.NAME].length === 0 || 
      serviceData[SERVICE_FIELDS.DESCRIPTION].length === 0) {
    return false;
  }

  // Validate isActive
  if (typeof serviceData[SERVICE_FIELDS.IS_ACTIVE] !== 'boolean') {
    return false;
  }

  // Validate pricing
  const hasPriceByWeight = serviceData[SERVICE_FIELDS.PRICE_BY_WEIGHT] && 
    PRICE_BY_WEIGHT_FIELDS.every(weight => 
      typeof serviceData[SERVICE_FIELDS.PRICE_BY_WEIGHT][weight] === 'number' &&
      serviceData[SERVICE_FIELDS.PRICE_BY_WEIGHT][weight] > 0
    );

  const hasPricePerPiece = serviceData[SERVICE_FIELDS.PRICE_PER_PIECE] && 
    typeof serviceData[SERVICE_FIELDS.PRICE_PER_PIECE] === 'number' &&
    serviceData[SERVICE_FIELDS.PRICE_PER_PIECE] > 0;

  if (!hasPriceByWeight && !hasPricePerPiece) {
    return false;
  }

  return true;
};

// Get all active services
export const getActiveServices = async (currentUser) => {
  try {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const servicesRef = ref(database, 'services');
    const servicesQuery = query(
      servicesRef,
      orderByChild(SERVICE_FIELDS.IS_ACTIVE),
      equalTo(SERVICE_STATUS.ACTIVE)
    );

    const snapshot = await get(servicesQuery);
    if (!snapshot.exists()) {
      return [];
    }

    const services = [];
    snapshot.forEach((childSnapshot) => {
      services.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    return services;
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

// Get service by ID
export const getServiceById = async (serviceId, currentUser) => {
  try {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const serviceRef = ref(database, `services/${serviceId}`);
    const snapshot = await get(serviceRef);

    if (!snapshot.exists()) {
      throw new Error('Service not found');
    }

    const service = snapshot.val();
    if (!service[SERVICE_FIELDS.IS_ACTIVE]) {
      throw new Error('Service is not active');
    }

    return { id: serviceId, ...service };
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

// Calculate service price
export const calculateServicePrice = async (serviceId, weightOrQuantity, currentUser) => {
  try {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const service = await getServiceById(serviceId, currentUser);

    if (service[SERVICE_FIELDS.PRICE_BY_WEIGHT]) {
      // Find the appropriate weight bracket
      const weights = PRICE_BY_WEIGHT_FIELDS
        .map(w => parseInt(w.replace('kg', '')))
        .sort((a, b) => a - b);

      let selectedWeight = weights[0];
      for (const w of weights) {
        if (weightOrQuantity <= w) {
          selectedWeight = w;
          break;
        }
      }

      return service[SERVICE_FIELDS.PRICE_BY_WEIGHT][`${selectedWeight}kg`];
    } else if (service[SERVICE_FIELDS.PRICE_PER_PIECE]) {
      return service[SERVICE_FIELDS.PRICE_PER_PIECE] * weightOrQuantity;
    }

    throw new Error('Invalid service pricing');
  } catch (error) {
    throw handleFirebaseError(error);
  }
}; 