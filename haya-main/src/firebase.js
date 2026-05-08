import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAWB1d7o5LJ-kNkYy9Qe2mi29kMAMckisY",
    authDomain: "nr-zone-bd.firebaseapp.com",
    projectId: "nr-zone-bd",
    storageBucket: "nr-zone-bd.firebasestorage.app",
    messagingSenderId: "178228657033",
    appId: "1:178228657033:web:2be38ac87063c7dd5dbf58"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
