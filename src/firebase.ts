import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp, collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 앱 시작 시 익명 로그인 시도 (이미 로그인 된 경우 무시됨)
async function ensureAnonymousAuth() {
  try {
    // onAuthStateChanged 로 이미 로그인된 상태를 감지
    return new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsub();
          resolve();
        } else {
          // 익명 로그인
          signInAnonymously(auth).then(() => {
            unsub();
            resolve();
          }).catch((err) => {
            console.error("Anonymous sign-in failed:", err);
            unsub();
            resolve(); // 오류여도 계속 (읽기 전용 모드 등)
          });
        }
      });
    });
  } catch (e) {
    console.warn("ensureAnonymousAuth error", e);
  }
}

export { db, auth, ensureAnonymousAuth, serverTimestamp, collection, addDoc, query, orderBy, onSnapshot };
