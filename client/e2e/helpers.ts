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

}

export function uniqueEmail(prefix: string) {

}