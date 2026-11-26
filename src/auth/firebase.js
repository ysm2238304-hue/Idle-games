// src/auth/firebase.js (v210) - 嚴格手動登入 + Email/密碼註冊登入 + Google 手動登入 + Cloud Firestore (idle_arpg_saves)
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
let manualLoginTriggered = false;
let cloudWriteDisabled = false;

function translateAuthError(err) {
  const code = err?.code || '';
  const map = {
    'auth/invalid-email': 'Email 格式不正確，請重新確認。',
    'auth/user-disabled': '此帳號已被停用。',
    'auth/user-not-found': '找不到此 Email 帳號，請先切換至「註冊」建立帳號。',
    'auth/wrong-password': '密碼錯誤，請再試一次。',
    'auth/invalid-credential': '帳號或密碼錯誤，請重新確認。',
    'auth/email-already-in-use': '此 Email 已經註冊過，請直接切換至「登入」。',
    'auth/weak-password': '密碼強度不足，請至少輸入 6 個字元。',
    'auth/operation-not-allowed': '請先到 Firebase 後台 Authentication 開啟「電子郵件/密碼」登入方式。',
    'auth/too-many-requests': '嘗試次數過多，請稍後再試。',
    'auth/network-request-failed': '網路連線異常，請檢查網路狀態。',
    'auth/unauthorized-domain': `網域未授權 (${typeof window !== 'undefined' ? window.location.hostname : ''})，請於 Firebase 後台加入授權網域。`,
  };
  return map[code] || err?.message || '登入失敗，請稍後再試。';
}

async function ensureFirebase() {
  if (fbCtx) return fbCtx;
  if (!sdkPromise) {
    sdkPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js').catch(() => null),
    ]).then(async ([appMod, authMod, fsMod, analyticsMod]) => {
      const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      const db = fsMod.getFirestore(app);
      let analytics = null;
      try {
        if (analyticsMod && await analyticsMod.isSupported()) {
          analytics = analyticsMod.getAnalytics(app);
        }
      } catch { /* 廣告攔截器或不支援環境自動略過 */ }
      fbCtx = { app, auth, db, analytics, authMod, fsMod, analyticsMod };
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

  // 檢查是否剛從 Redirect 登入返回
  try {
    const redir = await authMod.getRedirectResult(auth);
    if (redir?.user) {
      manualLoginTriggered = true;
    }
  } catch (err) {
    if (err && err.code !== 'auth/null-user') {
      console.warn('Redirect 登入結果異常:', err.code, err.message);
    }
  }

  // 嚴格不自動登入：若頁面剛載入且非使用者手動觸發，強制登出舊快取，停在歡迎頁等待手動登入
  if (!manualLoginTriggered && auth.currentUser) {
    try {
      await authMod.signOut(auth);
    } catch { /* ignore */ }
  }

  let initialHandled = false;
  authMod.onAuthStateChanged(auth, async (user) => {
    if (!initialHandled && !manualLoginTriggered && user) {
      initialHandled = true;
      try {
        await authMod.signOut(auth);
      } catch { /* ignore */ }
      currentUser = null;
      onUserChanged(null, 'signed_out');
      return;
    }
    initialHandled = true;
    currentUser = user;
    onUserChanged(user, user ? 'signed_in' : 'signed_out');
  });
}

export async function signInWithEmail(email, password) {
  if (isLoggingIn) return null;
  isLoggingIn = true;
  try {
    const ctx = await ensureFirebase();
    if (!ctx) throw new Error('無法連線至雲端驗證服務。');
    manualLoginTriggered = true;
    const res = await ctx.authMod.signInWithEmailAndPassword(ctx.auth, email.trim(), password);
    currentUser = res.user;
    cloudWriteDisabled = false;
    return res.user;
  } catch (err) {
    manualLoginTriggered = false;
    throw new Error(translateAuthError(err));
  } finally {
    isLoggingIn = false;
  }
}

export async function registerWithEmail(email, password) {
  if (isLoggingIn) return null;
  isLoggingIn = true;
  try {
    const ctx = await ensureFirebase();
    if (!ctx) throw new Error('無法連線至雲端驗證服務。');
    manualLoginTriggered = true;
    const res = await ctx.authMod.createUserWithEmailAndPassword(ctx.auth, email.trim(), password);
    currentUser = res.user;
    cloudWriteDisabled = false;
    return res.user;
  } catch (err) {
    manualLoginTriggered = false;
    throw new Error(translateAuthError(err));
  } finally {
    isLoggingIn = false;
  }
}

export async function resetPasswordEmail(email) {
  const ctx = await ensureFirebase();
  if (!ctx) throw new Error('無法連線至雲端驗證服務。');
  try {
    await ctx.authMod.sendPasswordResetEmail(ctx.auth, email.trim());
    return true;
  } catch (err) {
    throw new Error(translateAuthError(err));
  }
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
    manualLoginTriggered = true;

    try {
      const res = await authMod.signInWithPopup(auth, provider);
      currentUser = res.user;
      cloudWriteDisabled = false;
      return res.user;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        manualLoginTriggered = false;
        return null;
      }
      if (err.code === 'auth/popup-blocked') {
        manualLoginTriggered = false;
        throw new Error('瀏覽器封鎖了 Google 登入視窗，請在網址列允許彈出式視窗後再試一次。');
      }
      manualLoginTriggered = false;
      throw new Error(translateAuthError(err));
    }
  } finally {
    isLoggingIn = false;
  }
}

