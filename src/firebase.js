import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBu3OiHBnDfdR2KoRb8Ze-uBH-D3tGrd8",
  authDomain: "monarchos-b3961.firebaseapp.com",
  projectId: "monarchos-b3961",
  storageBucket: "monarchos-b3961.firebasestorage.app",
  messagingSenderId: "1028230874437",
  appId: "1:1028230874437:web:358d70f0c07d2399f1ea2c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Helper: Save data to Firestore ───
export const saveData = async (path, data) => {
  try {
    await setDoc(doc(db, ...path.split("/")), { data, updatedAt: Date.now() });
  } catch (e) {
    console.error("Save error:", e);
  }
};

// ─── Helper: Subscribe to real-time updates ───
export const subscribe = (path, callback) => {
  return onSnapshot(doc(db, ...path.split("/")), (snap) => {
    if (snap.exists()) {
      callback(snap.data().data);
    }
  }, (err) => {
    console.error("Listen error:", err);
  });
};

export { db };
