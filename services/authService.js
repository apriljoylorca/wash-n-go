import { auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { database } from '../config/firebase';
import { ref, set, serverTimestamp } from 'firebase/database';
import { handleFirebaseError } from '../utils/errorHandler';

export const registerUser = async (userData) => {
  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    const user = userCredential.user;
    
    // 2. Update user profile in Auth
    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`
    });
    
    // 3. Save additional user data to Realtime Database
    const userRef = ref(database, `users/${user.uid}`);
    const timestamp = Date.now();
    
    await set(userRef, {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      role: userData.role || 'customer',
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    return user;
  } catch (error) {
    // Handle specific Firebase errors
    let errorMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'The email address is invalid.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Registration is currently disabled.';
        break;
      case 'auth/weak-password':
        errorMessage = 'The password is too weak.';
        break;
      default:
        errorMessage = handleFirebaseError(error);
    }
    
    throw new Error(errorMessage);
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw handleFirebaseError(error);
  }
};