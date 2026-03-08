import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDNBCZP_0VQ43ZxaD85rwn4d0XKZ3X04-8",
  authDomain: "workflow5011.firebaseapp.com",
  projectId: "workflow5011",
  storageBucket: "workflow5011.firebasestorage.app",
  messagingSenderId: "796168060285",
  appId: "1:796168060285:web:38d266971dff34e2e92014",
  measurementId: "G-DSJDV689MJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only works in browser environments)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics };
