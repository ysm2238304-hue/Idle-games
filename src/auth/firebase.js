// src/auth/firebase.js — 沿用 hoshino-game 專案，存檔獨立寫入 idle_arpg_saves 集合
const firebaseConfig = {
  apiKey: 'AIzaSyDUwnKiTdmlJaSLADPxwt4OdLqUpfod0Ck',
  authDomain: 'hoshino-game.firebaseapp.com',
  projectId: 'hoshino-game',
  storageBucket: 'hoshino-game.firebasestorage.app',
  messagingSenderId: '1040701395385',
  appId: '1:1040701395385:web:0693d9afed8c8f9c61e668',
  measurementId: 'G-Q7FH95E3Z7',
};

const COLLECTION_NAME = 'idle_arpg_saves';

let sdkPromise = null;
let fbCtx = null;
let currentUser = null;
let isLoggingIn = false;

async function ensureFirebase() {
  if (fbCtx) return fbCtx;
  if (!sdkPromise) {
    sdkPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'),
    ]).then(([appMod, authMod, fsMod]) => {
      const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      const db = fsMod.getFirestore(app);
      fbCtx = { app, auth, db, authMod, fsMod };
      return fbCtx;
    }).catch((err) => {
      console.warn('⚠️ Firebase SDK 載入失敗（將以本機離線模式運行）:', err);
      sdkPromise = null;
      return null;
    });
  }
  return sdkPromise;
}

export async function initCloudAuth(onUserChanged) {
  const ctx = await ensureFirebase();
  if (!ctx) {
    onUserChanged(null, 'error');
    return;
  }

  const { auth, authMod } = ctx;
  authMod.getRedirectResult(auth).catch((err) => {
    if (err && err.code !== 'auth/null-user') {
      console.warn('Redirect 登入結果異常:', err.code, err.message);
    }
  });

  authMod.onAuthStateChanged(auth, (user) => {
    currentUser = user;
    onUserChanged(user, user ? 'signed_in' : 'signed_out');
  });
}

export async function signInWithGoogle() {
  if (isLoggingIn) return null;
  isLoggingIn = true;
  try {
    const ctx = await ensureFirebase();
    if (!ctx) throw new Error('無法連線至 Google 登入服務，請先使用本機離線試玩。');

    const { auth, authMod } = ctx;
    const provider = new authMod.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const res = await authMod.signInWithPopup(auth, provider);
      currentUser = res.user;
      return res.user;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return null;
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
        await authMod.signInWithRedirect(auth, provider);
        return null;
      }
      if (err.code === 'auth/unauthorized-domain') {
        throw new Error(`網域未授權 (${window.location.hostname})，請於 Firebase 後台 Authorized domains 加入此網域。`);
      }
      throw err;
    }
  } finally {
    isLoggingIn = false;
  }
}

export async function signOutGoogle() {
  const ctx = await ensureFirebase();
  if (!ctx) return;
  await ctx.authMod.signOut(ctx.auth);
  currentUser = null;
}

export function getCurrentUser() {
  return currentUser;
}

export async function loadCloudSave(uid) {
  const ctx = await ensureFirebase();
  if (!ctx || !uid) return null;
  try {
    const { doc, getDoc } = ctx.fsMod;
    const snap = await getDoc(doc(ctx.db, COLLECTION_NAME, uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('雲端讀檔失敗:', e);
    return null;
  }
}

export async function saveCloudData(uid, state) {
  const ctx = await ensureFirebase();
  if (!ctx || !uid) return false;
  try {
    const { doc, setDoc } = ctx.fsMod;
    await setDoc(doc(ctx.db, COLLECTION_NAME, uid), {
      ...state,
      lastSavedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.warn('雲端存檔失敗:', e);
    return false;
  }
}
