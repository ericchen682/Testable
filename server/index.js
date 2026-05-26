// main express server

require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');

const requireAuth = require('./middleware/requireAuth');

const { 
  findUserByEmail,
  createUser,
} = require('./utils/users');

const { 
  hashPassword, 
  comparePassword 
} = require('./utils/passwords');

const { 
  createToken,
} = require('./utils/tokens');

const {
  getFlashcardSetsForUser,
  findFlashcardSetById,
  createFlashcardSet,
  updateFlashcardSet,
} = require('./utils/flashcardSets');

const app = express();
const PORT = process.env.PORT || 3001;

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
    if (err.code == 'SQLITE_CONSTRAINT_UNIQUE') {
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
    createdAt: new Date.toISOString(),
  });

  res.status(201).json({ flashcardSet: newSet });
});

app.get('/api/flashcard-sets/:id', requireAuth, (req, res) => {
  const set = findFlashcardSetById(req.params.id);

  if (!set || set.userId !== req.user.id) {
    return res.status(404).json({ error: 'Flashcard set not found.' });
  }

  res.json({ flashcardSet: set });
});

app.put('/api/flashcard-sets/:id', requireAuth, async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
