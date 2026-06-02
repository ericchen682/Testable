import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FlashcardSet from '../components/FlashcardSet';
import './FlashcardView.css';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardSetData {
  id: string;
  title: string;
  isPublished: boolean;
  cards: Flashcard[];
}

export default function FlashcardView() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState<FlashcardSetData | null>(null);
  const [message, setMessage] = useState('Loading flashcards...');
  const token = localStorage.getItem('token');

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadSet = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/flashcard-sets/${setId}`, {
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

          setMessage(data.error || 'Could not load flashcards');
          return;
        }

        setSet(data.flashcardSet);
        setMessage('');
      } catch {
        setMessage('Could not connect to the server');
      }
    };

    loadSet();
  }, [handleAuthError, navigate, setId, token]);

  const flashcardList = set?.cards.map((card) => ({
    id: card.id,
    titleText: set.title,
    frontText: card.front || 'Blank front',
    backText: card.back || 'Blank back',
  })) ?? [];

  return (
    <main className="flashcard-view-root">
      <header className="flashcard-view-header">
        <button onClick={() => navigate('/dashboard')}>{'<'} Back to dashboard</button>
        {set && (
          <button onClick={() => navigate(`/flashcards/${set.id}/edit`)}>
            Edit {'>'}
          </button>
        )}
      </header>

      <section className="flashcard-view-content">
        {set && (
          <div className="flashcard-view-title-row">
            <span className={set.isPublished ? 'flashcard-view-badge flashcard-view-badge--public' : 'flashcard-view-badge'}>
              {set.isPublished ? 'Published' : 'Private'}
            </span>
          </div>
        )}
        {message && <p className="flashcard-view-message">{message}</p>}

        {set && flashcardList.length === 0 && (
          <div className="flashcard-view-empty">
            <p>This set does not have any cards yet.</p>
            <button onClick={() => navigate(`/flashcards/${set.id}/edit`)}>
              Add cards
            </button>
          </div>
        )}

         {set && flashcardList.length > 0 && (
          <div className="flashcard-view-player">
            <FlashcardSet flashcardList={flashcardList} setId={set.id} token={token!} />  
          </div>
        )}
      </section>
    </main>
  );
}
