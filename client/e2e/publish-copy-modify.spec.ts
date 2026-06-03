import { expect, test } from '@playwright/test';
import { clearAuth, createSet, login, signup, uniqueEmail } from './helpers';

test('user can copy public flashcard set and modify it', async ({ page }) => {
    const publishEmail = uniqueEmail('user-publish');
    const copyEmail = uniqueEmail('user-copy');

    await signup(page, publishEmail);

    await createSet(page, 'test set', [
        { front: 'card1 front', back: 'card1 back' },
        { front: 'card2 front', back: 'card2 back' },
    ]);

    await createSet(page, 'private set',  [
        { front: 'private card1 front', back: 'private card1 back' },
        { front: 'private card2 front', back: 'private card2 back' },
    ]);

    await page.getByTestId('publish-button').click();
    await expect(page.getByText('Set published.')).toBeVisible();

    await clearAuth(page);
    await signup(page, copyEmail);

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Public sets' }).click();
    await expect(page.getByText('test set')).toBeVisible();
    await expect(page.getByText('private set')).not.toBeVisible();

    await page.getByRole('article').filter({ hasText: 'test set' }).getByRole('button', { name: /make a copy/i }).click();

    await expect(page).toHaveURL(/\/flashcards\/[^/]+\/edit/);
    await expect(page.getByTestId('set-title-input')).toHaveValue('Copy of test set');

    await page.getByTestId('set-title-input').fill('modify test set');
    await page.getByTestId('card-front-0').fill('modify card1 front');

    await page.getByTestId('start-studying-button').click();
    await expect(page.getByText('modify test set')).toBeVisible();
    await expect(page.getByText('modify card1 front')).toBeVisible();
})