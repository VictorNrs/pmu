import { expect, test, type Locator, type Page } from '@playwright/test';

async function chooseOption(page: Page, select: Locator, text: string): Promise<void> {
  await select.click();
  await page.keyboard.type(text);
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page
    .locator('.n-base-select-option', { hasText: new RegExp(`^\\s*${escaped}\\b`) })
    .first()
    .click();
}

async function createStallion(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Ajouter un étalon' }).click();
  const dialog = page.locator('.n-modal').last();
  await dialog.getByPlaceholder('Ex. Siyouni').fill(name);
  await dialog.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Étalon ajouté.')).toBeVisible();
}

test.describe.serial('Main workflow', () => {
  test('creates stallions and a horse', async ({ page }) => {
    await page.goto('/etalons');
    await createStallion(page, 'Siyouni');
    await createStallion(page, 'Dubawi');
    await expect(page.getByRole('link', { name: 'Dubawi' })).toBeVisible();

    await page.goto('/chevaux');
    await page.getByRole('button', { name: 'Ajouter un cheval' }).click();
    const dialog = page.locator('.n-modal').last();
    await dialog.getByPlaceholder('Nom du cheval').fill('Alpha Star');
    await chooseOption(page, dialog.locator('.n-select'), 'Siyouni');
    await dialog.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('cell', { name: 'Alpha Star' })).toBeVisible();
  });

  test('records a race, creating a horse on the fly', async ({ page }) => {
    await page.goto('/courses');
    await page.getByRole('button', { name: 'Saisir une course' }).click();
    const dialog = page.locator('.n-modal').last();
    await dialog.getByPlaceholder('Ex. Longchamp').fill('Longchamp');
    await chooseOption(page, dialog.locator('.n-select').nth(0), '1600 m');
    await chooseOption(page, dialog.locator('.n-select').nth(1), 'Souple');

    await chooseOption(page, dialog.locator('.participation-row__horse').first(), 'Alpha Star');
    await dialog.getByRole('button', { name: 'Ajouter un cheval' }).click();
    await dialog
      .locator('.participation-row')
      .nth(1)
      .getByRole('button', { name: 'Nouveau' })
      .click();
    const horseDialog = page.locator('.n-modal').last();
    await horseDialog.getByPlaceholder('Nom du cheval').fill('Beta Moon');
    await chooseOption(page, horseDialog.locator('.n-select'), 'Dubawi');
    await horseDialog.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Cheval ajouté.')).toBeVisible();

    await dialog.locator('.participation-row').nth(1).locator('input').last().fill('3');
    await dialog.getByRole('button', { name: 'Enregistrer la course' }).click();
    await expect(page.getByText('Course enregistrée.')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Longchamp' })).toBeVisible();
  });

  test('refuses the same horse twice on the same day', async ({ page }) => {
    await page.goto('/courses');
    await page.getByRole('button', { name: 'Saisir une course' }).click();
    const dialog = page.locator('.n-modal').last();
    await dialog.getByPlaceholder('Ex. Longchamp').fill('Chantilly');
    await chooseOption(page, dialog.locator('.n-select').nth(0), '2000 m');
    await chooseOption(page, dialog.locator('.n-select').nth(1), 'Bon');
    await chooseOption(page, dialog.locator('.participation-row__horse').first(), 'Alpha Star');
    await dialog.getByRole('button', { name: 'Enregistrer la course' }).click();
    await expect(page.getByText("Un cheval ne court qu'une course par jour")).toBeVisible();
  });

  test('shows the computed statistics and traces them back', async ({ page }) => {
    await page.goto('/statistiques/terrain');
    const siyouni = page.locator('tr', { has: page.getByRole('link', { name: 'Siyouni' }) });
    await expect(siyouni).toContainText('100,0 %');
    await expect(siyouni).toContainText('1,00');
    const dubawi = page.locator('tr', { has: page.getByRole('link', { name: 'Dubawi' }) });
    await expect(dubawi).toContainText('3,00');

    await siyouni.locator('.metric-cell', { hasText: '100,0 %' }).first().click();
    const drawer = page.locator('.n-drawer');
    await expect(drawer).toContainText('1 participation(s)');
    await expect(drawer).toContainText('Alpha Star');
    await page.screenshot({ path: 'test-results/terrain-table.png', fullPage: false });
  });

  test('shows the distance table and the charts', async ({ page }) => {
    await page.goto('/statistiques/distance');
    await expect(page.locator('th', { hasText: '1600 m' })).toBeVisible();
    await page.screenshot({ path: 'test-results/distance-table.png' });

    await page.goto('/graphiques');
    await expect(page.locator('[role="img"] svg').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/charts.png', fullPage: true });
  });

  test('protects a stallion with descendants and shows the dashboard', async ({ page }) => {
    await page.goto('/etalons');
    const row = page.locator('tr', { has: page.getByRole('link', { name: 'Siyouni' }) });
    await row.getByTitle('Supprimer').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
    await expect(page.getByText('Impossible de supprimer Siyouni')).toBeVisible();

    await page.goto('/');
    await expect(page.getByText('Courses saisies')).toBeVisible();
    await page.screenshot({ path: 'test-results/dashboard.png' });
  });
});
