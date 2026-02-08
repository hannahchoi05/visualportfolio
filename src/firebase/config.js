import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// TODO: Replace with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAHQyocP4gKeFO2zxB-suiz44sqJYdB6_M",
  authDomain: "portfolio-7dfd7.firebaseapp.com",
  projectId: "portfolio-7dfd7",
  storageBucket: "portfolio-7dfd7.firebasestorage.app",
  messagingSenderId: "620551232075",
  appId: "1:620551232075:web:8f1663ecb47cbca1dbcbce",
  measurementId: "G-W6PCHWH75J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Your email(s) - only these emails can access admin features
export const ADMIN_EMAILS = ["hannahchoi05@gmail.com", "hc8499@princeton.edu"];
