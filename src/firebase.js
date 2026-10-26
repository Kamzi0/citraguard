import {
  initializeApp,
} from "firebase/app";

import {
  getFirestore,
} from "firebase/firestore";


const firebaseConfig = {
  apiKey:
    "AIzaSyBDpBfs1SrHi8M5Fx_lo_1X78cXCAkv7Lw",

  authDomain:
    "citraguard-5a339.firebaseapp.com",

  projectId:
    "citraguard-5a339",

  storageBucket:
    "citraguard-5a339.firebasestorage.app",

  messagingSenderId:
    "1053438850003",

  appId:
    "1:1053438850003:web:ff89e674f979af85ae7526",

  measurementId:
    "G-ZY60SBQSPV",
};


const app =
  initializeApp(
    firebaseConfig
  );


const db =
  getFirestore(
    app
  );


export {
  app,
  db,
};