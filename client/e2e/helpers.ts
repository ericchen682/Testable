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

}

export async function clearAuth(page: Page) {

}

export async function createSet(page: Page, title: string, cards: { front: string, back: string }[]) {

}

export function uniqueEmail(prefix: string) {

}