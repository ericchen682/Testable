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
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);
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

  const deleteFlashcardSet = async (set: FlashcardSetSummary) => {
    if (!token) {
      handleAuthError();
      return;
    }

    const confirmed = window.confirm(`Delete "${set.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingSetId(set.id);
    setMessage('');

    try {
      const response = await fetch(`http://localhost:3001/api/flashcard-sets/${set.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }

        const data = await response.json();
        setMessage(data.error || 'Could not delete flashcard set');
        return;
      }

      setSets((currentSets) => currentSets.filter((currentSet) => currentSet.id !== set.id));
    } catch {
      setMessage('Could not connect to the server');
    } finally {
      setDeletingSetId(null);
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
            <article key={set.id} className="dashboard-set-card">
              <button
                className="dashboard-set-open"
                onClick={() => navigate(`/flashcards/${set.id}`)}
              >
                <span className="dashboard-set-title">{set.title}</span>
                <span>{set.cardCount} cards</span>
                <span>Updated {new Date(set.updatedAt).toLocaleDateString()}</span>
              </button>
              <button
                className="dashboard-set-delete"
                disabled={deletingSetId === set.id}
                onClick={() => deleteFlashcardSet(set)}
              >
                {deletingSetId === set.id ? 'Deleting...' : 'Delete'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
