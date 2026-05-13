import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

interface FlashcardSetSummary {
  id: string;
  title: string;
  cardCount: number;
  updatedAt: string;
}

export default function Dashboard() {
  const [sets, setSets] = useState<FlashcardSetSummary[]>([]);
  const [message, setMessage] = useState('Loading flashcard sets...');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  const createFlashcardSet = async () => {
    if (!token) {
      handleAuthError();
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/flashcard-sets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }

        setMessage(data.error || 'Could not create flashcard set');
        return;
      }

      navigate(`/flashcards/${data.flashcardSet.id}/edit`);
    } catch {
      setMessage('Could not connect to the server');
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadSets = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/flashcard-sets', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            handleAuthError();
            return;
          }

          setMessage(data.error || 'Could not load flashcard sets');
          return;
        }

        setSets(data.flashcardSets);
        setMessage('');
      } catch {
        setMessage('Could not connect to the server');
      }
    };

    loadSets();
  }, [handleAuthError, navigate, token]);

  return (
    <main className="dashboard-root">
      <header className="dashboard-header">
        <button className="dashboard-create" onClick={createFlashcardSet}>
          create flashcards +
        </button>
        <button className="dashboard-logout" onClick={logout}>Log out</button>
      </header>

      <section className="dashboard-content">
        {message && <p className="dashboard-message">{message}</p>}

        <div className="dashboard-set-grid">
          {sets.map((set) => (
            <button
              key={set.id}
              className="dashboard-set-card"
              onClick={() => navigate(`/flashcards/${set.id}`)}
            >
              <span className="dashboard-set-title">{set.title}</span>
              <span>{set.cardCount} cards</span>
              <span>Updated {new Date(set.updatedAt).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
