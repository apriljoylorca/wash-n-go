// Firebase error codes and their user-friendly messages
const FIREBASE_ERROR_MESSAGES = {
  // Authentication errors
  'auth/invalid-email': 'The email address is invalid.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'The password is incorrect.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/weak-password': 'The password is too weak.',
  'auth/operation-not-allowed': 'This operation is not allowed.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  
  // Database errors
  'permission-denied': 'You do not have permission to perform this action.',
  'unavailable': 'The service is currently unavailable. Please try again later.',
  'data-stale': 'The data is out of date. Please refresh and try again.',
  'expired-token': 'Your session has expired. Please log in again.',
  'invalid-token': 'Invalid session. Please log in again.',
  'max-retries': 'Operation failed after multiple attempts. Please try again.',
  'overridden-by-set': 'The data was modified by another user. Please refresh and try again.',
  'transaction-failed': 'The operation could not be completed. Please try again.',
  'write-canceled': 'The operation was canceled. Please try again.',
  
  // Custom errors
  'invalid-order-data': 'The order data is invalid. Please check all fields.',
  'service-unavailable': 'The service is currently unavailable.',
  'too-many-orders': 'You have too many active orders. Please complete or cancel some orders first.',
  'unauthorized': 'You are not authorized to perform this action.',
  'validation-failed': 'The data validation failed. Please check your input.',
};

// Common error types
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  DATABASE: 'DATABASE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Error handling function
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);

  // Handle Firebase errors
  if (error.code) {
    return handleFirebaseError(error);
  }

  // Handle network errors
  if (error.message?.includes('Network request failed')) {
    return {
      type: ErrorTypes.NETWORK,
      message: 'Network connection error. Please check your internet connection.',
      originalError: error
    };
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return {
      type: ErrorTypes.VALIDATION,
      message: error.message,
      originalError: error
    };
  }

  // Default error
  return {
    type: ErrorTypes.UNKNOWN,
    message: 'An unexpected error occurred. Please try again later.',
    originalError: error
  };
};

// Firebase specific error handling
const handleFirebaseError = (error) => {
  switch (error.code) {
    case 'auth/invalid-email':
      return {
        type: ErrorTypes.VALIDATION,
        message: 'Invalid email address format.',
        originalError: error
      };
    case 'auth/user-disabled':
      return {
        type: ErrorTypes.AUTHENTICATION,
        message: 'This account has been disabled.',
        originalError: error
      };
    case 'auth/user-not-found':
      return {
        type: ErrorTypes.AUTHENTICATION,
        message: 'No account found with this email.',
        originalError: error
      };
    case 'auth/wrong-password':
      return {
        type: ErrorTypes.AUTHENTICATION,
        message: 'Incorrect password.',
        originalError: error
      };
    case 'auth/email-already-in-use':
      return {
        type: ErrorTypes.VALIDATION,
        message: 'This email is already registered.',
        originalError: error
      };
    case 'auth/weak-password':
      return {
        type: ErrorTypes.VALIDATION,
        message: 'Password should be at least 6 characters.',
        originalError: error
      };
    case 'auth/operation-not-allowed':
      return {
        type: ErrorTypes.AUTHORIZATION,
        message: 'This operation is not allowed.',
        originalError: error
      };
    case 'auth/network-request-failed':
      return {
        type: ErrorTypes.NETWORK,
        message: 'Network connection error. Please check your internet connection.',
        originalError: error
      };
    default:
      return {
        type: ErrorTypes.UNKNOWN,
        message: 'An unexpected error occurred. Please try again later.',
        originalError: error
      };
  }
};

// Validate order data
export const validateOrderData = (orderData) => {
  const requiredFields = [
    'customerId',
    'serviceId',
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
  const missingFields = requiredFields.filter(field => !orderData[field]);
  if (missingFields.length > 0) {
    throw {
      code: 'validation-failed',
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate addresses
  const addressFields = ['street', 'barangay', 'city', 'province'];
  const invalidPickupAddress = addressFields.filter(field => !orderData.pickupAddress[field]);
  const invalidDeliveryAddress = addressFields.filter(field => !orderData.deliveryAddress[field]);

  if (invalidPickupAddress.length > 0 || invalidDeliveryAddress.length > 0) {
    throw {
      code: 'validation-failed',
      message: `Invalid address data. Please check pickup and delivery addresses.`
    };
  }

  // Validate timestamps
  const now = Date.now();
  if (orderData.pickupSchedule < now || orderData.deliverySchedule < now) {
    throw {
      code: 'validation-failed',
      message: 'Invalid schedule. Please select future dates.'
    };
  }

  // Validate payment
  if (!['cod', 'cop'].includes(orderData.paymentMethod)) {
    throw {
      code: 'validation-failed',
      message: 'Invalid payment method.'
    };
  }

  // Validate amounts
  if (orderData.subtotal <= 0 || orderData.deliveryFee < 0 || orderData.total <= 0) {
    throw {
      code: 'validation-failed',
      message: 'Invalid order amounts.'
    };
  }

  return true;
};

// Validation helper functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Error boundary component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Something went wrong. Please try again later.
          </Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20
  }
}); 