import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTifDJv1eX5gp922czVPYQHti2oHm3KdI",
  authDomain: "expense-tracker-auth-d8ee0.firebaseapp.com",
  projectId: "expense-tracker-auth-d8ee0",
  storageBucket: "expense-tracker-auth-d8ee0.firebasestorage.app",
  messagingSenderId: "136322891828",
  appId: "1:136322891828:web:cbe1dcc737cd1d121a0a61",
  measurementId: "G-H23QLVPB0H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// ✅ ADD THIS LINE (CRITICAL FOR TEST OTP)
auth.settings.appVerificationDisabledForTesting = true;

export default app;
