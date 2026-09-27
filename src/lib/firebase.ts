import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDv2x1o5EqroBxsfVKRtyf3Gbk_l-9mAkA",
  authDomain: "thaane-b283f.firebaseapp.com",
  projectId: "thaane-b283f",
  storageBucket: "thaane-b283f.firebasestorage.app",
  messagingSenderId: "336983423917",
  appId: "1:336983423917:web:576fe6e3eaec7f7a79bf24",
  measurementId: "G-R4221YY910",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
