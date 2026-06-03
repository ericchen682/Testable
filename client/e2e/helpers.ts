import { expect, type Page } from '@playwright/test';

export const password = 'Password1!';

export async function signup(page: Page, email: string) {
    await page.goto('/signup');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(password);
    await page.getByTestId('signup-confirm-password').fill(password);
    await page.getByTestId('signup-submit').click();
    await expect(page).toHaveURL(/\/dashboard/);
}

export async function login(page: Page, email: string) {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/dashboard/);
}

export async function clearAuth(page: Page) {
    await page.evaluate(() => localStorage.removeItem('token'));
}

export async function createSet(page: Page, title: string, cards: { front: string, back: string }[]) {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: '+ Create set' }).click();
    await expect(page).toHaveURL(/\/flashcards\/[^/]+\/edit/);

    await page.getByTestId('set-title-input').fill(title);

    for(let i = 0; i < cards.length; i += 1) {
        await page.getByTestId('add-card-button').click();
        await page.getByTestId(`card-front-${i}`).fill(cards[i].front);
        await page.getByTestId(`card-back-${i}`).fill(cards[i].back);
    }

    await expect(page.getByTestId(`card-front-${cards.length - 1}`)).toHaveValue(cards[cards.length - 1].front);
}

export function uniqueEmail(prefix: string) {

}