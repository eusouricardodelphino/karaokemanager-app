// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvfX3xdEJQAn7qRSQVM23NsfBs_FKRtNo",
  authDomain: "sing-queue.firebaseapp.com",
  projectId: "sing-queue",
  storageBucket: "sing-queue.firebasestorage.app",
  messagingSenderId: "929906086273",
  appId: "1:929906086273:web:1d2a619ef9d3d736a89880",
  measurementId: "G-EYFG7NJRYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export default app;