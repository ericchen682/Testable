// main express server

require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

// GETS FOR ANALYTICS
const { insertAnalyticsRecord, getAnalyticsForSet, getStreakForUser } = require('./utils/analytics');

const requireAuth = require('./middleware/requireAuth');

const { 
  findUserByEmail,
  createUser,
  updateUserPassword,
} = require('./utils/users');

const { 
  hashPassword, 
  comparePassword 
} = require('./utils/passwords');

const { 
  createToken,
} = require('./utils/tokens');

const {
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  deleteExpiredPasswordResetTokens,
} = require('./utils/passwordResetTokens');

const {
  getFlashcardSetsForUser,
  findFlashcardSetById,
  createFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
  publishFlashcardSet,
  getPublicFlashcardSets,
} = require('./utils/flashcardSets');







const app = express();
const PORT = process.env.PORT || 3001;
const PASSWORD_RESET_MESSAGE = 'Reset password link has been sent to your email if this account exists.';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

app.use(cors());
app.use(express.json());

app.post('/api/auth/signup', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  const strongPasswordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  if (!strongPasswordPattern.test(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters and include a capital letter, a number, and a special character.',
    });
  }

  if ( findUserByEmail(email)) {
    return res.status(409).json({ error: 'Email is already in use.' });
  }

  const { passwordHash, passwordSalt } = hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    passwordSalt,
    createdAt: new Date().toISOString(),
  };

  try {
    createUser(user);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Email is already in use.' });
    }
    throw err;
  }

  const token = createToken(user);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
    },
    token,
  });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = findUserByEmail(email);
  if (!user || !comparePassword(password, user)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = createToken(user);

  res.json({
    user: {
      id: user.id,
      email: user.email,
    },
    token,
  });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  const user = findUserByEmail(email);
  if (user) {
    const { token } = createPasswordResetToken(user.id);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    if (resend) {
      try {
        await resend.emails.send({
          from: 'Testable <onboarding@resend.dev>',
          to: user.email,
          subject: 'Reset your Testable password',
          html: `
            <div style="font-family: Arial, sans-serif; color: #0B1339; line-height: 1.5;">
              <h1 style="font-size: 22px;">Reset your password</h1>
              <p>We received a request to reset your Testable password.</p>
              <p>
                <a href="${resetUrl}" style="display: inline-block; background: #3FB6B2; color: #0A1238; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
                  Reset password
                </a>
              </p>
              <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
            </div>
          `,
          text: `Reset your Testable password: ${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email.`,
        });
      } catch (error) {
        console.error('Could not send password reset email:', error);
      }
    } else {
      console.warn('RESEND_API_KEY is not configured; password reset email was not sent.');
    }
  }

  res.json({ message: PASSWORD_RESET_MESSAGE });
});

app.post('/api/auth/reset-password', (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  const strongPasswordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  if (!token) {
    return res.status(400).json({ error: 'Reset token is required.' });
  }

  if (!strongPasswordPattern.test(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters and include a capital letter, a number, and a special character.',
    });
  }

  deleteExpiredPasswordResetTokens();
  const resetToken = findPasswordResetToken(token);
  if (!resetToken || new Date(resetToken.expiresAt) <= new Date()) {
    return res.status(400).json({ error: 'Reset link is invalid or expired.' });
  }

  const { passwordHash, passwordSalt } = hashPassword(password);
  updateUserPassword(resetToken.userId, passwordHash, passwordSalt);
  deletePasswordResetToken(resetToken.tokenHash);

  res.json({ message: 'Your password has been reset. You can sign in now.' });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
});

app.get('/api/flashcards', requireAuth, (req, res) => {
  res.json({
    flashcardList: [
      {
        titleText: 'title',
        frontText: 'first card',
        backText: 'first card back text',
      },
      {
        titleText: 'title',
        frontText: 'second card',
        backText: 'second card back text',
      },
      {
        titleText: 'title',
        frontText: 'third card',
        backText: 'third card back text',
      },
      {
        titleText: 'title',
        frontText: 'fourth card',
        backText: 'fourth card back text',
      },
      {
        titleText: 'title',
        frontText: 'fifth card',
        backText: 'fifth card back text',
      },
    ],
  });
});

app.get('/api/flashcard-sets', requireAuth, (req, res) => {
  res.json({ flashcardSets: getFlashcardSetsForUser(req.user.id) });
});

app.post('/api/flashcard-sets', requireAuth, (req, res) => {
  const newSet = createFlashcardSet({
    id: crypto.randomUUID(),
    userId: req.user.id,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ flashcardSet: newSet });
});

