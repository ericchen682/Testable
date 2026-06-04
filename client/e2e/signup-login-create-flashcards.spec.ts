import { expect, test } from '@playwright/test';
import { clearAuth, createSet, login, signup, uniqueEmail } from './helpers';

test('user can sign up, log in, create a flashcard set, and view it', async ({ page }) => {
    const email = uniqueEmail('user-one');

    await signup(page, email);
    await clearAuth(page);
    await login(page, email);

    await createSet(page, 'test set', [
        { front: 'card1 front', back: 'card1 back' },
        { front: 'card2 front', back: 'card2 back' },
    ]);

    await page.getByTestId('start-studying-button').click();

    await expect(page).toHaveURL(/\/flashcards\/[^/]+$/);
    await expect(page.getByText('test set')).toBeVisible();
    await expect(page.getByText('card1 front')).toBeVisible();
    await expect(page.getByText('card1 back')).not.toBeVisible();
})