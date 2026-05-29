const os = require('os');
const path = require('path');

process.env.TESTABLE_DB_PATH = path.join(os.tmpdir(), `testable-auth-${process.pid}.db`);
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');

const app = require('./index');
const db = require('./utils/db');
const { createPasswordResetToken } = require('./utils/passwordResetTokens');

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

function login(email = 'test@example.com', password = 'Password1!') {
  return request(app)
    .post('/api/auth/login')
    .send({ email, password });
}

async function authToken(email = 'test@example.com', password = 'Password1!') {
  const res = await signup(email, password);
  return res.body.token;
}

function authHeader(token) {
  return `Bearer ${token}`;
}

async function createFlashcardSet(token) {
  return request(app)
    .post('/api/flashcard-sets')
    .set('Authorization', authHeader(token));
}

async function updateFlashcardSet(token, setId, payload = {}) {
  return request(app)
    .put(`/api/flashcard-sets/${setId}`)
    .set('Authorization', authHeader(token))
    .send({
      title: 'Published Biology',
      cards: [
        { id: 'card-1', front: 'Cell', back: 'Basic unit of life' },
        { id: 'card-2', front: 'DNA', back: 'Genetic material' },
      ],
      ...payload,
    });
}

async function publishFlashcardSet(token, setId, isPublished = true) {
  return request(app)
    .put(`/api/flashcard-sets/${setId}/publish`)
    .set('Authorization', authHeader(token))
    .send({ isPublished });
}

beforeEach(() => {
  resetDb();
});

afterAll(() => {
  db.close();
});

