'use strict';

// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://uhorkrljuusuiflcvmoo.supabase.co';
const SUPABASE_ANON    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVob3JrcmxqdXVzdWlmbGN2bW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjEyODMsImV4cCI6MjA5MjMzNzI4M30.3UlSNsTXpPkDHUdVdc7Vq8RH1Px6TocnLmJwVCz-_wg';
const REDIRECT_URL     = 'https://eucbudak.github.io/todo-app/';

// ── Session ───────────────────────────────────────────────────────────────────
let session = null;   // { access_token, refresh_token, user }

function saveSession(data) {
  session = data;
  localStorage.setItem('sb_session', JSON.stringify(data));
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem('sb_session')); } catch { return null; }
}

function clearSession() {
  session = null;
  localStorage.removeItem('sb_session');
}

// ── Auth API ──────────────────────────────────────────────────────────────────
const authHeaders = (token) => ({
  'apikey': SUPABASE_ANON,
  'Authorization': `Bearer ${token || SUPABASE_ANON}`,
  'Content-Type': 'application/json',
});

async function authFetch(path, body, token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || 'Hata oluştu');
  return data;
}

async function signUp(email, password) {
  return authFetch('/signup', { email, password, options: { emailRedirectTo: REDIRECT_URL } });
}

async function signIn(email, password) {
  return authFetch('/token?grant_type=password', { email, password });
}

async function signOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: 'POST',
    headers: authHeaders(token),
  }).catch(() => {});
}

// ── Todos API ─────────────────────────────────────────────────────────────────
const BASE = `${SUPABASE_URL}/rest/v1/todos`;

function todoHeaders(token) {
  return {
    'apikey': SUPABASE_ANON,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

async function todoFetch(url, options, token) {
  const res = await fetch(url, { headers: todoHeaders(token), ...options });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const api = {
  getAll:         (tk)       => todoFetch(`${BASE}?order=created_at.desc`, {}, tk),
  add:            (tk, text) => todoFetch(BASE, { method: 'POST', body: JSON.stringify({ text, done: false }) }, tk),
  toggle:         (tk, id, done) => todoFetch(`${BASE}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ done }) }, tk),
  updateText:     (tk, id, text) => todoFetch(`${BASE}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ text }) }, tk),
  delete:         (tk, id)   => todoFetch(`${BASE}?id=eq.${id}`, { method: 'DELETE', headers: { ...todoHeaders(tk), Prefer: '' } }, tk),
  clearCompleted: (tk)       => todoFetch(`${BASE}?done=eq.true`, { method: 'DELETE', headers: { ...todoHeaders(tk), Prefer: '' } }, tk),
};

// ── State ─────────────────────────────────────────────────────────────────────
let todos  = [];
let filter = 'all';

// ── DOM ───────────────────────────────────────────────────────────────────────
const authScreen    = document.getElementById('auth-screen');
const confirmScreen = document.getElementById('confirm-screen');
const appScreen     = document.getElementById('app-screen');
const authMessage   = document.getElementById('auth-message');

const authTabs      = document.querySelectorAll('.auth-tab');
const loginForm     = document.getElementById('login-form');
const registerForm  = document.getElementById('register-form');
const loginBtn      = document.getElementById('login-btn');
const registerBtn   = document.getElementById('register-btn');

const resendBtn     = document.getElementById('resend-btn');
const backToLogin   = document.getElementById('back-to-login');
const confirmText   = document.getElementById('confirm-email-text');

const logoutBtn     = document.getElementById('logout-btn');
const userEmailEl   = document.getElementById('user-email');

const input         = document.getElementById('todo-input');
const addBtn        = document.getElementById('add-btn');
const list          = document.getElementById('todo-list');
const summary       = document.getElementById('summary');
const remaining     = document.getElementById('remaining');
const footer        = document.getElementById('footer');
const clearBtn      = document.getElementById('clear-btn');
const filterBtns    = document.querySelectorAll('.filter-btn');

