// Conexão com o Firebase (ranking global). Não precisa mexer nisso.
const firebaseConfig = {
  apiKey: "AIzaSyDKwsi2538uqv86lPCqMmVw1-U1_SxjYi4",
  authDomain: "hollowcity.firebaseapp.com",
  projectId: "hollowcity",
  storageBucket: "hollowcity.firebasestorage.app",
  messagingSenderId: "58411850831",
  appId: "1:58411850831:web:0d0a3355383f27c2abde3a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();