describe('auth routes', () => {
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

describe('flashcard set routes', () => {
  test('creates an empty flashcard set for the logged-in user', async () => {
    const token = await authToken();

    const res = await createFlashcardSet(token);

    expect(res.status).toBe(201);
    expect(res.body.flashcardSet).toMatchObject({
      id: expect.any(String),
      userId: expect.any(String),
      title: 'Untitled',
      isPublished: false,
      cards: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  test('requires login to create a flashcard set', async () => {
    const res = await request(app).post('/api/flashcard-sets');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('You must be logged in.');
  });

  test('lists only the logged-in user flashcard sets', async () => {
    const firstUserToken = await authToken('first@example.com');
    const secondUserToken = await authToken('second@example.com');
    const firstSet = await createFlashcardSet(firstUserToken);
    await createFlashcardSet(secondUserToken);

    const res = await request(app)
      .get('/api/flashcard-sets')
      .set('Authorization', authHeader(firstUserToken));

    expect(res.status).toBe(200);
    expect(res.body.flashcardSets).toHaveLength(1);
    expect(res.body.flashcardSets[0]).toMatchObject({
      id: firstSet.body.flashcardSet.id,
      title: 'Untitled',
      isPublished: false,
      cardCount: 0,
      updatedAt: expect.any(String),
    });
  });

  test('edits a flashcard set title and cards', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);
    const setId = createRes.body.flashcardSet.id;

    const res = await request(app)
      .put(`/api/flashcard-sets/${setId}`)
      .set('Authorization', authHeader(token))
      .send({
        title: 'Biology 101',
        cards: [
          { id: 'card-1', front: 'Cell', back: 'Basic unit of life' },
          { id: 'card-2', front: 'Mitochondria', back: 'Produces ATP' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.flashcardSet).toMatchObject({
      id: setId,
      title: 'Biology 101',
      isPublished: false,
      cards: [
        { id: 'card-1', front: 'Cell', back: 'Basic unit of life' },
        { id: 'card-2', front: 'Mitochondria', back: 'Produces ATP' },
      ],
    });
    expect(new Date(res.body.flashcardSet.updatedAt).toString()).not.toBe('Invalid Date');
  });

  test('persists edited flashcard set cards in order', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);
    const setId = createRes.body.flashcardSet.id;

    await request(app)
      .put(`/api/flashcard-sets/${setId}`)
      .set('Authorization', authHeader(token))
      .send({
        title: 'Chemistry',
        cards: [
          { id: 'card-a', front: 'Atom', back: 'Smallest unit of matter' },
          { id: 'card-b', front: 'Ion', back: 'Charged atom or molecule' },
        ],
      });

    const res = await request(app)
      .get(`/api/flashcard-sets/${setId}`)
      .set('Authorization', authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.flashcardSet.title).toBe('Chemistry');
    expect(res.body.flashcardSet.cards.map((card) => card.id)).toEqual(['card-a', 'card-b']);
    expect(res.body.flashcardSet.cards[0].front).toBe('Atom');
    expect(res.body.flashcardSet.cards[1].back).toBe('Charged atom or molecule');
  });

  test('replaces old cards when editing a flashcard set', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);
    const setId = createRes.body.flashcardSet.id;

    await request(app)
      .put(`/api/flashcard-sets/${setId}`)
      .set('Authorization', authHeader(token))
      .send({
        title: 'First version',
        cards: [
          { id: 'old-card', front: 'Old front', back: 'Old back' },
        ],
      });

    const res = await request(app)
      .put(`/api/flashcard-sets/${setId}`)
      .set('Authorization', authHeader(token))
      .send({
        title: 'Second version',
        cards: [
          { id: 'new-card', front: 'New front', back: 'New back' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.flashcardSet.title).toBe('Second version');
    expect(res.body.flashcardSet.cards).toEqual([
      { id: 'new-card', front: 'New front', back: 'New back' },
    ]);
  });

  test('defaults a blank edited title to Untitled', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);
    const setId = createRes.body.flashcardSet.id;

    const res = await request(app)
      .put(`/api/flashcard-sets/${setId}`)
      .set('Authorization', authHeader(token))
      .send({ title: '   ', cards: [] });

    expect(res.status).toBe(200);
    expect(res.body.flashcardSet.title).toBe('Untitled');
  });

  test('generates an id for edited cards without one', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);
    const setId = createRes.body.flashcardSet.id;

    const res = await request(app)
      .put(`/api/flashcard-sets/${setId}`)
      .set('Authorization', authHeader(token))
      .send({
        title: 'Generated ids',
        cards: [
          { front: 'Front without id', back: 'Back without id' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.flashcardSet.cards[0]).toMatchObject({
      id: expect.any(String),
      front: 'Front without id',
      back: 'Back without id',
    });
  });

  test('does not allow one user to edit another user flashcard set', async () => {
    const ownerToken = await authToken('owner@example.com');
    const otherToken = await authToken('other@example.com');
    const createRes = await createFlashcardSet(ownerToken);

    const res = await request(app)
      .put(`/api/flashcard-sets/${createRes.body.flashcardSet.id}`)
      .set('Authorization', authHeader(otherToken))
      .send({
        title: 'Changed by someone else',
        cards: [],
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Flashcard set not found.');
  });

  test('returns not found when editing a missing flashcard set', async () => {
    const token = await authToken();

    const res = await request(app)
      .put('/api/flashcard-sets/missing-set')
      .set('Authorization', authHeader(token))
      .send({
        title: 'Missing',
        cards: [],
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Flashcard set not found.');
  });
});

describe('publish flashcard set routes', () => {
  test('publishes a flashcard set and marks it public', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);
    const setId = createRes.body.flashcardSet.id;
    await updateFlashcardSet(token, setId);

    const res = await publishFlashcardSet(token, setId, true);

    expect(res.status).toBe(200);
    expect(res.body.flashcardSet).toMatchObject({
      id: setId,
      title: 'Published Biology',
      isPublished: true,
      cards: [
        { id: 'card-1', front: 'Cell', back: 'Basic unit of life' },
        { id: 'card-2', front: 'DNA', back: 'Genetic material' },
      ],
    });
    expect(new Date(res.body.flashcardSet.updatedAt).toString()).not.toBe('Invalid Date');
  });

  test('shows published flashcard sets in the public list', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);
    const setId = createRes.body.flashcardSet.id;
    await updateFlashcardSet(token, setId);
    await publishFlashcardSet(token, setId, true);

    const res = await request(app).get('/api/flashcard-sets/public');

    expect(res.status).toBe(200);
    expect(res.body.flashcardSets).toHaveLength(1);
    expect(res.body.flashcardSets[0]).toMatchObject({
      id: setId,
      title: 'Published Biology',
      cardCount: 2,
      updatedAt: expect.any(String),
    });
    expect(res.body.flashcardSets[0].userId).toBeUndefined();
  });

  test('does not show private flashcard sets in the public list', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);
    await updateFlashcardSet(token, createRes.body.flashcardSet.id);

    const res = await request(app).get('/api/flashcard-sets/public');

    expect(res.status).toBe(200);
    expect(res.body.flashcardSets).toEqual([]);
  });

  test('unpublishes a flashcard set and removes it from the public list', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);
    const setId = createRes.body.flashcardSet.id;
    await updateFlashcardSet(token, setId);
    await publishFlashcardSet(token, setId, true);

    const unpublishRes = await publishFlashcardSet(token, setId, false);
    const publicRes = await request(app).get('/api/flashcard-sets/public');

    expect(unpublishRes.status).toBe(200);
    expect(unpublishRes.body.flashcardSet.isPublished).toBe(false);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.flashcardSets).toEqual([]);
  });

  test('requires login to publish a flashcard set', async () => {
    const token = await authToken();
    const createRes = await createFlashcardSet(token);

    const res = await request(app)
      .put(`/api/flashcard-sets/${createRes.body.flashcardSet.id}/publish`)
      .send({ isPublished: true });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('You must be logged in.');
  });

  test('does not allow one user to publish another user flashcard set', async () => {
    const ownerToken = await authToken('owner@example.com');
    const otherToken = await authToken('other@example.com');
    const createRes = await createFlashcardSet(ownerToken);

    const res = await publishFlashcardSet(otherToken, createRes.body.flashcardSet.id, true);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Flashcard set not found.');
  });

  test('returns not found when publishing a missing flashcard set', async () => {
    const token = await authToken();

    const res = await publishFlashcardSet(token, 'missing-set', true);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Flashcard set not found.');
  });

  test('allows a logged-in user to view another user published flashcard set', async () => {
    const ownerToken = await authToken('owner@example.com');
    const viewerToken = await authToken('viewer@example.com');
    const createRes = await createFlashcardSet(ownerToken);
    const setId = createRes.body.flashcardSet.id;
    await updateFlashcardSet(ownerToken, setId);
    await publishFlashcardSet(ownerToken, setId, true);

    const res = await request(app)
      .get(`/api/flashcard-sets/${setId}`)
      .set('Authorization', authHeader(viewerToken));

    expect(res.status).toBe(200);
    expect(res.body.flashcardSet).toMatchObject({
      id: setId,
      title: 'Published Biology',
      isPublished: true,
    });
  });
});