// ── Screen helpers ────────────────────────────────────────────────────────────
function showScreen(name) {
  authScreen.style.display    = name === 'auth'    ? 'flex' : 'none';
  confirmScreen.style.display = name === 'confirm' ? 'flex' : 'none';
  appScreen.style.display     = name === 'app'     ? 'flex' : 'none';
}

function showMessage(text, type = 'error') {
  authMessage.textContent = text;
  authMessage.className   = `auth-message ${type}`;
  authMessage.style.display = 'block';
}

function clearMessage() {
  authMessage.style.display = 'none';
}

// ── Auth UI events ────────────────────────────────────────────────────────────
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    clearMessage();
    if (tab.dataset.tab === 'login') {
      loginForm.style.display    = 'flex';
      registerForm.style.display = 'none';
    } else {
      loginForm.style.display    = 'none';
      registerForm.style.display = 'flex';
    }
  });
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  loginBtn.disabled    = true;
  loginBtn.textContent = 'Giriş yapılıyor...';
  try {
    const data = await signIn(email, password);
    saveSession({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
    enterApp();
  } catch (err) {
    showMessage(translateError(err.message));
  } finally {
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Giriş Yap';
  }
});

let lastRegEmail = '';
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  registerBtn.disabled    = true;
  registerBtn.textContent = 'Kayıt olunuyor...';
  try {
    await signUp(email, password);
    lastRegEmail = email;
    confirmText.textContent = `${email} adresine onay bağlantısı gönderildi. E-postanı kontrol et ve linke tıkla.`;
    showScreen('confirm');
  } catch (err) {
    showMessage(translateError(err.message));
  } finally {
    registerBtn.disabled    = false;
    registerBtn.textContent = 'Kayıt Ol';
  }
});

resendBtn.addEventListener('click', async () => {
  if (!lastRegEmail) return;
  resendBtn.disabled    = true;
  resendBtn.textContent = 'Gönderiliyor...';
  try {
    await signUp(lastRegEmail, '_placeholder_resend_');
  } catch {}
  setTimeout(() => {
    resendBtn.disabled    = false;
    resendBtn.textContent = 'Tekrar gönder';
  }, 5000);
});

backToLogin.addEventListener('click', () => {
  clearMessage();
  showScreen('auth');
});

logoutBtn.addEventListener('click', async () => {
  if (session) await signOut(session.access_token);
  clearSession();
  todos = [];
  showScreen('auth');
});

// ── App ───────────────────────────────────────────────────────────────────────
function setLoading(on) {
  addBtn.disabled    = on;
  input.disabled     = on;
  addBtn.textContent = on ? '...' : 'Ekle';
}

async function enterApp() {
  userEmailEl.textContent = session?.user?.email || '';
  showScreen('app');
  await loadTodos();
}

async function loadTodos() {
  setLoading(true);
  todos = await api.getAll(session.access_token);
  render();
  setLoading(false);
}

// ── Render ────────────────────────────────────────────────────────────────────
function visibleTodos() {
  if (filter === 'active')    return todos.filter(t => !t.done);
  if (filter === 'completed') return todos.filter(t =>  t.done);
  return todos;
}

