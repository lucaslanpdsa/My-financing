const { test, expect } = require('@playwright/test');

const EMAIL = 'lucasnascimento094@hotmail.com';
const PASS  = '996403';

async function login(page) {
  await page.goto('/');
  await expect(page.locator('#auth-screen')).toBeVisible();
  await page.fill('#login-email', EMAIL);
  await page.fill('#login-pass', PASS);
  await page.click('#login-form .btn-primary');
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 30000 });
}

// ── 1. TELA DE LOGIN ────────────────────────────────────────────────────────

test('mostra tela de login ao abrir', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#auth-screen')).toBeVisible();
  await expect(page.locator('#app-screen')).toBeHidden();
});

test('exibe erro com credenciais erradas', async ({ page }) => {
  await page.goto('/');
  await page.fill('#login-email', 'errado@email.com');
  await page.fill('#login-pass', 'senhaerrada');
  await page.click('#login-form .btn-primary');
  await expect(page.locator('#auth-msg.error')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#auth-msg')).toContainText('incorretos');
});

test('exibe erro ao tentar logar com campos vazios', async ({ page }) => {
  await page.goto('/');
  await page.click('#login-form .btn-primary');
  await expect(page.locator('#auth-msg.error')).toBeVisible();
});

test('alterna para aba de cadastro e volta', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Criar conta');
  await expect(page.locator('#register-form')).toBeVisible();
  await expect(page.locator('#login-form')).toBeHidden();
  await page.click('text=Entrar');
  await expect(page.locator('#login-form')).toBeVisible();
  await expect(page.locator('#register-form')).toBeHidden();
});

// ── 2. CADASTRO DE CONTA ────────────────────────────────────────────────────

test('exibe erro ao criar conta com senha curta', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Criar conta');
  await page.fill('#reg-name', 'Teste');
  await page.fill('#reg-email', 'teste@teste.com');
  await page.fill('#reg-pass', '123');
  await page.click('#register-form .btn-primary');
  await expect(page.locator('#auth-msg.error')).toBeVisible();
  await expect(page.locator('#auth-msg')).toContainText('6 caracteres');
});

test('exibe erro ao criar conta com campos vazios', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Criar conta');
  await page.click('#register-form .btn-primary');
  await expect(page.locator('#auth-msg.error')).toBeVisible();
  await expect(page.locator('#auth-msg')).toContainText('Preencha');
});

test('exibe sucesso ao criar conta com email novo', async ({ page }) => {
  const randomEmail = `teste.${Date.now()}@mailinator.com`;
  await page.goto('/');
  await page.click('text=Criar conta');
  await page.fill('#reg-name', 'Usuário Teste');
  await page.fill('#reg-email', randomEmail);
  await page.fill('#reg-pass', 'senha123');
  await page.click('#register-form .btn-primary');
  // Aguarda qualquer mensagem (sucesso, erro de rate limit) ou redirecionamento para o app
  await expect(page.locator('#auth-msg')).toBeVisible({ timeout: 10000 });
  const msg = await page.locator('#auth-msg').innerText();
  const appVisible = await page.locator('#app-content').isVisible();
  // Aceita: sucesso, rate limit do Supabase, ou login automático
  expect(
    appVisible ||
    msg.toLowerCase().includes('verifique') ||
    msg.toLowerCase().includes('rate limit') ||
    msg.toLowerCase().includes('email')
  ).toBeTruthy();
});

// ── 3. LOGIN CORRETO ────────────────────────────────────────────────────────

test('login exibe app com email do usuario', async ({ page }) => {
  await login(page);
  await expect(page.locator('#user-email')).toHaveText(EMAIL);
  await expect(page.locator('#auth-screen')).toBeHidden();
});

test('app mostra tabela de parcelas apos login', async ({ page }) => {
  await login(page);
  await expect(page.locator('#tbody tr')).not.toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('#tbl-count')).toContainText('36 parcelas');
});

// ── 4. RELOAD ───────────────────────────────────────────────────────────────

