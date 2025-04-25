import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyAfIxVgTpuwCNl9OGzh9ezUJptvhan0pA8",
  authDomain: "wash-n-go-e8998.firebaseapp.com",
  databaseURL: "https://wash-n-go-e8998-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wash-n-go-e8998",
  storageBucket: "wash-n-go-e8998.firebasestorage.app",
  messagingSenderId: "372432205104",
  appId: "1:372432205104:web:f5ac6746baa0b0887204f5",
  measurementId: "G-4SMLK59BDN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized successfully');

// Initialize Auth
const auth = getAuth(app);
console.log('Firebase Auth initialized successfully');

// Initialize Database
const database = getDatabase(app);
console.log('Firebase Database initialized successfully');

// Initialize Storage
const storage = getStorage(app);
console.log('Firebase Storage initialized successfully');

// Initialize Firestore
const db = getFirestore(app);
console.log('Firebase Firestore initialized successfully');

// Export initialized services
export { app, auth, database, storage, db };