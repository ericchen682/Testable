import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

const e2eDbPath = path.join(os.tmpdir(), `testable-e2e-${Date.now()}.db`);

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
        cwd: path.resolve(__dirname, '../server'),
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
        cwd: __dirname,
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