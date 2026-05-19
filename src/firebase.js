import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBmYPvgVVKbrRUmqpGMORzsZPOtO4X4WZw",
  authDomain: "clowi-cattd.firebaseapp.com",
  projectId: "clowi-cattd",
  storageBucket: "clowi-cattd.firebasestorage.app",
  messagingSenderId: "418062327499",
  appId: "1:418062327499:web:992ddb3fa830b0a441454e",
  measurementId: "G-18VMRXEFQX",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider('microsoft.com');
