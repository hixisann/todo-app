// ===========================
// 状態管理
// ===========================

// タスクの配列。各タスクは { id, text, completed } の形式で管理する
let todos = [];

// 現在選択中のフィルター（'all' / 'active' / 'completed'）
let currentFilter = 'all';

// ===========================
// DOM要素の取得
// ===========================

// タスク入力フィールド
const todoInput = document.getElementById('todo-input');

// タスク追加ボタン
const addBtn = document.getElementById('add-btn');

// タスクを表示するリスト（ul要素）
const todoList = document.getElementById('todo-list');

// タスクが0件のときに表示するメッセージ
const emptyMessage = document.getElementById('empty-message');

// 残タスク件数を表示するspan
const remainingCount = document.getElementById('remaining-count');

// 完了済みタスクをまとめて削除するボタン
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// フィルターボタンのNodeList（複数あるのでquerySelectorAllを使用）
const filterBtns = document.querySelectorAll('.filter-btn');

// ===========================
// ローカルストレージ操作
// ===========================

// ページリロード後もタスクが消えないよう、ブラウザのローカルストレージに保存する

/**
 * タスク配列をローカルストレージに保存する
 * JSON文字列に変換して保存（ローカルストレージは文字列のみ扱える）
 */
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

/**
 * ローカルストレージからタスク配列を読み込む
 * データが存在しない場合は空配列を返す
 */
function loadTodos() {
  const stored = localStorage.getItem('todos');
  // stored が null（初回）の場合は空配列、それ以外はJSONをパースして返す
  return stored ? JSON.parse(stored) : [];
}

// ===========================
// タスクの追加
// ===========================

/**
 * 入力フィールドの値を取得してタスクを追加する
 * 空白のみの入力は追加しない
 */
function addTodo() {
  // 入力値の前後の空白を除去して取得
  const text = todoInput.value.trim();

  // 空文字の場合は何もしない
  if (!text) return;

  // 新しいタスクオブジェクトを作成
  const newTodo = {
    id: Date.now(),   // 一意のIDとして現在時刻のミリ秒を使用
    text: text,       // タスク名
    completed: false  // 初期状態は未完了
  };

  // タスク配列の末尾に追加
  todos.push(newTodo);

  // 入力フィールドを空にする
  todoInput.value = '';

  // 変更をローカルストレージに保存
  saveTodos();

  // 画面を再描画
  render();
}

// ===========================
// タスクの完了・未完了切り替え
// ===========================

/**
 * 指定したIDのタスクの完了状態を反転させる
 * @param {number} id - 切り替え対象のタスクID
 */
function toggleTodo(id) {
  todos = todos.map(todo => {
    if (todo.id === id) {
      // 対象タスクの completed を true/false 反転
      return { ...todo, completed: !todo.completed };
    }
    return todo; // 対象外はそのまま返す
  });

  saveTodos();
  render();
}

// ===========================
// タスクの削除
// ===========================

/**
 * 指定したIDのタスクを配列から削除する
 * @param {number} id - 削除対象のタスクID
 */
function deleteTodo(id) {
  // filter で対象ID以外のタスクだけを残す
  todos = todos.filter(todo => todo.id !== id);

  saveTodos();
  render();
}

/**
 * 完了済みのタスクをまとめて削除する
 */
function clearCompleted() {
  // completed が false のタスクのみ残す
  todos = todos.filter(todo => !todo.completed);

  saveTodos();
  render();
}

// ===========================
// フィルタリング
// ===========================

/**
 * 現在のフィルターに合わせてタスク配列を絞り込む
 * @returns {Array} フィルター後のタスク配列
 */
function getFilteredTodos() {
  if (currentFilter === 'active') {
    // 未完了のタスクのみ返す
    return todos.filter(todo => !todo.completed);
  }
  if (currentFilter === 'completed') {
    // 完了済みのタスクのみ返す
    return todos.filter(todo => todo.completed);
  }
  // 'all' の場合はすべてのタスクを返す
  return todos;
}

// ===========================
// 画面の描画（レンダリング）
// ===========================

/**
 * 現在の todos 配列とフィルターをもとに画面全体を更新する
 */
function render() {
  // フィルター後のタスク一覧を取得
  const filtered = getFilteredTodos();

  // リストを一旦空にしてから再描画（古い内容が残らないようにする）
  todoList.innerHTML = '';

  // タスクが1件もないときはメッセージを表示、あれば非表示
  emptyMessage.style.display = filtered.length === 0 ? 'block' : 'none';

  // フィルター後の各タスクをリストアイテムとして生成・追加
  filtered.forEach(todo => {
    // li要素を作成
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    // data属性にタスクIDを持たせる（イベントハンドラからIDを参照するため）
    li.dataset.id = todo.id;

    // チェックボックス（完了・未完了の切り替えに使用）
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed; // 完了済みならチェック済み状態にする
    // チェックを切り替えたときに toggleTodo を呼ぶ
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    // タスク名テキスト
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    // 削除ボタン（✕アイコン）
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.title = '削除';
    // クリックしたときに deleteTodo を呼ぶ
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    // li要素に各要素を追加
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);

    // リストに追加
    todoList.appendChild(li);
  });

  // 未完了タスクの件数を計算して表示
  const activeCount = todos.filter(todo => !todo.completed).length;
  remainingCount.textContent = `残り ${activeCount} 件`;
}

// ===========================
// イベントリスナーの設定
// ===========================

// 「追加」ボタンをクリックしたときにタスクを追加
addBtn.addEventListener('click', addTodo);

// 入力フィールドでEnterキーを押したときにもタスクを追加
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTodo();
  }
});

// 「完了済みを削除」ボタンのクリックイベント
clearCompletedBtn.addEventListener('click', clearCompleted);

// フィルターボタンのクリックイベント
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // すべてのフィルターボタンから active クラスを除去
    filterBtns.forEach(b => b.classList.remove('active'));

    // クリックされたボタンに active クラスを付与
    btn.classList.add('active');

    // data-filter属性の値を現在のフィルターとして設定
    currentFilter = btn.dataset.filter;

    // 画面を再描画
    render();
  });
});

// ===========================
// 初期化（ページ読み込み時の処理）
// ===========================

// ローカルストレージからタスクを読み込んで初期表示
todos = loadTodos();
render();