app.get('/api/flashcard-sets/public', (req, res) => {
  res.json({ flashcardSets: getPublicFlashcardSets() });
});

app.get("/api/flashcard-sets/search", requireAuth, (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();

  if (!query) {
    return res.json({ flashcardSets: [] });
  }

  const sets = getFlashcardSetsForUser(req.user.id);

  const results = sets
    .filter((set) => {
      const titleMatch = (set.title || "").toLowerCase().includes(query);
      const contentMatch = (set.cards || []).some(
        (card) =>
          String(card.front || "").toLowerCase().includes(query) ||
          String(card.back || "").toLowerCase().includes(query)
      );
      return titleMatch || contentMatch;
    })
    .map((set) => ({
      id: set.id,
      title: set.title,
      cardCount: (set.cards || []).length,
      updatedAt: set.updatedAt,
    }));

  if (results.length === 0) {
    return res.json({ flashcardSets: [], message: "No flashcard sets found matching your search." });
  }

  res.json({ flashcardSets: results });
});

app.get('/api/flashcard-sets/:id', requireAuth, (req, res) => {
  const set = findFlashcardSetById(req.params.id);

  if (!set) {
    return res.status(404).json({ error: 'Flashcard set not found.' });
  }

  if (set.userId !== req.user.id && !set.isPublished) {
    return res.status(404).json({ error: 'Flashcard set not found.' });
  }

  res.json({ flashcardSet: set });
});

app.put('/api/flashcard-sets/:id', requireAuth, (req, res) => {
  const existing = findFlashcardSetById(req.params.id);
  if (!existing || existing.userId !== req.user.id) {
    return res.status(404).json({ error: 'Flashcard set not found.' });
  }

  const title = String(req.body.title || 'Untitled').trim() || 'Untitled';
  const cards = Array.isArray(req.body.cards)
    ? req.body.cards.map((card) => ({
        id: card.id || crypto.randomUUID(),
        front: String(card.front || ''),
        back: String(card.back || ''),
      }))
    : [];

  const updated = updateFlashcardSet(req.params.id, {
    title,
    cards,
    updatedAt: new Date().toISOString(),
  });
  
  res.json({ flashcardSet: updated });
});

app.delete('/api/flashcard-sets/:id', requireAuth, (req, res) => {
  const existing = findFlashcardSetById(req.params.id);
  if (!existing || existing.userId !== req.user.id) {
    return res.status(404).json({ error: 'Flashcard set not found.' });
  }
  deleteFlashcardSet(req.params.id);
  res.status(204).send();
});

app.put('/api/flashcard-sets/:id/publish', requireAuth, (req, res) => {
  const existing = findFlashcardSetById(req.params.id);
  if (!existing || existing.userId !== req.user.id) {
    return res.status(404).json({ error: 'Flashcard set not found.' });
  }
  const isPublished = req.body.isPublished === true;
  const updated = publishFlashcardSet(req.params.id, isPublished, new Date().toISOString());
  res.json({ flashcardSet: updated });
});

app.post('/api/flashcard-sets/:id/copy', requireAuth, (req, res) => {
  const original = findFlashcardSetById(req.params.id);

  // check if owned/public set
  if(!original || original.userId !== req.user.id && !original.isPublished)
  {
    return res.status(404).json({ error: 'Flashcard set not found.' });
  }

  const now = new Date().toISOString();

  const newSet = createFlashcardSet({
    id: crypto.randomUUID(),
    userId: req.user.id,
    createdAt: now,
  });

  const copy = updateFlashcardSet(newSet.id, {
    title: `Copy of ${original.title}`,
    cards: original.cards.map((card) => ({
      id: crypto.randomUUID(),
      front: card.front,
      back: card.back,
    })),
    updatedAt: now,
  });

  res.status(201).json({ flashcardSet: copy });
});

app.post('/api/analytics', requireAuth, (req, res) => {
  const { cardId, setId, correct, timeSpent } = req.body;

  if (!cardId || !setId || correct === undefined || timeSpent ===undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  insertAnalyticsRecord({
    userId: req.user.id,
    cardId: String(cardId),
    setId: String(setId),
    correct: Boolean(correct),
    timeSpent: Math.max(0, parseInt(timeSpent, 10) || 0),
    reviewedAt: new Date().toISOString(),
  });

  res.status(201).json({ ok: true });
});





app.get('/api/analytics/:setId', requireAuth, (req, res) => {
  const results = getAnalyticsForSet(req.params.setId, req.user.id);
  const streak = getStreakForUser(req.user.id);
  res.json({ analytics: results, streak});
});


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