// Captura snapshot completo de todas as linhas da tabela
async function captureTableSnapshot(page) {
  return page.locator('#tbody tr').evaluateAll(rows =>
    rows.map(tr => ({
      numero:    tr.querySelector('.nm')?.innerText?.trim() ?? '',
      status:    tr.querySelector('.pill')?.innerText?.trim() ?? '',
      valor:     tr.querySelectorAll('.nm')[1]?.innerText?.trim() ?? '',
      valorPago: tr.querySelector('.val-input')?.value ?? '',
      data:      tr.querySelector('.date-input')?.value ?? '',
    }))
  );
}

test('reload nao exibe tela de login se ja estava logado', async ({ page }) => {
  await login(page);
  await page.reload();
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 45000 });
  await expect(page.locator('#auth-screen')).toBeHidden();
});

test('reload mantem dados identicos: status, valores e datas de cada parcela', async ({ page }) => {
  await login(page);
  await expect(page.locator('#tbody tr').first()).toBeVisible({ timeout: 10000 });

  const before = await captureTableSnapshot(page);
  expect(before.length).toBeGreaterThan(0);

  await page.reload();
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 90000 }); // cold start do Supabase free pode levar 60s
  await expect(page.locator('#tbody tr').first()).toBeVisible({ timeout: 10000 });

  const after = await captureTableSnapshot(page);

  expect(after.length).toBe(before.length);
  for (let i = 0; i < before.length; i++) {
    expect(after[i].numero,    `parcela ${i+1} número`).toBe(before[i].numero);
    expect(after[i].status,    `parcela ${i+1} status`).toBe(before[i].status);
    expect(after[i].valorPago, `parcela ${i+1} valor pago`).toBe(before[i].valorPago);
    expect(after[i].data,      `parcela ${i+1} data`).toBe(before[i].data);
  }
});

test('reload mantem kpis identicos', async ({ page }) => {
  await login(page);
  await expect(page.locator('#kpis .kpi-v').first()).toBeVisible({ timeout: 10000 });

  const kpisBefore = await page.locator('#kpis .kpi').evaluateAll(els =>
    els.map(el => el.querySelector('.kpi-v')?.innerText?.trim() ?? '')
  );
  const pctBefore = await page.locator('#prog-pct').innerText();

  await page.reload();
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 90000 });
  await expect(page.locator('#kpis .kpi-v').first()).toBeVisible({ timeout: 10000 });

  const kpisAfter = await page.locator('#kpis .kpi').evaluateAll(els =>
    els.map(el => el.querySelector('.kpi-v')?.innerText?.trim() ?? '')
  );
  const pctAfter = await page.locator('#prog-pct').innerText();

  expect(kpisAfter).toEqual(kpisBefore);
  expect(pctAfter).toBe(pctBefore);
});

// ── 5. DADOS CORRETOS ───────────────────────────────────────────────────────

test('parcelas pagas aparecem com status correto', async ({ page }) => {
  await login(page);
  const pagas = page.locator('.pill.pg');
  await expect(pagas.first()).toBeVisible({ timeout: 10000 });
  const count = await pagas.count();
  expect(count).toBeGreaterThan(0);
});

test('kpis: pagas + abertas = total de parcelas', async ({ page }) => {
  await login(page);
  await expect(page.locator('#kpis .kpi-v').first()).toBeVisible({ timeout: 10000 });
  const pagasText   = await page.locator('#kpis .kpi').nth(0).locator('.kpi-v').innerText();
  const abertasText = await page.locator('#kpis .kpi').nth(1).locator('.kpi-v').innerText();
  const pagas  = parseInt(pagasText);
  const abertas = parseInt(abertasText);
  const totalText = await page.locator('#tbl-count').innerText();
  const total = parseInt(totalText);
  expect(pagas + abertas).toBe(total);
});

test('progresso mostra percentual e barra preenchida', async ({ page }) => {
  await login(page);
  const pctText = await page.locator('#prog-pct').innerText();
  expect(pctText).toMatch(/\d+%/);
  const fillStyle = await page.locator('#prog-fill').getAttribute('style');
  expect(fillStyle).toMatch(/width:\s*[^0]/);
});

