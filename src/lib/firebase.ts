import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAcYilQLlI5fEaZO6n9W63nxxUxxeSKKmY",
    authDomain: "padel-b7b70.firebaseapp.com",
    projectId: "padel-b7b70",
    storageBucket: "padel-b7b70.firebasestorage.app",
    messagingSenderId: "1048235793199",
    appId: "1:1048235793199:web:9c5a57d2e8c2bfbe821fda",
    measurementId: "G-24NRYQXDBL",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;
