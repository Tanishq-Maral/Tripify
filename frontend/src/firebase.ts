// Firebase config for Google Auth only
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCk8mcMlw3ByHZtPM31qEWB3ThKy58D__Q",
  authDomain: "tripify-web.firebaseapp.com",
  projectId: "tripify-web",
  appId: "1:240069748187:web:e1a7c6f709ecd461e1b3fe",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
