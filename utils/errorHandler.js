export const ErrorTypes = {
  AUTHENTICATION: 'authentication',
  VALIDATION: 'validation',
  NETWORK: 'network',
  DATABASE: 'database',
  UNKNOWN: 'unknown'
};

export const handleError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  
  if (error.type) {
    return {
      success: false,
      error: {
        type: error.type,
        message: error.message || 'An error occurred'
      }
    };
  }

  return {
    success: false,
    error: {
      type: ErrorTypes.UNKNOWN,
      message: error.message || 'An unexpected error occurred'
    }
  };
};

export const handleFirebaseError = (error) => {
  let errorMessage = 'An error occurred. Please try again.';
  
  switch (error.code) {
    // Authentication Errors
    case 'auth/invalid-email':
      errorMessage = 'The email address is invalid.';
      break;
    case 'auth/user-disabled':
      errorMessage = 'This account has been disabled.';
      break;
    case 'auth/user-not-found':
      errorMessage = 'No account found with this email.';
      break;
    case 'auth/wrong-password':
      errorMessage = 'Incorrect password.';
      break;
    case 'auth/email-already-in-use':
      errorMessage = 'This email is already registered.';
      break;
    case 'auth/weak-password':
      errorMessage = 'The password is too weak.';
      break;
    case 'auth/operation-not-allowed':
      errorMessage = 'This operation is not allowed.';
      break;
    
    // Database Errors
    case 'permission-denied':
      errorMessage = 'You do not have permission to perform this action.';
      break;
    case 'unavailable':
      errorMessage = 'The service is currently unavailable.';
      break;
    case 'data-stale':
      errorMessage = 'The data is out of date. Please refresh.';
      break;
    case 'expired-token':
      errorMessage = 'Your session has expired. Please log in again.';
      break;
    case 'invalid-token':
      errorMessage = 'Invalid authentication token.';
      break;
    case 'max-retries':
      errorMessage = 'Maximum retries reached. Please try again later.';
      break;
    case 'network-error':
      errorMessage = 'Network error. Please check your connection.';
      break;
    case 'operation-failed':
      errorMessage = 'The operation failed. Please try again.';
      break;
    
    // Custom Validation Errors
    case 'validation-error':
      errorMessage = error.message || 'Invalid data provided.';
      break;
    
    // Order Status Errors
    case 'invalid-status-transition':
      errorMessage = 'Invalid order status transition.';
      break;
    case 'unauthorized-status-update':
      errorMessage = 'You are not authorized to update this order status.';
      break;
    
    // User Role Errors
    case 'unauthorized-role':
      errorMessage = 'You do not have the required role for this action.';
      break;
    case 'invalid-role':
      errorMessage = 'Invalid user role specified.';
      break;
    
    // Address Errors
    case 'invalid-address':
      errorMessage = 'Invalid address format or missing required fields.';
      break;
    case 'unauthorized-address-update':
      errorMessage = 'You are not authorized to update this address.';
      break;
    
    // Notification Errors
    case 'unauthorized-notification':
      errorMessage = 'You are not authorized to access these notifications.';
      break;
    case 'invalid-notification':
      errorMessage = 'Invalid notification format or missing required fields.';
      break;
    
    default:
      if (error.message) {
        errorMessage = error.message;
      } else {
        console.error('Unhandled Firebase error:', error);
      }
  }
  
  return errorMessage;
};

export const handleValidationError = (errors) => {
  const errorMessages = Object.values(errors);
  return new Error(errorMessages.join('\n'));
};

export const handleLocationError = (error) => {
  console.error('Location Error:', error);

  switch (error.code) {
    case 'PERMISSION_DENIED':
      return new Error('Location permission was denied');
    
    case 'POSITION_UNAVAILABLE':
      return new Error('Location information is unavailable');
    
    case 'TIMEOUT':
      return new Error('Location request timed out');
    
    default:
      return new Error('Failed to get location');
  }
};

export const handlePaymentError = (error) => {
  console.error('Payment Error:', error);

  switch (error.code) {
    case 'payment-failed':
      return new Error('Payment failed. Please try again');
    
    case 'insufficient-funds':
      return new Error('Insufficient funds');
    
    case 'invalid-card':
      return new Error('Invalid card details');
    
    case 'expired-card':
      return new Error('Card has expired');
    
    case 'declined':
      return new Error('Payment was declined');
    
    default:
      return new Error('An error occurred during payment');
  }
};

export const displayErrorAlert = (error, setError) => {
  const errorMessage = handleFirebaseError(error);
  setError(errorMessage);
};