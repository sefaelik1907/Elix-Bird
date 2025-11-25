import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLjhOPRIimZkiQGUZxXKw4HqB6JHBnR7A",
  authDomain: "elixunder-d8f77.firebaseapp.com",
  projectId: "elixunder-d8f77",
  storageBucket: "elixunder-d8f77.firebasestorage.app",
  messagingSenderId: "705283168716",
  appId: "1:705283168716:web:905240967ebfea24e72569"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);