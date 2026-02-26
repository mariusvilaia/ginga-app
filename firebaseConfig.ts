
import { initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAJ5xXbfQFSXkOsRZin07LrEwZnrIfl8Fk",
  authDomain: "ginga-app.firebaseapp.com",
  databaseURL: "https://ginga-app.firebaseio.com",
  projectId: "ginga-app",
  storageBucket: "ginga-app.firebasestorage.app",
  messagingSenderId: "289454700114",
  appId: "1:289454700114:web:5067371ad87cec87d8918b",
  measurementId: "G-33RK3V2NL6"
};

// Initialize Firebase (Modular SDK)
const app = initializeApp(firebaseConfig);

export const auth = FirebaseAuth.getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new FirebaseAuth.GoogleAuthProvider();
