import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBk3ZHBi2aMpfbfg2QbMSvBOqOo14TZHcU",
    authDomain: "nrzoone-factory.firebaseapp.com",
    projectId: "nrzoone-factory",
    storageBucket: "nrzoone-factory.firebasestorage.app",
    messagingSenderId: "848880445721",
    appId: "1:848880445721:web:35dac54e2a11e478cd7d88",
    measurementId: "G-42G5F7HQ40"
};

// Initialize Firebase with safety check
let app;
try {
    if (!firebaseConfig.apiKey) {
        console.error("Firebase API Key is missing! (ফায়ারবেস এপিআই কী পাওয়া যায়নি)");
    }
    app = initializeApp(firebaseConfig);
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

// Initialize Services
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const analytics = (typeof window !== "undefined" && app) ? getAnalytics(app) : null;

export default app;
