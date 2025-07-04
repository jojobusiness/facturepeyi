// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhG0jNNcSRrmiPistjRiaNJu1d2ocI9IY",
  authDomain: "facturpeyi.firebaseapp.com",
  projectId: "facturpeyi",
  storageBucket: "facturpeyi.firebasestorage.app",
  messagingSenderId: "564900185405",
  appId: "1:564900185405:web:efd54ec609afa7adf2f154",
  measurementId: "G-4Y14R3013J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
export { db };
export const storage = getStorage(app);