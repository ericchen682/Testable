import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const e2eDbPath = path.join(os.tmpdir(), `testable-e2e-${Date.now()}.db`);
const serverDir = path.resolve(currentDir, '../server');

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    fullyParallel: false,
    use: {
        baseURL: 'http://127.0.0.1:5173',
        trace: 'on-first-retry',
    },
    webServer: [
        {
        command: 'npm start',
        cwd: serverDir,
        url: 'http://127.0.0.1:3001/api/flashcard-sets/public',
        reuseExistingServer: false,
        env: {
            JWT_SECRET: 'test-secret',
            TESTABLE_DB_PATH: e2eDbPath,
            PORT: '3001',
            CLIENT_URL: 'http://127.0.0.1:5173',
        },
        },
        {
        command: 'npm run dev -- --host 127.0.0.1',
        cwd: currentDir,
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: false,
        },
    ],
    projects: [
        {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
        },
    ],
});