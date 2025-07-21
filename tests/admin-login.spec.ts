import { test, expect } from '@playwright/test';

test('Admin login - captura de tela e mensagens', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@fvstudios.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Aguarda qualquer navegação ou mudança de rota
  await page.waitForTimeout(3000);

  // Captura screenshot após tentativa de login
  await page.screenshot({ path: 'tests/screenshots/admin-login.png', fullPage: true });

  // Tenta capturar mensagens de erro ou sucesso
  const bodyText = await page.locator('body').innerText();
  console.log('Texto da página após login:', bodyText);

  // Verifica se houve redirecionamento para /admin, /dashboard ou /
  const url = page.url();
  expect([/\/admin/, /\/dashboard/, /\/$/].some((r) => r.test(url))).toBeTruthy();
});
