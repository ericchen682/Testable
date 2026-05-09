// main express server

require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');

const requireAuth = require('./middleware/requireAuth');
const { getUsers, saveUsers, findUserByEmail } = require('./utils/users');
const { hashPassword, comparePassword } = require('./utils/passwords');
const { createToken } = require('./utils/tokens');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/auth/signup', async (req, res) => {
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

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return res.status(409).json({ error: 'Email is already in use.' });
  }

  const users = await getUsers();
  const { passwordHash, passwordSalt } = hashPassword(password);

  const user = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    passwordSalt,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);

  const token = createToken(user);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
    },
    token,
  });
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = await findUserByEmail(email);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
