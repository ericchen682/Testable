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
        /*const mockSets = [
          { id : "1", title: "CS 35L Midterm 1", cardCount: 3, updatedAt: "2026-05-20"},
          { id : "2", title: "Brain Anatomy", cardCount: 4, updatedAt: "2026-05-22"},
          { id : "3", title: "English", cardCount: 6, updatedAt: "2026-05-24"},
        ]
        setSets(mockSets);
        setMessage('');
        */
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
        <div className = "logo">
          <svg width={31} height={31} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10.5" stroke="#F5F0E1" strokeWidth="1.4" />
            <path d="M7.5 12.2l3.2 3.2 6-6.4" stroke="#F5F0E1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Testable<span className="logo-dot">.</span>
        </div>

        
      </header>
      <div className="dashboard-body">
        
        <div className = "dashboard-left">
          <button className="dashboard-home">
            Home
          </button>
          <button className="dashboard-library">
            My Sets
          </button>
          <button className="dashboard-logout" onClick={logout}>
            Logout
          </button>
        </div>
        <section className="dashboard-content">
          <span>
            <button className="dashboard-search-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="#707ba5" strokeWidth="2"/>
                  <path d="M16.5 16.5L21 21" stroke="#707ba5" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                  Search study sets
              </div>
            </button>
            <button className="dashboard-create" onClick={createFlashcardSet}>
              + Create set
            </button>
          </span>
          {message && <p className="dashboard-message">{message}</p>}
          <span className="dashboard-banner">
            Pick up where you left off!
          </span>
          <div className="dashboard-set-grid">
            {sets.map((set) => (
              <button
                key={set.id}
                className="dashboard-set-card"
                onClick={() => navigate(`/flashcards/${set.id}`)}
              >
                <span className="dashboard-set-title">{set.title}</span>
                <div className="dashboard-set-updated">
                  <span>Updated {new Date(set.updatedAt).toLocaleDateString()}</span> <span>  {set.cardCount} cards </span>
                </div>
                <span>
                  <button className="dashboard-continue">
                    <div>
                      Continue
                    </div>
                  </button>
                  <button className="dashboard-progress-report">
                    <div>
                      View Progress Report
                    </div>
                  </button>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
