// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Firestore is a NoSQL document database that lets you easily store, sync, and query data for your mobile and web apps 
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from "firebase/analytics";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHQP40wuzcoUsL-Ozs-6X3JHmIFfihd3g",
  authDomain: "inventory-management-app-ce0fb.firebaseapp.com",
  projectId: "inventory-management-app-ce0fb",
  storageBucket: "inventory-management-app-ce0fb.appspot.com",
  messagingSenderId: "531723718853",
  appId: "1:531723718853:web:80b9a4350cab5a1fdda0ac",
  measurementId: "G-TNHLZ6JD7T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const firestore = getFirestore(app);
export {firestore };