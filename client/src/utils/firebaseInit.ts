// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBKfx1Vbjaxe47BELhvU29tfmwsKSzv4Ec",
    authDomain: "trade-sentinel.firebaseapp.com",
    projectId: "trade-sentinel",
    storageBucket: "trade-sentinel.appspot.com",
    messagingSenderId: "1019804650909",
    appId: "1:1019804650909:web:907c5358fd2a9b207a3374",
    measurementId: "G-6M6YY17CEM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const initializeFirebaseMessaging = async () => {
    try {
        const token = await getToken(messaging, { vapidKey: 'BGaOGL6Kc9p6FFJxg8FXRhn3yP6wKKjubT1O0jI39X6ILbfAwPpFrJkufJ6CFhPZEm0dONmenLi0smyeCAb1bEM' });
        if (token) {
            console.log('FCM Token:', token);
            // Send the token to your server to save it for sending notifications later
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    } catch (error) {
        console.error('Error getting FCM token', error);
    }
};

