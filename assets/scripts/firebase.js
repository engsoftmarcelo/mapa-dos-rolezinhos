// assets/scripts/firebase.js

// Importa as funções do Firebase direto da internet
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Sua configuração do projeto MapaDosRolezinhos
const firebaseConfig = {
  apiKey: "AIzaSyDKBnPHgrTk3QArYQyCuD0Z1baOenf4GdE",
  authDomain: "mapadosrolezinhos.firebaseapp.com",
  projectId: "mapadosrolezinhos",
  storageBucket: "mapadosrolezinhos.firebasestorage.app",
  messagingSenderId: "283864853368",
  appId: "1:283864853368:web:6b6027885c158774ca768d",
  measurementId: "G-F6GCE32P6V"
};

// Inicializa o app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Exporta para usar no app.js
export { auth, provider, signInWithPopup, signOut };