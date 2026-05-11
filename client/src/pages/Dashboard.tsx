import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FlashcardSet from '../components/FlashcardSet';
import './Dashboard.css';

interface FlashcardProps {
  titleText: string;
  frontText: string;
  backText: string;
  isFlipped?: boolean;
  onClick?: () => void;
}

export default function Dashboard() {
  const [flashcards, setFlashcards] = useState<FlashcardProps[]>([]);
  const [message, setMessage] = useState('Loading flashcards...');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const loadFlashcards = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/flashcards', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }

          setMessage(data.error || 'Could not load flashcards');
          return;
        }

        setFlashcards(data.flashcardList);
        setMessage('');
      } catch {
        setMessage('Could not connect to the server');
      }
    };

    loadFlashcards();
  }, [navigate]);

  return (
    <main className="dashboard-root">
      <header className="dashboard-header">
        <button className="dashboard-logout" onClick={logout}>Log out</button>
      </header>

      <section className="dashboard-content">
        {message && <p className="dashboard-message">{message}</p>}

        {flashcards.length > 0 && (
          <div className="dashboard-flashcards">
            <FlashcardSet flashcardList={flashcards} />
          </div>
        )}
      </section>
    </main>
  );
}
