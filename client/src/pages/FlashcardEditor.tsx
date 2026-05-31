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
  isPublished: boolean;
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
  const [publishing, setPublishing] = useState(false);
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

  const deleteCard = (cardId: string) => {
    if (!set) return;
    updateSet({ ...set, cards: set.cards.filter((card) => card.id !== cardId) });
  };

  const togglePublish = async () => {
    if (!set || !token || !setId) return;
    setPublishing(true);

    try {
      const response = await fetch(`http://localhost:3001/api/flashcard-sets/${setId}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: !set.isPublished }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }

        setMessage(data.error || 'Could not update publish status');
        return;
      }

      setSet(data.flashcardSet);
      setMessage(data.flashcardSet.isPublished ? 'Set published.' : 'Set unpublished.');
    } catch {
      setMessage('Could not connect to the server');
    } finally {
      setPublishing(false);
    }
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
        <button onClick={() => navigate('/dashboard')}>
          {"<"} Back to dashboard
        </button>
        <button  onClick={() => navigate(`/flashcards/${set.id}`)}>
          View flashcards
        </button>
      </header>

      <section className="flashcard-editor-content">
        <div className="flashcard-editor-left">
          <input
            className="flashcard-title-input"
            value={set.title}
            onChange={(event) => updateTitle(event.target.value)}
            placeholder="Untitled"
          />
          <div className="flashcard-publish-panel">
            <div>
              <span className={set.isPublished ? 'flashcard-publish-status flashcard-publish-status--public' : 'flashcard-publish-status'}>
              {set.isPublished ? 'Published' : 'Private'}
              </span>
              <p>
                {set.isPublished
                ? 'This set is visible in public flashcard sets.'
                : 'This set is not visible in public flashcard sets.'}
              </p>
            </div>
            <button onClick={togglePublish} disabled={publishing}>
            {publishing ? 'Saving...' : set.isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>
          {message && <p className="flashcard-editor-message">{message}</p>}
        </div>

        <div className="flashcard-editor-right">
          <div className="flashcard-editor-list-header">
            Terms
          </div>
          <div className="flashcard-editor-list">
            {set.cards.map((card) => (
              <div className="flashcard-editor-card" key={card.id}>
                
                <div className="flashcard-editor-card-set">
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
                  <button className="flashcard-delete-card" onClick={() => deleteCard(card.id)}>
                      <svg width="22" height="25" viewBox="290 40 100 220" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="280" y1="70" x2="400" y2="70"/>
                        <path d="M310 70 L312 50 L368 50 L370 70"/>
                        <path d="M328 50 L328 44 Q340 40 352 44 L352 50"/>
                        <path d="M295 70 L305 250 Q340 260 375 250 L385 70 Z"/>
                        <line x1="323" y1="95" x2="318" y2="235"/>
                        <line x1="340" y1="95" x2="340" y2="235"/>
                        <line x1="357" y1="95" x2="362" y2="235"/>
                      </svg>
                  </button>
                  {/* Later: add image upload fields to each card here. */}
                </div>
              </div>
            ))}
          </div>
          <div className="flashcard-editor-buttons">
            <button className="flashcard-add-card" onClick={addCard}>
              Add a Card +
            </button>
            <button className="flashcard-save-set" onClick={() => saveSet(set)}>
              Save Set
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
