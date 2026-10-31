// Conexão com o Firebase (ranking global). Não precisa mexer nisso.
const firebaseConfig = {
  apiKey: "AIzaSyDKwsi2538uqv86lPCqMmVw1-U1_SxjYi4",
  authDomain: "hollowcity.firebaseapp.com",
  projectId: "hollowcity",
  storageBucket: "hollowcity.firebasestorage.app",
  messagingSenderId: "58411850831",
  appId: "1:58411850831:web:0d0a3355383f27c2abde3a"
};

// se o Firebase não carregar, db fica null: o jogo segue normalmente e o ranking mostra RANKING OFFLINE
let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} catch (erro) {
  console.error('Firebase indisponível:', erro);
}

// sem resposta do ranking em 8 s (rede ruim), a tela desiste e mostra RANKING OFFLINE em vez de LOADING... para sempre
const RANKING_ESPERA_MS = 8000;
function comEspera(promessa) {
  return Promise.race([
    promessa,
    new Promise((_, rejeitar) => setTimeout(() => rejeitar(new Error('tempo esgotado')), RANKING_ESPERA_MS))
  ]);
}
