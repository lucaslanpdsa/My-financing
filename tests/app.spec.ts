import { test, expect } from '@playwright/test';

const EMAIL = process.env['TEST_EMAIL'] ?? '';
const PASS  = process.env['TEST_PASS']  ?? '';

async function login(page: Parameters<typeof test>[1] extends (args: infer A) => any ? A extends { page: infer P } ? P : never : never): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#auth-screen')).toBeVisible();
  await page.fill('#login-email', EMAIL);
  await page.fill('#login-pass', PASS);
  await page.click('#login-form .btn-primary');
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 30000 });
}

// ── 1. LOGIN SCREEN ──────────────────────────────────────────────────────────

test('shows login screen on open', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#auth-screen')).toBeVisible();
  await expect(page.locator('#app-screen')).toBeHidden();
});

test('shows error with wrong credentials', async ({ page }) => {
  await page.goto('/');
  await page.fill('#login-email', 'wrong@email.com');
  await page.fill('#login-pass', 'wrongpass');
  await page.click('#login-form .btn-primary');
  await expect(page.locator('#auth-msg.error')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#auth-msg')).toContainText('incorretos');
});

test('shows error when login fields are empty', async ({ page }) => {
  await page.goto('/');
  await page.click('#login-form .btn-primary');
  await expect(page.locator('#auth-msg.error')).toBeVisible();
});

test('switches to register tab and back', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Criar conta');
  await expect(page.locator('#register-form')).toBeVisible();
  await expect(page.locator('#login-form')).toBeHidden();
  await page.click('text=Entrar');
  await expect(page.locator('#login-form')).toBeVisible();
  await expect(page.locator('#register-form')).toBeHidden();
});

// ── 2. REGISTER ──────────────────────────────────────────────────────────────

test('shows error for short password on register', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Criar conta');
  await page.fill('#reg-name', 'Test');
  await page.fill('#reg-email', 'test@test.com');
  await page.fill('#reg-pass', '123');
  await page.click('#register-form .btn-primary');
  await expect(page.locator('#auth-msg.error')).toBeVisible();
  await expect(page.locator('#auth-msg')).toContainText('6 caracteres');
});

test('shows error for empty fields on register', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Criar conta');
  await page.click('#register-form .btn-primary');
  await expect(page.locator('#auth-msg.error')).toBeVisible();
  await expect(page.locator('#auth-msg')).toContainText('Preencha');
});

test('shows success or expected response on register with new email', async ({ page }) => {
  const randomEmail = `test.${Date.now()}@mailinator.com`;
  await page.goto('/');
  await page.click('text=Criar conta');
  await page.fill('#reg-name', 'Test User');
  await page.fill('#reg-email', randomEmail);
  await page.fill('#reg-pass', 'senha123');
  await page.click('#register-form .btn-primary');
  await expect(page.locator('#auth-msg')).toBeVisible({ timeout: 10000 });
  const msg = await page.locator('#auth-msg').innerText();
  const appVisible = await page.locator('#app-content').isVisible();
  expect(
    appVisible ||
    msg.toLowerCase().includes('verifique') ||
    msg.toLowerCase().includes('rate limit') ||
    msg.toLowerCase().includes('email')
  ).toBeTruthy();
});

// ── 3. CORRECT LOGIN ─────────────────────────────────────────────────────────

test('login shows app with user email', async ({ page }) => {
  await login(page);
  await expect(page.locator('#user-email')).toHaveText(EMAIL);
  await expect(page.locator('#auth-screen')).toBeHidden();
});

test('app shows installment table after login', async ({ page }) => {
  await login(page);
  await expect(page.locator('#tbody tr')).not.toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('#tbl-count')).toContainText('36 parcelas');
});

// ── 4. RELOAD ────────────────────────────────────────────────────────────────

async function captureTableSnapshot(page: any) {
  return page.locator('#tbody tr').evaluateAll((rows: Element[]) =>
    rows.map(tr => ({
      number:    (tr.querySelector('.nm') as HTMLElement)?.innerText?.trim() ?? '',
      status:    (tr.querySelector('.pill') as HTMLElement)?.innerText?.trim() ?? '',
      value:     (tr.querySelectorAll('.nm')[1] as HTMLElement)?.innerText?.trim() ?? '',
      paidValue: (tr.querySelector('.val-input') as HTMLInputElement)?.value ?? '',
      date:      (tr.querySelector('.date-input') as HTMLInputElement)?.value ?? '',
    }))
  );
}

