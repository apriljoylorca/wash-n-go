import { database } from '../config/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { handleFirebaseError } from '../utils/errorHandler';

// Validate service data
const validateServiceData = (serviceData) => {
  const requiredFields = [
    'name',
    'description',
    'isActive'
  ];

  // Check required fields
  if (!requiredFields.every(field => serviceData[field] !== undefined)) {
    return false;
  }

  // Validate name and description
  if (serviceData.name.length === 0 || serviceData.description.length === 0) {
    return false;
  }

  // Validate isActive
  if (typeof serviceData.isActive !== 'boolean') {
    return false;
  }

  // Validate pricing
  const hasPriceByWeight = serviceData.priceByWeight && 
    Object.keys(serviceData.priceByWeight).every(weight => 
      ['5kg', '8kg', '10kg', '12kg', '15kg'].includes(weight) &&
      typeof serviceData.priceByWeight[weight] === 'number' &&
      serviceData.priceByWeight[weight] > 0
    );

  const hasPricePerPiece = serviceData.pricePerPiece && 
    typeof serviceData.pricePerPiece === 'number' &&
    serviceData.pricePerPiece > 0;

  if (!hasPriceByWeight && !hasPricePerPiece) {
    return false;
  }

  return true;
};

// Get all active services
export const getActiveServices = async () => {
  try {
    const servicesRef = ref(database, 'services');
    const snapshot = await get(servicesRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const services = [];
    snapshot.forEach((childSnapshot) => {
      const service = childSnapshot.val();
      if (service.isActive) {
        services.push({
          id: childSnapshot.key,
          ...service
        });
      }
    });

    return services;
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

// Get service by ID
export const getServiceById = async (serviceId) => {
  try {
    const serviceRef = ref(database, `services/${serviceId}`);
    const snapshot = await get(serviceRef);

    if (!snapshot.exists()) {
      throw new Error('Service not found');
    }

    const service = snapshot.val();
    if (!service.isActive) {
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

    if (service.priceByWeight) {
      // Find the appropriate weight bracket
      const weights = Object.keys(service.priceByWeight)
        .map(w => parseInt(w.replace('kg', '')))
        .sort((a, b) => a - b);

      let selectedWeight = weights[0];
      for (const w of weights) {
        if (weightOrQuantity <= w) {
          selectedWeight = w;
          break;
        }
      }

      return service.priceByWeight[`${selectedWeight}kg`];
    } else if (service.pricePerPiece) {
      return service.pricePerPiece * weightOrQuantity;
    }

    throw new Error('Invalid service pricing');
  } catch (error) {
    throw handleFirebaseError(error);
  }
}; 