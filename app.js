'use strict';

// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://uhorkrljuusuiflcvmoo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVob3JrcmxqdXVzdWlmbGN2bW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjEyODMsImV4cCI6MjA5MjMzNzI4M30.3UlSNsTXpPkDHUdVdc7Vq8RH1Px6TocnLmJwVCz-_wg';

const BASE = `${SUPABASE_URL}/rest/v1/todos`;
const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, { headers: HEADERS, ...options });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Hatası: ${res.status} – ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const api = {
  getAll: ()         => apiFetch(`${BASE}?order=created_at.desc`),
  add:    (text)     => apiFetch(BASE, { method: 'POST', body: JSON.stringify({ text, done: false }) }),
  toggle: (id, done) => apiFetch(`${BASE}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ done }) }),
  update: (id, text) => apiFetch(`${BASE}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ text }) }),
  delete: (id)       => apiFetch(`${BASE}?id=eq.${id}`, { method: 'DELETE', headers: { ...HEADERS, Prefer: '' } }),
  clearCompleted: ()  => apiFetch(`${BASE}?done=eq.true`, { method: 'DELETE', headers: { ...HEADERS, Prefer: '' } }),
};

// ── State ─────────────────────────────────────────────────────────────────────
let todos  = [];
let filter = 'all';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const input      = document.getElementById('todo-input');
const addBtn     = document.getElementById('add-btn');
const list       = document.getElementById('todo-list');
const summary    = document.getElementById('summary');
const remaining  = document.getElementById('remaining');
const footer     = document.getElementById('footer');
const clearBtn   = document.getElementById('clear-btn');
const filterBtns = document.querySelectorAll('.filter-btn');

// ── Loading state ─────────────────────────────────────────────────────────────
function setLoading(on) {
  addBtn.disabled   = on;
  input.disabled    = on;
  addBtn.textContent = on ? '...' : 'Ekle';
}

// ── Render ────────────────────────────────────────────────────────────────────
function visibleTodos() {
  if (filter === 'active')    return todos.filter(t => !t.done);
  if (filter === 'completed') return todos.filter(t =>  t.done);
  return todos;
}

function checkIcon() {
  return `<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
      li.className = 'todo-item' + (todo.done ? ' completed' : '');
      li.dataset.id = todo.id;
      li.innerHTML = `
        <button class="check-btn" aria-label="Tamamlandı olarak işaretle">${checkIcon()}</button>
        <span class="todo-text" contenteditable="plaintext-only"
          spellcheck="false" role="textbox">${escHtml(todo.text)}</span>
        <button class="delete-btn" aria-label="Görevi sil">${trashIcon()}</button>`;
      list.appendChild(li);
    });
  }

  const total     = todos.length;
  const doneCount = todos.filter(t => t.done).length;
  const leftCount = total - doneCount;

  summary.textContent  = total === 0 ? 'Hiç görev yok' : `${total} görev · ${doneCount} tamamlandı`;
  remaining.textContent = `${leftCount} görev kaldı`;
  footer.style.display  = total > 0 ? 'flex' : 'none';
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function loadTodos() {
  setLoading(true);
  todos = await api.getAll();
  render();
  setLoading(false);
}

async function handleAdd() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  setLoading(true);
  const [created] = await api.add(text);
  todos.unshift(created);
  render();
  setLoading(false);
  input.focus();
}

async function handleToggle(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  const [updated] = await api.toggle(id, !todo.done);
  Object.assign(todo, updated);
  render();
}

async function handleDelete(id, li) {
  li.style.transition = 'opacity 0.15s, transform 0.15s';
  li.style.opacity = '0';
  li.style.transform = 'translateX(12px)';
  await new Promise(r => setTimeout(r, 150));
  await api.delete(id);
  todos = todos.filter(t => t.id !== id);
  render();
}

async function handleUpdateText(id, newText) {
  newText = newText.trim();
  if (!newText) {
    await api.delete(id);
    todos = todos.filter(t => t.id !== id);
    render();
    return;
  }
  await api.update(id, newText);
  const todo = todos.find(t => t.id === id);
  if (todo) todo.text = newText;
}

async function handleClearCompleted() {
  await api.clearCompleted();
  todos = todos.filter(t => !t.done);
  render();
}

// ── Events ────────────────────────────────────────────────────────────────────
list.addEventListener('click', e => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  const id = item.dataset.id;
  if (e.target.closest('.check-btn'))  handleToggle(id);
  if (e.target.closest('.delete-btn')) handleDelete(id, item);
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

clearBtn.addEventListener('click', handleClearCompleted);

// ── Init ──────────────────────────────────────────────────────────────────────
loadTodos();
