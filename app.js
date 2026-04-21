'use strict';

// ── State ────────────────────────────────────────────────────────────────────
let todos = JSON.parse(localStorage.getItem('todos') || '[]');
let filter = 'all';

// ── DOM refs ─────────────────────────────────────────────────────────────────
const input     = document.getElementById('todo-input');
const addBtn    = document.getElementById('add-btn');
const list      = document.getElementById('todo-list');
const summary   = document.getElementById('summary');
const remaining = document.getElementById('remaining');
const footer    = document.getElementById('footer');
const clearBtn  = document.getElementById('clear-btn');
const filterBtns = document.querySelectorAll('.filter-btn');

// ── Persistence ───────────────────────────────────────────────────────────────
function save() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function visibleTodos() {
  if (filter === 'active')    return todos.filter(t => !t.done);
  if (filter === 'completed') return todos.filter(t => t.done);
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

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const visible = visibleTodos();
  list.innerHTML = '';

  if (visible.length === 0) {
    const msg = filter === 'completed'
      ? 'Tamamlanan görev yok'
      : filter === 'active'
      ? 'Aktif görev yok'
      : 'Henüz görev eklenmedi';

    list.innerHTML = `<li class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <rect x="3" y="5" width="18" height="16" rx="2"/>
        <path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>
      </svg>
      ${msg}
    </li>`;
  } else {
    visible.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.done ? ' completed' : '');
      li.dataset.id = todo.id;

      li.innerHTML = `
        <button class="check-btn" aria-label="Tamamlandı olarak işaretle">${checkIcon()}</button>
        <span class="todo-text" contenteditable="plaintext-only"
          spellcheck="false" role="textbox" aria-label="Görev metni">${escHtml(todo.text)}</span>
        <button class="delete-btn" aria-label="Görevi sil">${trashIcon()}</button>
      `;

      list.appendChild(li);
    });
  }

  // Update counters
  const total     = todos.length;
  const doneCount = todos.filter(t => t.done).length;
  const leftCount = total - doneCount;

  summary.textContent = total === 0
    ? 'Hiç görev yok'
    : `${total} görev · ${doneCount} tamamlandı`;

  remaining.textContent = `${leftCount} görev kaldı`;
  footer.style.display  = total > 0 ? 'flex' : 'none';
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Actions ───────────────────────────────────────────────────────────────────
function addTodo(text) {
  text = text.trim();
  if (!text) return;
  todos.unshift({ id: createId(), text, done: false });
  save();
  render();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) { todo.done = !todo.done; save(); render(); }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  save();
  render();
}

function updateText(id, newText) {
  newText = newText.trim();
  if (!newText) { deleteTodo(id); return; }
  const todo = todos.find(t => t.id === id);
  if (todo) { todo.text = newText; save(); }
}

function clearCompleted() {
  todos = todos.filter(t => !t.done);
  save();
  render();
}

// ── Event delegation ──────────────────────────────────────────────────────────
list.addEventListener('click', e => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  const id = item.dataset.id;

  if (e.target.closest('.check-btn')) {
    toggleTodo(id);
  } else if (e.target.closest('.delete-btn')) {
    item.style.animation = 'none';
    item.style.transition = 'opacity 0.15s, transform 0.15s';
    item.style.opacity = '0';
    item.style.transform = 'translateX(12px)';
    setTimeout(() => deleteTodo(id), 150);
  }
});

// Inline editing — save on blur
list.addEventListener('blur', e => {
  if (!e.target.classList.contains('todo-text')) return;
  const item = e.target.closest('.todo-item');
  if (!item) return;
  updateText(item.dataset.id, e.target.textContent);
}, true);

// Prevent Enter key in contenteditable
list.addEventListener('keydown', e => {
  if (e.target.classList.contains('todo-text') && e.key === 'Enter') {
    e.preventDefault();
    e.target.blur();
  }
});

// Add todo
function handleAdd() {
  addTodo(input.value);
  input.value = '';
  input.focus();
}

addBtn.addEventListener('click', handleAdd);
input.addEventListener('keydown', e => { if (e.key === 'Enter') handleAdd(); });

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
  });
});

// Clear completed
clearBtn.addEventListener('click', clearCompleted);

// ── Init ──────────────────────────────────────────────────────────────────────
render();
