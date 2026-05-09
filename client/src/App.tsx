import { useEffect, useState } from 'react';
import Flashcard from './components/Flashcard';
import FlashcardSet from './components/FlashcardSet';
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';

interface FlashcardProps {
    titleText: string;
    frontText: string;
    backText: string;
    isFlipped?: boolean;
    onClick?: () => void;
}

interface FlashcardSetProps {
    flashcardList: FlashcardProps[];
}

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [flashcards, setFlashcards] = useState<FlashcardProps[]>([]);
  const [message, setMessage] = useState('');

  async function handleSignup() {
    const response = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || 'Signup failed');
      return;
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setMessage(`Signed up as ${data.user.email}`);
  }

  async function handleLogin() {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || 'Login failed');
      return;
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setMessage(`Logged in as ${data.user.email}`);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken('');
    setFlashcards([]);
    setMessage('Logged out');
  }

  async function loadFlashcards(authToken = token) {
    const response = await fetch('http://localhost:3001/api/flashcards', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || 'Could not load flashcards');
      return;
    }

    setFlashcards(data.flashcardList);
    setMessage('Flashcards loaded');
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    loadFlashcards(token);
  }, [token]);

  return (
    <div style={{ padding: '2rem' }}>

      {!token && (
        <>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <small>
            At least 8 characters, with a capital letter, number, and special character.
          </small>

          <button onClick={handleSignup}>Sign up</button>
          <button onClick={handleLogin}>Log in</button>
        </>
      )}

      {token && (
        <>
          <button onClick={handleLogout}>Log out</button>
        </>
      )}

      <p>{message}</p>

      {flashcards.length > 0 && (
        <FlashcardSet flashcardList={flashcards} />
      )}
    </div>
  );
}

export default App