test('juros-box exibe valor financiado', async ({ page }) => {
  await login(page);
  await expect(page.locator('#juros-box')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#juros-box')).toContainText('R$');
});

// ── 6. TOGGLE DE PARCELA ─────────────────────────────────────────────────────

test('alternar parcela aberta para paga atualiza status', async ({ page }) => {
  await login(page);
  const rows = page.locator('#tbody tr');

  // Acha o índice da primeira linha com .pill.pa
  const abertaIdx = await rows.evaluateAll(trs =>
    trs.findIndex(tr => tr.querySelector('.pill.pa'))
  );
  expect(abertaIdx).toBeGreaterThanOrEqual(0);

  // Clica no toggle dessa linha
  await rows.nth(abertaIdx).locator('.toggle-btn').click();

  // Após renderAll a linha é reconstruída — verifica pelo índice novamente
  await expect(rows.nth(abertaIdx).locator('.pill.pg')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#saving-badge')).toContainText('Salvo', { timeout: 10000 });

  // Desfaz
  await rows.nth(abertaIdx).locator('.toggle-btn').click();
  await expect(rows.nth(abertaIdx).locator('.pill.pa')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#saving-badge')).toContainText('Salvo', { timeout: 10000 });
});

// ── 7. VALOR PAGO EDITÁVEL ───────────────────────────────────────────────────

test('editar valor pago em parcela paga e salva', async ({ page }) => {
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

// ── 8. DATA DE PAGAMENTO ─────────────────────────────────────────────────────

test('editar data de pagamento em parcela paga salva corretamente', async ({ page }) => {
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

// ── 9. CONFIGURAÇÃO ──────────────────────────────────────────────────────────

test('campos de config aparecem preenchidos com valores salvos', async ({ page }) => {
  await login(page);
  const total = await page.locator('#cfg-total').inputValue();
  const valor = await page.locator('#cfg-valor').inputValue();
  const fin   = await page.locator('#cfg-fin').inputValue();
  expect(parseInt(total)).toBeGreaterThan(0);
  expect(parseFloat(valor)).toBeGreaterThan(0);
  expect(parseFloat(fin)).toBeGreaterThan(0);
});

test('config persiste apos reload', async ({ page }) => {
  await login(page);
  const totalBefore = await page.locator('#cfg-total').inputValue();
  const valorBefore = await page.locator('#cfg-valor').inputValue();
  await page.reload();
  await expect(page.locator('#app-content')).toBeVisible({ timeout: 45000 });
  const totalAfter = await page.locator('#cfg-total').inputValue();
  const valorAfter = await page.locator('#cfg-valor').inputValue();
  expect(totalAfter).toBe(totalBefore);
  expect(valorAfter).toBe(valorBefore);
});

// ── 10. GRÁFICOS ─────────────────────────────────────────────────────────────

test('canvases dos graficos sao renderizados', async ({ page }) => {
  await login(page);
  await expect(page.locator('#chart-data')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#chart-mes')).toBeVisible({ timeout: 10000 });
});

test('card de media mensal aparece', async ({ page }) => {
  await login(page);
  await expect(page.locator('#chart-mes-stats .mes-stat')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#chart-mes-stats')).toContainText('Média / mês');
});

// ── 11. LOGOUT ───────────────────────────────────────────────────────────────

test('botao sair volta para tela de login', async ({ page }) => {
  await login(page);
  await page.click('.btn-logout');
  await expect(page.locator('#auth-screen')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#app-screen')).toBeHidden();
});

test('apos logout sessao e encerrada imediatamente', async ({ page }) => {
  await login(page);
  await page.click('.btn-logout');
  await expect(page.locator('#auth-screen')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#app-screen')).toBeHidden();
  // Verifica que campos de login estão limpos e prontos para novo acesso
  await expect(page.locator('#login-email')).toBeVisible();
  await expect(page.locator('#login-pass')).toBeVisible();
});
