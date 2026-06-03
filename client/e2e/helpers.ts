import { expect, type Page } from '@playwright/test';

export const password = 'Password1!';

export async function signup(page: Page, email: string) {

}

export async function login(page: Page, email: string) {

}

export async function clearAuth(page: Page) {

}

export async function createSet(page: Page, title: string, cards: { front: string, back: string }[]) {

}

export function uniqueEmail(prefix: string) {
    
}