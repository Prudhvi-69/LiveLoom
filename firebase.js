import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, where }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA-ev7xtfHKPoXesy3RaQhUbOGmYEAfEjw",
    authDomain: "liveloom-39bd4.firebaseapp.com",
    projectId: "liveloom-39bd4",
    storageBucket: "liveloom-39bd4.firebasestorage.app",
    messagingSenderId: "1036037950434",
    appId: "1:1036037950434:web:5b051fe6bd46d369ce87bb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };
export { collection, doc, setDoc, getDocs, deleteDoc, query, where };