describe('password reset routes', () => {
  test('forgot password returns a generic message for an existing account', async () => {
    await signup('test@example.com', 'Password1!');

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Reset password link has been sent to your email if this account exists.');
  });

  test('forgot password returns the same generic message for an unknown account', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'missing@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Reset password link has been sent to your email if this account exists.');
  });

  test('forgot password rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Valid email is required.');
  });

  test('forgot password creates only one active reset token per user', async () => {
    const signupRes = await signup('test@example.com', 'Password1!');

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    const tokenCount = db
      .prepare('SELECT COUNT(*) AS count FROM password_reset_tokens WHERE user_id = ?')
      .get(signupRes.body.user.id)
      .count;

    expect(tokenCount).toBe(1);
  });

  test('reset password requires a token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ password: 'NewPassword1!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Reset token is required.');
  });

  test('reset password rejects weak password', async () => {
    const signupRes = await signup('test@example.com', 'Password1!');
    const { token } = createPasswordResetToken(signupRes.body.user.id);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Password must be at least 8 characters');
  });

  test('reset password rejects invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'NewPassword1!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Reset link is invalid or expired.');
  });

  test('reset password changes the password and consumes the token', async () => {
    const signupRes = await signup('test@example.com', 'Password1!');
    const { token } = createPasswordResetToken(signupRes.body.user.id);

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewPassword1!' });
    const oldLoginRes = await login('test@example.com', 'Password1!');
    const newLoginRes = await login('test@example.com', 'NewPassword1!');
    const reusedTokenRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'AnotherPassword1!' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toBe('Your password has been reset. You can sign in now.');
    expect(oldLoginRes.status).toBe(401);
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.token).toEqual(expect.any(String));
    expect(reusedTokenRes.status).toBe(400);
    expect(reusedTokenRes.body.error).toBe('Reset link is invalid or expired.');
  });

  test('reset password rejects expired token and deletes it', async () => {
    const signupRes = await signup('test@example.com', 'Password1!');
    const { token } = createPasswordResetToken(signupRes.body.user.id);
    db.prepare('UPDATE password_reset_tokens SET expires_at = ? WHERE user_id = ?')
      .run('2000-01-01T00:00:00.000Z', signupRes.body.user.id);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewPassword1!' });
    const tokenCount = db
      .prepare('SELECT COUNT(*) AS count FROM password_reset_tokens WHERE user_id = ?')
      .get(signupRes.body.user.id)
      .count;

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Reset link is invalid or expired.');
    expect(tokenCount).toBe(0);
  });
});
