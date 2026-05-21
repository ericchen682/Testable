import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './FlashcardEditor.css';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardSet {
  id: string;
  title: string;
  cards: Flashcard[];
}

const createBlankCard = (): Flashcard => ({
  id: crypto.randomUUID(),
  front: '',
  back: '',
});

export default function FlashcardEditor() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [message, setMessage] = useState('Loading flashcard set...');
  const token = localStorage.getItem('token');

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  const saveSet = async (nextSet: FlashcardSet) => {
    if (!token || !setId) return;

    try {
      const response = await fetch(`http://localhost:3001/api/flashcard-sets/${setId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: nextSet.title,
          cards: nextSet.cards,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
      }
    } catch {
      setMessage('Autosave could not connect to the server');
    }
  };

  const updateSet = (nextSet: FlashcardSet) => {
    setSet(nextSet);
    saveSet(nextSet);
  };

  const updateTitle = (title: string) => {
    if (!set) return;
    updateSet({ ...set, title });
  };

  const updateCard = (cardId: string, field: 'front' | 'back', value: string) => {
    if (!set) return;

    updateSet({
      ...set,
      cards: set.cards.map((card) =>
        card.id === cardId ? { ...card, [field]: value } : card
      ),
    });
  };

  const addCard = () => {
    if (!set) return;
    updateSet({ ...set, cards: [...set.cards, createBlankCard()] });
  };

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

          setMessage(data.error || 'Could not load flashcard set');
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

  if (!set) {
    return (
      <main className="flashcard-editor-root">
        <p className="flashcard-editor-message">{message}</p>
      </main>
    );
  }

  return (
    <main className="flashcard-editor-root">
      <header className="flashcard-editor-header">
        <button onClick={() => navigate('/dashboard')}>Back to dashboard</button>
        <button onClick={() => navigate(`/flashcards/${set.id}`)}>View flashcards</button>
      </header>

      <section className="flashcard-editor-content">
        <input
          className="flashcard-title-input"
          value={set.title}
          onChange={(event) => updateTitle(event.target.value)}
          placeholder="Untitled"
        />

        {message && <p className="flashcard-editor-message">{message}</p>}

        <div className="flashcard-editor-list">
          {set.cards.map((card, index) => (
            <div className="flashcard-editor-card" key={card.id}>
              <span>Card {index + 1}</span>

              <textarea
                value={card.front}
                onChange={(event) => updateCard(card.id, 'front', event.target.value)}
                placeholder="Front"
              />

              <textarea
                value={card.back}
                onChange={(event) => updateCard(card.id, 'back', event.target.value)}
                placeholder="Back"
              />

              {/* Later: add image upload fields to each card here. */}
            </div>
          ))}
        </div>

        <button className="flashcard-add-card" onClick={addCard}>
          Add card +
        </button>

        {/* Later: add publishing controls so users can share sets publicly. */}
      </section>
    </main>
  );
}
