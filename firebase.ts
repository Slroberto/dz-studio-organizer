import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// =================================================================================
// IMPORTANTE: CONFIGURAÇÃO DO FIREBASE
// =================================================================================
// Substitua os valores de placeholder abaixo pela configuração real do seu projeto Firebase.
// É altamente recomendado usar variáveis de ambiente para esses dados sensíveis.
// Por exemplo: apiKey: process.env.REACT_APP_FIREBASE_API_KEY
// Você pode encontrar esses valores no console do seu projeto Firebase em
// Configurações do Projeto > Geral > Seus apps > App da Web.
// =================================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