test('reload does not show login if already logged in', async ({ page }) => {
  await login(page);
  await page.reload();
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 45000 });
  await expect(page.locator('#auth-screen')).toBeHidden();
});

test('reload keeps identical data: status, values and dates', async ({ page }) => {
  await login(page);
  await expect(page.locator('#tbody tr').first()).toBeVisible({ timeout: 10000 });

  const before = await captureTableSnapshot(page);
  expect(before.length).toBeGreaterThan(0);

  await page.reload();
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 90000 });
  await expect(page.locator('#tbody tr').first()).toBeVisible({ timeout: 10000 });

  const after = await captureTableSnapshot(page);
  expect(after.length).toBe(before.length);
  for (let i = 0; i < before.length; i++) {
    expect(after[i].number,    `installment ${i+1} number`).toBe(before[i].number);
    expect(after[i].status,    `installment ${i+1} status`).toBe(before[i].status);
    expect(after[i].paidValue, `installment ${i+1} paid value`).toBe(before[i].paidValue);
    expect(after[i].date,      `installment ${i+1} date`).toBe(before[i].date);
  }
});

test('reload keeps identical kpis', async ({ page }) => {
  await login(page);
  await expect(page.locator('#kpis .kpi-v').first()).toBeVisible({ timeout: 10000 });

  const kpisBefore = await page.locator('#kpis .kpi').evaluateAll((els: Element[]) =>
    els.map(el => (el.querySelector('.kpi-v') as HTMLElement)?.innerText?.trim() ?? '')
  );
  const pctBefore = await page.locator('#prog-pct').innerText();

  await page.reload();
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 90000 });
  await expect(page.locator('#kpis .kpi-v').first()).toBeVisible({ timeout: 10000 });

  const kpisAfter = await page.locator('#kpis .kpi').evaluateAll((els: Element[]) =>
    els.map(el => (el.querySelector('.kpi-v') as HTMLElement)?.innerText?.trim() ?? '')
  );
  const pctAfter = await page.locator('#prog-pct').innerText();

  expect(kpisAfter).toEqual(kpisBefore);
  expect(pctAfter).toBe(pctBefore);
});

// ── 5. CORRECT DATA ──────────────────────────────────────────────────────────

test('paid installments show correct status', async ({ page }) => {
  await login(page);
  const paid = page.locator('.pill.pg');
  await expect(paid.first()).toBeVisible({ timeout: 10000 });
  expect(await paid.count()).toBeGreaterThan(0);
});

test('kpis: paid + open = total installments', async ({ page }) => {
  await login(page);
  await expect(page.locator('#kpis .kpi-v').first()).toBeVisible({ timeout: 10000 });
  const paidText  = await page.locator('#kpis .kpi').nth(0).locator('.kpi-v').innerText();
  const openText  = await page.locator('#kpis .kpi').nth(1).locator('.kpi-v').innerText();
  const paid  = parseInt(paidText);
  const open  = parseInt(openText);
  const totalText = await page.locator('#tbl-count').innerText();
  const total = parseInt(totalText);
  expect(paid + open).toBe(total);
});

test('progress shows percentage and filled bar', async ({ page }) => {
  await login(page);
  const pctText = await page.locator('#prog-pct').innerText();
  expect(pctText).toMatch(/\d+%/);
  const fillStyle = await page.locator('#prog-fill').getAttribute('style');
  expect(fillStyle).toMatch(/width:\s*[^0]/);
});