export async function signOutGoogle() {
  manualLoginTriggered = false;
  const ctx = await ensureFirebase();
  if (!ctx) return;
  await ctx.authMod.signOut(ctx.auth);
  currentUser = null;
  cloudWriteDisabled = false;
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
  if (cloudWriteDisabled) return false;
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
    const msg = String(e?.message || '');
    if (e?.code === 'permission-denied' || msg.includes('permissions')) {
      cloudWriteDisabled = true;
      console.info('雲端存檔權限未開放，已自動切換為本地存檔模式（不再重複提示）。');
      const badge = document.getElementById('hud-cloud-status');
      if (badge) badge.textContent = '💾 本地存檔';
    } else {
      console.warn('雲端存檔失敗:', e);
    }
    return false;
  }
}

export async function deleteCloudSave(uid) {
  const ctx = await ensureFirebase();
  if (!ctx || !uid) return false;
  try {
    const { doc, deleteDoc } = ctx.fsMod;
    await deleteDoc(doc(ctx.db, COLLECTION_NAME, uid));
    return true;
  } catch (e) {
    console.warn('刪除雲端存檔失敗:', e);
    return false;
  }
}

const CHAT_COLLECTION = 'idle_arpg_chat';
let chatSyncDisabled = false;

export async function subscribeWorldChat(onMessages, onPermissionDenied) {
  if (chatSyncDisabled) {
    onPermissionDenied?.();
    return () => {};
  }
  const ctx = await ensureFirebase();
  if (!ctx) {
    onPermissionDenied?.();
    return () => {};
  }
  try {
    const { collection, query, orderBy, limit, onSnapshot } = ctx.fsMod;
    const q = query(collection(ctx.db, CHAT_COLLECTION), orderBy('createdAt', 'desc'), limit(40));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        msgs.push({ id: d.id, ...data });
      });
      msgs.reverse();
      onMessages?.(msgs);
    }, (err) => {
      const msg = String(err?.message || '');
      if (err?.code === 'permission-denied' || msg.includes('permissions')) {
        chatSyncDisabled = true;
        onPermissionDenied?.();
      } else {
        console.warn('世界頻道訂閱失敗:', err);
      }
    });
    return unsub;
  } catch (e) {
    chatSyncDisabled = true;
    onPermissionDenied?.();
    return () => {};
  }
}

export async function sendWorldChatMessage({ sender, channel = 'world', target = '', text }) {
  if (chatSyncDisabled) return { ok: false, reason: 'permission-denied' };
  const ctx = await ensureFirebase();
  if (!ctx) return { ok: false, reason: 'no-firebase' };
  try {
    const { collection, addDoc, serverTimestamp } = ctx.fsMod;
    await addDoc(collection(ctx.db, CHAT_COLLECTION), {
      sender: String(sender || '冒險者').slice(0, 20),
      uid: currentUser?.uid || 'guest',
      channel: String(channel || 'world'),
      target: String(target || '').slice(0, 20),
      text: String(text || '').slice(0, 200),
      createdAt: Date.now(),
      serverAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e) {
    const msg = String(e?.message || '');
    if (e?.code === 'permission-denied' || msg.includes('permissions')) {
      chatSyncDisabled = true;
      return { ok: false, reason: 'permission-denied' };
    }
    return { ok: false, reason: msg || 'error' };
  }
}

// ===================== v267: 多人共享主城即時同步（Firestore Presence） =====================
let townPresenceDisabled = false;

export async function publishTownPresence(chIdx, payload) {
  if (townPresenceDisabled) return { ok: false, reason: 'disabled' };
  if (!currentUser?.uid) return { ok: false, reason: 'guest' };
  const ctx = await ensureFirebase();
  if (!ctx) return { ok: false, reason: 'no-firebase' };
  try {
    const { doc, setDoc } = ctx.fsMod;
    const colName = `town_presence_ch${Number(chIdx) || 0}`;
    await setDoc(doc(ctx.db, colName, currentUser.uid), {
      uid: currentUser.uid,
      name: String(payload.name || '冒險者').slice(0, 18),
      classId: String(payload.classId || 'warrior'),
      level: Number(payload.level || 1),
      x: Math.round(payload.x || 2048),
      y: Math.round(payload.y || 1400),
      dir: String(payload.dir || 'down'),
      moving: Boolean(payload.moving),
      emote: String(payload.emote || '').slice(0, 24),
      chat: String(payload.chat || '').slice(0, 48),
      power: Number(payload.power || 0),
      updatedAt: Date.now(),
    }, { merge: true });
    return { ok: true };
  } catch (e) {
    const msg = String(e?.message || '');
    if (e?.code === 'permission-denied' || msg.includes('permissions')) {
      townPresenceDisabled = true;
    }
    return { ok: false, reason: msg || 'error' };
  }
}

export async function subscribeTownPresence(chIdx, onPlayers, onError) {
  if (townPresenceDisabled) { onError?.('disabled'); return () => {}; }
  const ctx = await ensureFirebase();
  if (!ctx) { onError?.('no-firebase'); return () => {}; }
  try {
    const { collection, onSnapshot } = ctx.fsMod;
    const colName = `town_presence_ch${Number(chIdx) || 0}`;
    const unsub = onSnapshot(collection(ctx.db, colName), (snap) => {
      const now = Date.now();
      const myUid = currentUser?.uid || null;
      const list = [];
      snap.forEach((d) => {
        const v = d.data();
        if (!v || v.uid === myUid) return;
        if (now - (v.updatedAt || 0) <= 65000) {
          list.push(v);
        }
      });
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      onPlayers?.(list.slice(0, 24));
    }, (err) => {
      const msg = String(err?.message || '');
      if (err?.code === 'permission-denied' || msg.includes('permissions')) {
        townPresenceDisabled = true;
      }
      onError?.(msg || 'error');
    });
    return unsub;
  } catch (e) {
    onError?.(String(e?.message || 'error'));
    return () => {};
  }
}