function checkIcon() {
  return `<svg viewBox="0 0 12 12" fill="none">
    <polyline points="1.5,6 4.5,9 10.5,3" stroke="white" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function trashIcon() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function render() {
  const visible = visibleTodos();
  list.innerHTML = '';

  if (visible.length === 0) {
    const msg = filter === 'completed' ? 'Tamamlanan görev yok'
              : filter === 'active'    ? 'Aktif görev yok'
              :                          'Henüz görev eklenmedi';
    list.innerHTML = `<li class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <rect x="3" y="5" width="18" height="16" rx="2"/>
        <path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>
      </svg>${msg}</li>`;
  } else {
    visible.forEach(todo => {
      const li = document.createElement('li');
      li.className  = 'todo-item' + (todo.done ? ' completed' : '');
      li.dataset.id = todo.id;
      li.innerHTML  = `
        <button class="check-btn">${checkIcon()}</button>
        <span class="todo-text" contenteditable="plaintext-only"
          spellcheck="false">${escHtml(todo.text)}</span>
        <button class="delete-btn">${trashIcon()}</button>`;
      list.appendChild(li);
    });
  }

  const total     = todos.length;
  const doneCount = todos.filter(t => t.done).length;
  const leftCount = total - doneCount;

  summary.textContent   = total === 0 ? 'Hiç görev yok' : `${total} görev · ${doneCount} tamamlandı`;
  remaining.textContent = `${leftCount} görev kaldı`;
  footer.style.display  = total > 0 ? 'flex' : 'none';
}

// ── Todo actions ──────────────────────────────────────────────────────────────
async function handleAdd() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  setLoading(true);
  const [created] = await api.add(session.access_token, text);
  todos.unshift(created);
  render();
  setLoading(false);
  input.focus();
}

async function handleToggle(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  const [updated] = await api.toggle(session.access_token, id, !todo.done);
  Object.assign(todo, updated);
  render();
}

async function handleDelete(id, li) {
  li.style.transition = 'opacity 0.15s, transform 0.15s';
  li.style.opacity    = '0';
  li.style.transform  = 'translateX(12px)';
  await new Promise(r => setTimeout(r, 150));
  await api.delete(session.access_token, id);
  todos = todos.filter(t => t.id !== id);
  render();
}

async function handleUpdateText(id, newText) {
  newText = newText.trim();
  if (!newText) {
    await api.delete(session.access_token, id);
    todos = todos.filter(t => t.id !== id);
    render();
    return;
  }
  await api.updateText(session.access_token, id, newText);
  const todo = todos.find(t => t.id === id);
  if (todo) todo.text = newText;
}

// ── Todo events ───────────────────────────────────────────────────────────────
list.addEventListener('click', e => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  if (e.target.closest('.check-btn'))  handleToggle(item.dataset.id);
  if (e.target.closest('.delete-btn')) handleDelete(item.dataset.id, item);
});

list.addEventListener('blur', e => {
  if (!e.target.classList.contains('todo-text')) return;
  const item = e.target.closest('.todo-item');
  if (item) handleUpdateText(item.dataset.id, e.target.textContent);
}, true);

list.addEventListener('keydown', e => {
  if (e.target.classList.contains('todo-text') && e.key === 'Enter') {
    e.preventDefault();
    e.target.blur();
  }
});

addBtn.addEventListener('click', handleAdd);
input.addEventListener('keydown', e => { if (e.key === 'Enter') handleAdd(); });

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
  });
});

clearBtn.addEventListener('click', async () => {
  await api.clearCompleted(session.access_token);
  todos = todos.filter(t => !t.done);
  render();
});

// ── Error translation ─────────────────────────────────────────────────────────
function translateError(msg) {
  if (!msg) return 'Bir hata oluştu.';
  if (msg.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (msg.includes('Email not confirmed'))       return 'E-postanı henüz onaylamamışsın. Gelen kutunu kontrol et.';
  if (msg.includes('User already registered'))   return 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.';
  if (msg.includes('Password should be'))        return 'Şifre en az 6 karakter olmalı.';
  if (msg.includes('rate limit'))                return 'Çok fazla deneme. Lütfen bekle.';
  if (msg.includes('invalid email'))             return 'Geçersiz e-posta adresi.';
  return msg;
}

// ── Init: URL fragment'tan oturum al (e-posta onayı) ─────────────────────────
async function init() {
  // GitHub Pages'de onay linki #access_token=... şeklinde gelir
  const hash   = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  if (params.get('access_token') && params.get('type') === 'signup') {
    // Onay linki tıklandı — oturumu kur ve URL'yi temizle
    const token = {
      access_token:  params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      user: null,
    };
    // Kullanıcı bilgisini al
    try {
      const res  = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: authHeaders(token.access_token),
      });
      token.user = await res.json();
    } catch {}
    saveSession(token);
    history.replaceState(null, '', window.location.pathname);
    await enterApp();
    return;
  }

  // Mevcut oturumu yükle
  const saved = loadSession();
  if (saved?.access_token) {
    session = saved;
    await enterApp();
    return;
  }

  showScreen('auth');
}

init();
