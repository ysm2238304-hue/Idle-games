/**
 * WelcomeAuthUI.js (v208)
 * - 移除「本機離線冒險」按鈕與底部三格特色文案
 * - Google 按鈕改名為「Google帳號登入」
 * - 優化歡迎頁背景影片：移除模糊消耗、進遊戲自動暫停、緩衝卡頓超過 2.5 秒自動降級為靜態暗黑背景
 */

import { signInWithEmail, registerWithEmail, resetPasswordEmail } from '../auth/firebase.js?v=207';

function ensureAuthCss() {
  if (typeof document === 'undefined') return;
  const old = document.getElementById('welcome-auth-v207-css');
  if (old) {
    old.href = './src/ui/welcomeAuth.css?v=212';
    return;
  }
  const link = document.createElement('link');
  link.id = 'welcome-auth-v207-css';
  link.rel = 'stylesheet';
  link.href = './src/ui/welcomeAuth.css?v=212';
  document.head.appendChild(link);
}

function optimizeWelcomeVideo() {
  const video = document.getElementById('welcome-bg-video');
  const screen = document.getElementById('welcome-screen');
  if (!video || video.dataset.v208Opt) return;
  video.dataset.v208Opt = '1';

  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  let stallTimer = null;
  const markStalled = () => {
    video.classList.add('is-video-stalled');
  };
  const clearStall = () => {
    if (stallTimer) {
      clearTimeout(stallTimer);
      stallTimer = null;
    }
    video.classList.remove('is-video-stalled');
  };

  video.addEventListener('playing', clearStall);
  video.addEventListener('canplay', clearStall);
  video.addEventListener('error', markStalled);

  const onBuffering = () => {
    if (stallTimer || video.paused) return;
    stallTimer = setTimeout(() => {
      if (video.readyState < 3) markStalled();
    }, 2500);
  };
  video.addEventListener('waiting', onBuffering);
  video.addEventListener('stalled', onBuffering);

  if (screen) {
    const syncPlayback = () => {
      const hidden = screen.classList.contains('hidden') || screen.style.display === 'none';
      if (hidden) {
        if (!video.paused) video.pause();
      } else if (video.paused && !video.classList.contains('is-video-stalled')) {
        video.play().catch(() => {});
      }
    };
    const obs = new MutationObserver(syncPlayback);
    obs.observe(screen, { attributes: true, attributeFilter: ['class', 'style'] });
    syncPlayback();
  }
}

