import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCCjsFUn2_i-iQMaQkhaf4R7oG8R2M1_Cw",
  authDomain: "dz-studio-organizer-84315.firebaseapp.com",
  projectId: "dz-studio-organizer-84315",
  storageBucket: "dz-studio-organizer-84315.appspot.com",
  messagingSenderId: "921869203951",
  appId: "1:921869203951:web:ed3ff6aec6fcdc38dade1a"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