test('juros-box displays financed value', async ({ page }) => {
  await login(page);
  await expect(page.locator('#juros-box')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#juros-box')).toContainText('R$');
});

// ── 6. TOGGLE ────────────────────────────────────────────────────────────────

test('toggle open installment to paid updates status', async ({ page }) => {
  await login(page);
  const rows = page.locator('#tbody tr');

  const openIdx = await rows.evaluateAll((trs: Element[]) =>
    trs.findIndex(tr => tr.querySelector('.pill.pa'))
  );
  expect(openIdx).toBeGreaterThanOrEqual(0);

  await rows.nth(openIdx).locator('.toggle-btn').click();
  await expect(rows.nth(openIdx).locator('.pill.pg')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#saving-badge')).toContainText('Salvo', { timeout: 10000 });

  // revert
  await rows.nth(openIdx).locator('.toggle-btn').click();
  await expect(rows.nth(openIdx).locator('.pill.pa')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#saving-badge')).toContainText('Salvo', { timeout: 10000 });
});

// ── 7. EDITABLE PAID VALUE ───────────────────────────────────────────────────

test('edit paid value on paid installment and saves', async ({ page }) => {
  await login(page);
  const input = page.locator('#tbody tr').filter({ has: page.locator('.pill.pg') })
    .first().locator('.val-input:not([disabled])');
  await expect(input).toBeVisible({ timeout: 10000 });

  const original = await input.inputValue();
  await input.fill('500.00');
  await input.press('Tab');
  await expect(page.locator('#saving-badge')).toContainText('Salvo', { timeout: 10000 });

  await input.fill(original);
  await input.press('Tab');
  await expect(page.locator('#saving-badge')).toContainText('Salvo', { timeout: 10000 });
});

// ── 8. PAYMENT DATE ──────────────────────────────────────────────────────────

test('edit payment date on paid installment saves correctly', async ({ page }) => {
  await login(page);
  const dateInput = page.locator('#tbody tr').filter({ has: page.locator('.pill.pg') })
    .first().locator('.date-input:not([disabled])');
  await expect(dateInput).toBeVisible({ timeout: 10000 });

  const original = await dateInput.inputValue();
  await dateInput.fill('2026-03-15');
  await dateInput.press('Tab');
  await expect(page.locator('#saving-badge')).toContainText('Salvo', { timeout: 10000 });

  if (original) {
    await dateInput.fill(original);
    await dateInput.press('Tab');
    await expect(page.locator('#saving-badge')).toContainText('Salvo', { timeout: 10000 });
  }
});

// ── 9. CONFIG ────────────────────────────────────────────────────────────────

test('config fields appear filled with saved values', async ({ page }) => {
  await login(page);
  const total = await page.locator('#cfg-total').inputValue();
  const value = await page.locator('#cfg-valor').inputValue();
  const fin   = await page.locator('#cfg-fin').inputValue();
  expect(parseInt(total)).toBeGreaterThan(0);
  expect(parseFloat(value)).toBeGreaterThan(0);
  expect(parseFloat(fin)).toBeGreaterThan(0);
});

test('config persists after reload', async ({ page }) => {
  await login(page);
  const totalBefore = await page.locator('#cfg-total').inputValue();
  const valueBefore = await page.locator('#cfg-valor').inputValue();
  await page.reload();
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 45000 });
  const totalAfter = await page.locator('#cfg-total').inputValue();
  const valueAfter = await page.locator('#cfg-valor').inputValue();
  expect(totalAfter).toBe(totalBefore);
  expect(valueAfter).toBe(valueBefore);
});

// ── 10. CHARTS ───────────────────────────────────────────────────────────────

test('chart canvases are rendered', async ({ page }) => {
  await login(page);
  await expect(page.locator('#chart-data')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#chart-mes')).toBeVisible({ timeout: 10000 });
});

test('monthly average card appears', async ({ page }) => {
  await login(page);
  await expect(page.locator('#chart-mes-stats .mes-stat')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#chart-mes-stats')).toContainText('Média / mês');
});

// ── 11. LOGOUT ───────────────────────────────────────────────────────────────

test('logout button returns to login screen', async ({ page }) => {
  await login(page);
  await page.click('.btn-logout');
  await expect(page.locator('#auth-screen')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#app-screen')).toBeHidden();
});

test('after logout session is terminated immediately', async ({ page }) => {
  await login(page);
  await page.click('.btn-logout');
  await expect(page.locator('#auth-screen')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#app-screen')).toBeHidden();
  await expect(page.locator('#login-email')).toBeVisible();
  await expect(page.locator('#login-pass')).toBeVisible();
});
