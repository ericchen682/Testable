import { expect, test } from '@playwright/test';
import { clearAuth, createSet, login, signup, uniqueEmail } from './helpers';

test('user can study a set and receive accurate analytics', async ({ page }) => {
    const email = uniqueEmail('user-analytics');
    await signup(page, email);

    await createSet(page, 'test set', [
        { front: 'card1 front', back: 'card1 back' },
        { front: 'card2 front', back: 'card2 back' },
        { front: 'card3 front', back: 'card3 back' },
    ]);

    await page.getByTestId('start-studying-button').click();

    await expect(page).toHaveURL(/\/flashcards\/[^/]+$/);

    await expect(page.getByText('card1 front')).toBeVisible();
    await page.getByTestId('answer-correct').click();
    await expect(page.getByText('card2 front')).toBeVisible();
    await page.getByTestId('answer-wrong').click();
    await expect(page.getByText('card3 front')).toBeVisible();
    await page.getByTestId('answer-correct').click();
    
    await expect(page.getByTestId('answer-wrong')).toBeHidden();
    await expect(page.getByTestId('answer-correct')).toBeHidden();

    await page.goto('/analytics');

    await expect(page.getByText('test set')).toBeVisible();
    await expect(page.getByText('67%')).toBeVisible();
    await expect(page.getByText('3')).toBeVisible();
})