// Firebase Google 登入與 Firestore 雲端存檔模組（獨立集合 idle_arpg_saves）
// 請填入你 hoshino-game 專案的 apiKey、appId 與 messagingSenderId
const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: 'hoshino-game.firebaseapp.com',
  projectId: 'hoshino-game',
  storageBucket: 'hoshino-game.firebasestorage.app',
  messagingSenderId: '',
  appId: '',
};

const COLLECTION_NAME = 'idle_arpg_saves';

let authInstance = null;
let dbInstance = null;
let currentUser = null;
let fbModules = null;

export function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.appId);
}

async function loadFirebaseModules() {
  if (fbModules) return fbModules;
  const [appMod, authMod, fsMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'),
  ]);
  fbModules = { appMod, authMod, fsMod };
  return fbModules;
}

export async function initCloudAuth(onUserChanged) {
  if (!isFirebaseConfigured()) {
    onUserChanged(null, 'unconfigured');
    return;
  }
  try {
    const { appMod, authMod, fsMod } = await loadFirebaseModules();
    const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(FIREBASE_CONFIG);
    authInstance = authMod.getAuth(app);
    dbInstance = fsMod.getFirestore(app);

    try {
      await authMod.getRedirectResult(authInstance);
    } catch (e) {
      console.warn('Redirect result check:', e);
    }

    authMod.onAuthStateChanged(authInstance, (user) => {
      currentUser = user;
      onUserChanged(user, user ? 'signed_in' : 'signed_out');
    });
  } catch (err) {
    console.warn('Firebase 初始化失敗:', err);
    onUserChanged(null, 'error');
  }
}

export async function signInWithGoogle() {
  if (!isFirebaseConfigured()) {
    throw new Error('尚未設定 Firebase apiKey / appId，請先於 src/auth/firebase.js 填入 hoshino-game 設定。');
  }
  const { authMod } = await loadFirebaseModules();
  const provider = new authMod.GoogleAuthProvider();
  try {
    const res = await authMod.signInWithPopup(authInstance, provider);
    currentUser = res.user;
    return res.user;
  } catch (err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      await authMod.signInWithRedirect(authInstance, provider);
      return null;
    }
    throw err;
  }
}

export async function signOutGoogle() {
  if (!authInstance || !fbModules) return;
  await fbModules.authMod.signOut(authInstance);
  currentUser = null;
}

export function getCurrentUser() {
  return currentUser;
}

export async function loadCloudSave(uid) {
  if (!dbInstance || !fbModules || !uid) return null;
  const { doc, getDoc } = fbModules.fsMod;
  const snap = await getDoc(doc(dbInstance, COLLECTION_NAME, uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveCloudData(uid, state) {
  if (!dbInstance || !fbModules || !uid) return false;
  try {
    const { doc, setDoc } = fbModules.fsMod;
    await setDoc(doc(dbInstance, COLLECTION_NAME, uid), {
      ...state,
      lastSavedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.warn('雲端寫入失敗:', e);
    return false;
  }
}
