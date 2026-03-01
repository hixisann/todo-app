const { test, expect } = require('@playwright/test');

const EMAIL = 'test@example.com';
const PASSWORD = 'testpass123';

// ===========================
// 認証画面・ログイン系
// ===========================

test.describe('認証・ログイン系', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
    await page.fill('#auth-email', EMAIL);
    await page.fill('#auth-password', PASSWORD);
    await page.click('#signup-btn');
    await page.waitForTimeout(2000);
    await page.close();
  });

  async function clearSession(page) {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
  }

  test('初期表示でログイン画面が表示される', async ({ page }) => {
    await clearSession(page);
    await expect(page.locator('#auth-container')).toBeVisible();
    await expect(page.locator('#app-container')).toBeHidden();
  });

  test('正しい認証情報でログインできる', async ({ page }) => {
    await clearSession(page);
    await page.fill('#auth-email', EMAIL);
    await page.fill('#auth-password', PASSWORD);
    await page.click('#login-btn');
    await page.waitForSelector('#app-container', { state: 'visible', timeout: 10000 });
    await expect(page.locator('#app-container')).toBeVisible();
    await expect(page.locator('#auth-container')).toBeHidden();
  });

  test('誤ったパスワードではログインできない', async ({ page }) => {
    await clearSession(page);
    await page.fill('#auth-email', EMAIL);
    await page.fill('#auth-password', 'wrongpassword');
    await page.click('#login-btn');
    await page.waitForTimeout(2000);
    await expect(page.locator('#auth-container')).toBeVisible();
    await expect(page.locator('#auth-message')).not.toBeEmpty();
  });

  test('存在しないメールアドレスではログインできない', async ({ page }) => {
    await clearSession(page);
    await page.fill('#auth-email', 'notexist@example.com');
    await page.fill('#auth-password', PASSWORD);
    await page.click('#login-btn');
    await page.waitForTimeout(2000);
    await expect(page.locator('#auth-container')).toBeVisible();
    await expect(page.locator('#auth-message')).not.toBeEmpty();
  });

  test('空のフォームではログインできない', async ({ page }) => {
    await clearSession(page);
    await page.click('#login-btn');
    await page.waitForTimeout(2000);
    await expect(page.locator('#auth-container')).toBeVisible();
  });

  test('ログアウトするとログイン画面に戻る', async ({ page }) => {
    await clearSession(page);
    await page.fill('#auth-email', EMAIL);
    await page.fill('#auth-password', PASSWORD);
    await page.click('#login-btn');
    await page.waitForSelector('#app-container', { state: 'visible', timeout: 10000 });
    await page.click('#logout-btn');
    await page.waitForSelector('#auth-container', { state: 'visible', timeout: 5000 });
    await expect(page.locator('#auth-container')).toBeVisible();
    await expect(page.locator('#app-container')).toBeHidden();
  });
});

// ===========================
// ボタン動作・Todo操作
// ===========================