export function initWelcomeAuthUI() {
  ensureAuthCss();
  if (typeof document === 'undefined') return;

  optimizeWelcomeVideo();

  const pedestal = document.querySelector('#welcome-step-auth .gate-login-pedestal');
  const googleBtn = document.getElementById('btn-google-login');
  const guestBtn = document.getElementById('btn-guest-play');
  const bottomBar = document.querySelector('#welcome-step-auth .gate-bottom-bar');
  const eraPill = document.querySelector('#welcome-step-auth .gate-era-pill');
  if (eraPill) eraPill.remove();
  const statusPill = document.getElementById('welcome-auth-status');

  // 1. 移除「本機離線冒險」與底部三格特色文案
  if (guestBtn) guestBtn.remove();
  if (bottomBar) bottomBar.remove();

  const syncStatusText = () => {
    if (!statusPill) return;
    const t = statusPill.textContent || '';
    if (t.includes('正在檢查') || t.includes('離線試玩')) {
      statusPill.textContent = '請使用 Email 或 Google 帳號登入';
    }
  };
  syncStatusText();
  if (statusPill && !statusPill.dataset.v212Obs) {
    statusPill.dataset.v212Obs = '1';
    new MutationObserver(syncStatusText).observe(statusPill, { childList: true, characterData: true, subtree: true });
  }

  if (!pedestal || pedestal.dataset.authV208Mounted) return;
  pedestal.dataset.authV208Mounted = '1';

  const card = document.createElement('div');
  card.className = 'auth-altar-card';
  card.innerHTML = `
    <div class="auth-tab-row">
      <button type="button" id="auth-tab-login" class="auth-tab-btn is-active">帳號登入</button>
      <button type="button" id="auth-tab-register" class="auth-tab-btn">註冊新帳號</button>
    </div>

    <div class="auth-field">
      <label for="auth-email-input">電子郵件（Email）</label>
      <div class="auth-input-wrap">
        <input id="auth-email-input" class="auth-input" type="email" autocomplete="email" placeholder="example@gmail.com" />
      </div>
    </div>

    <div class="auth-field">
      <label for="auth-pass-input">密碼（至少 6 碼）</label>
      <div class="auth-input-wrap">
        <input id="auth-pass-input" class="auth-input" type="password" autocomplete="current-password" placeholder="請輸入密碼" style="padding-right:34px;" />
        <button type="button" id="btn-toggle-pass" class="auth-eye-btn" title="顯示 / 隱藏密碼">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>

    <div id="auth-pass2-field" class="auth-field" style="display:none;">
      <label for="auth-pass2-input">確認密碼</label>
      <div class="auth-input-wrap">
        <input id="auth-pass2-input" class="auth-input" type="password" autocomplete="new-password" placeholder="請再次輸入密碼" />
      </div>
    </div>

    <div id="auth-reset-row" class="auth-sub-actions">
      <button type="button" id="btn-email-reset" class="auth-link-btn">忘記密碼？寄送重設信</button>
    </div>

    <div id="auth-msg-box" class="auth-msg-box"></div>

    <button type="button" id="btn-email-submit" class="auth-submit-btn">登入冒險帳號</button>

    <div class="auth-divider">或</div>
  `;

  if (googleBtn) {
    googleBtn.textContent = 'Google帳號登入';
    card.appendChild(googleBtn);
  }

  pedestal.innerHTML = '';
  pedestal.appendChild(card);

  let mode = 'login';
  const tabLogin = document.getElementById('auth-tab-login');
  const tabReg = document.getElementById('auth-tab-register');
  const pass2Field = document.getElementById('auth-pass2-field');
  const resetRow = document.getElementById('auth-reset-row');
  const submitBtn = document.getElementById('btn-email-submit');
  const msgBox = document.getElementById('auth-msg-box');
  const emailInput = document.getElementById('auth-email-input');
  const passInput = document.getElementById('auth-pass-input');
  const pass2Input = document.getElementById('auth-pass2-input');

  const showMsg = (text, isOk = false) => {
    msgBox.textContent = text;
    msgBox.className = `auth-msg-box ${isOk ? 'is-ok' : 'is-error'}`;
  };
  const clearMsg = () => {
    msgBox.textContent = '';
    msgBox.className = 'auth-msg-box';
  };

  const setMode = (next) => {
    mode = next;
    clearMsg();
    tabLogin.classList.toggle('is-active', mode === 'login');
    tabReg.classList.toggle('is-active', mode === 'register');
    pass2Field.style.display = mode === 'register' ? 'flex' : 'none';
    resetRow.style.display = mode === 'login' ? 'flex' : 'none';
    submitBtn.textContent = mode === 'login' ? '登入冒險帳號' : '註冊並進入遊戲';
  };

  tabLogin.addEventListener('click', () => setMode('login'));
  tabReg.addEventListener('click', () => setMode('register'));

  document.getElementById('btn-toggle-pass')?.addEventListener('click', () => {
    const t = passInput.type === 'password' ? 'text' : 'password';
    passInput.type = t;
    pass2Input.type = t;
  });

  document.getElementById('btn-email-reset')?.addEventListener('click', async () => {
    clearMsg();
    const email = (emailInput.value || '').trim();
    if (!email) {
      showMsg('請先在上方輸入你的 Email，再點擊忘記密碼。');
      return;
    }
    try {
      await resetPasswordEmail(email);
      showMsg('密碼重設信已寄出，請至信箱查收（含垃圾郵件匣）。', true);
    } catch (err) {
      showMsg(err.message);
    }
  });

  const handleSubmit = async () => {
    clearMsg();
    const email = (emailInput.value || '').trim();
    const pass = passInput.value || '';
    const pass2 = pass2Input.value || '';

    if (!email || !email.includes('@')) {
      showMsg('請輸入有效的 Email 信箱。');
      return;
    }
    if (pass.length < 6) {
      showMsg('密碼長度至少需要 6 個字元。');
      return;
    }
    if (mode === 'register' && pass !== pass2) {
      showMsg('兩次輸入的密碼不一致，請重新確認。');
      return;
    }

    submitBtn.disabled = true;
    const origText = submitBtn.textContent;
    submitBtn.textContent = mode === 'login' ? '登入驗證中...' : '建立帳號中...';

    try {
      if (mode === 'login') {
        await signInWithEmail(email, pass);
      } else {
        await registerWithEmail(email, pass);
      }
      showMsg('驗證成功！正在載入冒險資料...', true);
    } catch (err) {
      showMsg(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
  };

  submitBtn.addEventListener('click', handleSubmit);
  [emailInput, passInput, pass2Input].forEach((inp) => {
    inp?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  });
}
