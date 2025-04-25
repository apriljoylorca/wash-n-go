export const validateRegistration = (formData) => {
    const errors = {};
    
    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid Philippine mobile number (e.g., 09123456789)';
    }
    
    if (!formData.address?.street) errors['address.street'] = 'Street address is required';
    if (!formData.address?.barangay) errors['address.barangay'] = 'Barangay is required';
    if (!formData.address?.city) errors['address.city'] = 'City/Municipality is required';
    if (!formData.address?.province) errors['address.province'] = 'Province is required';
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };
  
  export const validateOrder = (orderData) => {
    const errors = {};
    
    if (!orderData.services || orderData.services.length === 0) {
      errors.services = 'Please select at least one service';
    }
    
    if (!orderData.address) {
      errors.address = 'Please provide a delivery address';
    }
    
    if (!orderData.scheduledDate) {
      errors.scheduledDate = 'Please select a pickup date';
    }
    
    return errors;
  };

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validatePhoneNumber = (phone) => {
  return /^09\d{9}$/.test(phone.trim());
};

export const validateUserData = (userData) => {
  const errors = {};

  if (!userData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!userData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }

  if (!userData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(userData.email)) {
    errors.email = 'Please enter a valid email';
  }

  if (!userData.phoneNumber?.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!validatePhoneNumber(userData.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid Philippine mobile number';
  }

  if (!['customer', 'driver'].includes(userData.role)) {
    errors.role = 'Invalid role';
  }

  return errors;
};

export const validateAddress = (address) => {
  const errors = {};

  if (!address.street?.trim()) {
    errors.street = 'Street address is required';
  }

  if (!address.barangay?.trim()) {
    errors.barangay = 'Barangay is required';
  }

  if (!address.city?.trim()) {
    errors.city = 'City/Municipality is required';
  }

  if (!address.province?.trim()) {
    errors.province = 'Province is required';
  }

  if (typeof address.latitude !== 'number' || typeof address.longitude !== 'number') {
    errors.location = 'Invalid location coordinates';
  }

  return errors;
};

export const validateOrderData = (orderData) => {
  const errors = {};

  if (!orderData.customerId) {
    errors.customerId = 'Customer ID is required';
  }

  if (!orderData.items || Object.keys(orderData.items).length === 0) {
    errors.items = 'At least one item is required';
  } else {
    Object.entries(orderData.items).forEach(([key, item]) => {
      if (!item.serviceId) {
        errors[`items.${key}.serviceId`] = 'Service ID is required';
      }
      if (!item.serviceName) {
        errors[`items.${key}.serviceName`] = 'Service name is required';
      }
      if (typeof item.price !== 'number') {
        errors[`items.${key}.price`] = 'Price must be a number';
      }
    });
  }

  if (!orderData.pickupAddress) {
    errors.pickupAddress = 'Pickup address is required';
  } else {
    const addressErrors = validateAddress(orderData.pickupAddress);
    Object.entries(addressErrors).forEach(([key, error]) => {
      errors[`pickupAddress.${key}`] = error;
    });
  }

  if (!orderData.deliveryAddress) {
    errors.deliveryAddress = 'Delivery address is required';
  } else {
    const addressErrors = validateAddress(orderData.deliveryAddress);
    Object.entries(addressErrors).forEach(([key, error]) => {
      errors[`deliveryAddress.${key}`] = error;
    });
  }

  if (!orderData.pickupSchedule) {
    errors.pickupSchedule = 'Pickup schedule is required';
  }

  if (!orderData.deliverySchedule) {
    errors.deliverySchedule = 'Delivery schedule is required';
  }

  if (typeof orderData.subtotal !== 'number') {
    errors.subtotal = 'Subtotal must be a number';
  }

  if (typeof orderData.deliveryFee !== 'number') {
    errors.deliveryFee = 'Delivery fee must be a number';
  }

  if (typeof orderData.total !== 'number') {
    errors.total = 'Total must be a number';
  }

  if (!['cod', 'gcash', 'card'].includes(orderData.paymentMethod)) {
    errors.paymentMethod = 'Invalid payment method';
  }

  if (!['pending', 'paid', 'failed'].includes(orderData.paymentStatus)) {
    errors.paymentStatus = 'Invalid payment status';
  }

  return errors;
};

export const validateRating = (rating, comment) => {
  const errors = {};

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    errors.rating = 'Rating must be between 1 and 5';
  }

  if (typeof comment !== 'string' || comment.trim().length === 0) {
    errors.comment = 'Comment is required';
  }

  return errors;
};