test.describe('ボタン動作・Todo操作', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
    await page.fill('#auth-email', EMAIL);
    await page.fill('#auth-password', PASSWORD);
    await page.click('#signup-btn');
    await page.waitForTimeout(2000);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
    await page.fill('#auth-email', EMAIL);
    await page.fill('#auth-password', PASSWORD);
    await page.click('#login-btn');
    await page.waitForSelector('#app-container', { state: 'visible', timeout: 10000 });
    await page.evaluate(async () => {
      const { data } = await supabaseClient.from('todos').select('id');
      if (data && data.length > 0) {
        await supabaseClient.from('todos').delete().in('id', data.map(t => t.id));
      }
      await loadTodos();
    });
    await page.waitForTimeout(500);
  });

  test.afterEach(async ({ page }) => {
    if (await page.locator('#logout-btn').isVisible()) {
      await page.click('#logout-btn');
      await page.waitForSelector('#auth-container', { state: 'visible', timeout: 5000 });
    }
  });

  // --- 追加ボタン ---

  test('追加ボタンでTodoを追加できる', async ({ page }) => {
    await page.fill('#todo-input', 'テストタスク');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toHaveText('テストタスク');
  });

  test('Enterキーでも追加できる', async ({ page }) => {
    await page.fill('#todo-input', 'Enterで追加');
    await page.press('#todo-input', 'Enter');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toHaveText('Enterで追加');
  });

  test('空文字では追加されない', async ({ page }) => {
    await page.click('#add-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });

  test('追加後に入力フィールドが空になる', async ({ page }) => {
    await page.fill('#todo-input', 'クリアテスト');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await expect(page.locator('#todo-input')).toHaveValue('');
  });

  // --- チェックボックス ---

  test('チェックボックスでTodoを完了状態にできる', async ({ page }) => {
    await page.fill('#todo-input', '完了テスト');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await page.click('.todo-item input[type="checkbox"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('.todo-item')).toHaveClass(/completed/);
  });

  test('チェックボックスで完了状態を未完了に戻せる', async ({ page }) => {
    await page.fill('#todo-input', 'トグルテスト');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await page.click('.todo-item input[type="checkbox"]');
    await page.waitForTimeout(1000);
    await page.click('.todo-item input[type="checkbox"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('.todo-item')).not.toHaveClass(/completed/);
  });

  // --- 削除ボタン ---

  test('削除ボタンでTodoを削除できる', async ({ page }) => {
    await page.fill('#todo-input', '削除テスト');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await page.click('.delete-btn');
    await page.waitForTimeout(1000);
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });

  // --- 完了済みを削除ボタン ---

  test('完了済みを削除ボタンで完了済みのみ削除される', async ({ page }) => {
    await page.fill('#todo-input', '残すタスク');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await page.fill('#todo-input', '削除されるタスク');
    await page.click('#add-btn');
    await page.waitForTimeout(1000);
    await page.locator('.todo-item').last().locator('input[type="checkbox"]').click();
    await page.waitForTimeout(1000);
    await page.click('#clear-completed-btn');
    await page.waitForTimeout(1000);
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toHaveText('残すタスク');
  });

  // --- フィルターボタン ---

  test('「未完了」フィルターが機能する', async ({ page }) => {
    await page.fill('#todo-input', '未完了タスク');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await page.fill('#todo-input', '完了タスク');
    await page.click('#add-btn');
    await page.waitForTimeout(1000);
    await page.locator('.todo-item').last().locator('input[type="checkbox"]').click();
    await page.waitForTimeout(1000);
    await page.click('[data-filter="active"]');
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toHaveText('未完了タスク');
  });

  test('「完了済み」フィルターが機能する', async ({ page }) => {
    await page.fill('#todo-input', '未完了タスク');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await page.fill('#todo-input', '完了タスク');
    await page.click('#add-btn');
    await page.waitForTimeout(1000);
    await page.locator('.todo-item').last().locator('input[type="checkbox"]').click();
    await page.waitForTimeout(1000);
    await page.click('[data-filter="completed"]');
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toHaveText('完了タスク');
  });

  test('「すべて」フィルターで全件表示に戻る', async ({ page }) => {
    await page.fill('#todo-input', '未完了タスク');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await page.fill('#todo-input', '完了タスク');
    await page.click('#add-btn');
    await page.waitForTimeout(1000);
    await page.locator('.todo-item').last().locator('input[type="checkbox"]').click();
    await page.waitForTimeout(1000);
    await page.click('[data-filter="active"]');
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await page.click('[data-filter="all"]');
    await expect(page.locator('.todo-item')).toHaveCount(2);
  });

  test('フィルターボタンのアクティブ状態が切り替わる', async ({ page }) => {
    await page.click('[data-filter="active"]');
    await expect(page.locator('[data-filter="active"]')).toHaveClass(/active/);
    await expect(page.locator('[data-filter="all"]')).not.toHaveClass(/active/);
    await page.click('[data-filter="completed"]');
    await expect(page.locator('[data-filter="completed"]')).toHaveClass(/active/);
    await expect(page.locator('[data-filter="active"]')).not.toHaveClass(/active/);
  });

  // --- 残り件数 ---

  test('残り件数が正しく表示される', async ({ page }) => {
    await expect(page.locator('#remaining-count')).toHaveText('残り 0 件');
    await page.fill('#todo-input', 'タスク1');
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await expect(page.locator('#remaining-count')).toHaveText('残り 1 件');
    await page.fill('#todo-input', 'タスク2');
    await page.click('#add-btn');
    await page.waitForTimeout(1000);
    await expect(page.locator('#remaining-count')).toHaveText('残り 2 件');
    await page.locator('.todo-item').first().locator('input[type="checkbox"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#remaining-count')).toHaveText('残り 1 件');
  });
});

// ===========================
// SQLインジェクション対策
// ===========================

test.describe('SQLインジェクション対策', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
    await page.fill('#auth-email', EMAIL);
    await page.fill('#auth-password', PASSWORD);
    await page.click('#login-btn');
    await page.waitForSelector('#app-container', { state: 'visible', timeout: 10000 });
    await page.evaluate(async () => {
      const { data } = await supabaseClient.from('todos').select('id');
      if (data && data.length > 0) {
        await supabaseClient.from('todos').delete().in('id', data.map(t => t.id));
      }
      await loadTodos();
    });
    await page.waitForTimeout(500);
  });

  test.afterEach(async ({ page }) => {
    if (await page.locator('#logout-btn').isVisible()) {
      await page.click('#logout-btn');
      await page.waitForSelector('#auth-container', { state: 'visible', timeout: 5000 });
    }
  });

  test("クラシックSQLインジェクションがテキストとして保存される", async ({ page }) => {
    const input = "'; DROP TABLE todos; --";
    await page.fill('#todo-input', input);
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await expect(page.locator('.todo-text')).toHaveText(input);
    await expect(page.locator('.todo-item')).toHaveCount(1);
  });

  test("OR条件SQLインジェクションがテキストとして保存される", async ({ page }) => {
    const input = "' OR '1'='1";
    await page.fill('#todo-input', input);
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await expect(page.locator('.todo-text')).toHaveText(input);
    await expect(page.locator('.todo-item')).toHaveCount(1);
  });

  test("ダブルクォートSQLインジェクションがテキストとして保存される", async ({ page }) => {
    const input = '" OR "1"="1';
    await page.fill('#todo-input', input);
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await expect(page.locator('.todo-text')).toHaveText(input);
    await expect(page.locator('.todo-item')).toHaveCount(1);
  });

  test("XSS文字列がスクリプトとして実行されずテキスト表示される", async ({ page }) => {
    const input = "<script>alert('XSS')</script>";
    let alertFired = false;
    page.on('dialog', () => { alertFired = true; });
    await page.fill('#todo-input', input);
    await page.click('#add-btn');
    await page.waitForSelector('.todo-item', { timeout: 10000 });
    await expect(page.locator('.todo-text')).toHaveText(input);
    expect(alertFired).toBe(false);
  });
});
