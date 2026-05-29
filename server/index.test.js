const os = require('os');
const path = require('path');

process.env.TESTABLE_DB_PATH = path.join(os.tmpdir(), `testable-auth-${process.pid}.db`);
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');

const app = require('./index');
const db = require('./utils/db');

function resetDb() {
  db.prepare('DELETE FROM analytics').run();
  db.prepare('DELETE FROM flashcards').run();
  db.prepare('DELETE FROM flashcard_sets').run();
  db.prepare('DELETE FROM password_reset_tokens').run();
  db.prepare('DELETE FROM users').run();
}

function signup(email = 'test@example.com', password = 'Password1!') {
  return request(app)
    .post('/api/auth/signup')
    .send({ email, password });
}

describe('auth routes', () => {
  beforeEach(() => {
    resetDb();
  });

  afterAll(() => {
    db.close();
  });

  test('signup creates a user and returns a token without password fields', async () => {
    const res = await signup('USER@example.com', 'Password1!');

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      id: expect.any(String),
      email: 'user@example.com',
    });
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.passwordSalt).toBeUndefined();
  });

  test('signup rejects invalid email', async () => {
    const res = await signup('not-an-email', 'Password1!');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Valid email is required.');
  });

  test('signup rejects weak password', async () => {
    const res = await signup('test@example.com', 'password');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Password must be at least 8 characters');
  });

  test('signup rejects duplicate email', async () => {
    await signup('test@example.com', 'Password1!');

    const res = await signup('TEST@example.com', 'Password1!');

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email is already in use.');
  });

  test('login returns a token for valid credentials', async () => {
    await signup('test@example.com', 'Password1!');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1!' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.token).toEqual(expect.any(String));
  });

  test('login accepts email with uppercase letters and surrounding whitespace', async () => {
    await signup('test@example.com', 'Password1!');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '  TEST@example.com  ', password: 'Password1!' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });

  test('login rejects an incorrect password', async () => {
    await signup('test@example.com', 'Password1!');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });

  test('login rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'Password1!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });
});
