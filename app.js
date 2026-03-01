// ===========================
// Supabase 初期化
// ===========================

const SUPABASE_URL = 'https://fsgfrlyiwzlijzuipplt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xOU1Epg9LW8u_uVlOsJ5fw_3Y5Is8li';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===========================
// 状態管理
// ===========================

let todos = [];
let currentFilter = 'all';
let currentUser = null;

// ===========================
// DOM要素の取得
// ===========================

const todoInput = document.getElementById('todo-input');
const todoNote = document.getElementById('todo-note');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const emptyMessage = document.getElementById('empty-message');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const authMessage = document.getElementById('auth-message');

// ===========================
// Supabase データ操作
// ===========================

async function loadTodos() {
  const { data, error } = await supabaseClient
    .from('todos')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error(error); return; }
  todos = data;
  render();
}

async function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  const note = todoNote.value.trim();

  const { error } = await supabaseClient
    .from('todos')
    .insert({ text, note, completed: false, user_id: currentUser.id });
  if (error) { console.error(error); return; }

  todoInput.value = '';
  todoNote.value = '';
  await loadTodos();
}

async function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const { error } = await supabaseClient
    .from('todos')
    .update({ completed: !todo.completed })
    .eq('id', id);
  if (error) { console.error(error); return; }

  await loadTodos();
}

async function deleteTodo(id) {
  const { error } = await supabaseClient
    .from('todos')
    .delete()
    .eq('id', id);
  if (error) { console.error(error); return; }

  await loadTodos();
}

async function clearCompleted() {
  const completedIds = todos.filter(t => t.completed).map(t => t.id);
  if (completedIds.length === 0) return;

  const { error } = await supabaseClient
    .from('todos')
    .delete()
    .in('id', completedIds);
  if (error) { console.error(error); return; }

  await loadTodos();
}

// ===========================
// 認証
// ===========================

function translateAuthError(message) {
  if (message.includes('Invalid login credentials'))        return 'メールアドレスまたはパスワードが正しくありません。未登録の場合は新規登録をお試しください';
  if (message.includes('Email not confirmed'))              return 'メールアドレスが確認されていません';
  if (message.includes('User already registered'))          return 'このメールアドレスはすでに登録されています';
  if (message.includes('Password should be at least'))      return 'パスワードは6文字以上で入力してください';
  if (message.includes('invalid format') ||
      message.includes('Unable to validate email'))         return 'メールアドレスの形式が正しくありません';
  if (message.includes('Email rate limit exceeded'))        return 'メール送信の上限を超えました。しばらく経ってから再試行してください';
  if (message.includes('only request this after'))          return 'セキュリティのため、しばらく経ってから再試行してください';
  if (message.includes('signup is disabled'))               return '現在、新規登録は受け付けていません';
  return 'エラーが発生しました。しばらく経ってから再試行してください';
}

async function login() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email && !password) { authMessage.textContent = 'メールアドレスとパスワードを入力してください'; return; }
  if (!email)    { authMessage.textContent = 'メールアドレスを入力してください'; return; }
  if (!password) { authMessage.textContent = 'パスワードを入力してください'; return; }
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { authMessage.textContent = translateAuthError(error.message); }
}

async function signup() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email && !password) { authMessage.textContent = 'メールアドレスとパスワードを入力してください'; return; }
  if (!email)    { authMessage.textContent = 'メールアドレスを入力してください'; return; }
  if (!password) { authMessage.textContent = 'パスワードを入力してください'; return; }
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    authMessage.textContent = translateAuthError(error.message);
  } else {
    authMessage.textContent = '登録しました。ログインしてください。';
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
}

function showApp() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
  loadTodos();
}

function showAuth() {
  document.getElementById('auth-container').style.display = 'block';
  document.getElementById('app-container').style.display = 'none';
  todos = [];
  render();
}

// ===========================
// フィルタリング
// ===========================

function getFilteredTodos() {
  if (currentFilter === 'active') return todos.filter(t => !t.completed);
  if (currentFilter === 'completed') return todos.filter(t => t.completed);
  return todos;
}

// ===========================
// 画面の描画（レンダリング）
// ===========================

function render() {
  const filtered = getFilteredTodos();

  todoList.innerHTML = '';
  emptyMessage.style.display = filtered.length === 0 ? 'block' : 'none';

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const content = document.createElement('div');
    content.className = 'todo-content';

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    content.appendChild(span);

    if (todo.note) {
      const noteP = document.createElement('p');
      noteP.className = 'todo-note';
      noteP.textContent = todo.note;
      content.appendChild(noteP);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.title = '削除';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });

  const activeCount = todos.filter(t => !t.completed).length;
  remainingCount.textContent = `残り ${activeCount} 件`;
}

// ===========================
// イベントリスナーの設定
// ===========================

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});
clearCompletedBtn.addEventListener('click', clearCompleted);
loginBtn.addEventListener('click', login);
signupBtn.addEventListener('click', signup);
logoutBtn.addEventListener('click', logout);

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ===========================
// 初期化（認証状態の監視）
// ===========================

supabaseClient.auth.onAuthStateChange((_event, session) => {
  currentUser = session ? session.user : null;
  if (session) { showApp(); } else { showAuth(); }
});
