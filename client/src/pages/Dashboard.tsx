import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

interface FlashcardSetSummary {
  id: string;
  title: string;
  isPublished?: boolean;
  cardCount: number;
  updatedAt: string;
}

export default function Dashboard() {
  const [sets, setSets] = useState<FlashcardSetSummary[]>([]);
  const [publicSets, setPublicSets] = useState<FlashcardSetSummary[]>([]);
  const [activeView, setActiveView] = useState<'mine' | 'public'>('mine');
  const [message, setMessage] = useState('Loading flashcard sets...');
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);
  const [publishingSetId, setPublishingSetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FlashcardSetSummary[] | null>(null);
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:3001/api/flashcard-sets/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        return;
      }
      setSearchResults(data.flashcardSets);
    } catch {
      setMessage('Could not connect to the server');
    }
  };

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

  const togglePublish = async (set: FlashcardSetSummary) => {
    if (!token) {
      handleAuthError();
      return;
    }

    const nextIsPublished = !set.isPublished;
    setPublishingSetId(set.id);
    setMessage('');

    try {
      const response = await fetch(`http://localhost:3001/api/flashcard-sets/${set.id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: nextIsPublished }),
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

      setSets((currentSets) =>
        currentSets.map((currentSet) =>
          currentSet.id === set.id
            ? { ...currentSet, isPublished: data.flashcardSet.isPublished }
            : currentSet
        )
      );

      if (data.flashcardSet.isPublished) {
        setPublicSets((currentSets) => {
          const nextPublicSet = {
            id: data.flashcardSet.id,
            title: data.flashcardSet.title,
            isPublished: true,
            cardCount: data.flashcardSet.cards?.length ?? set.cardCount,
            updatedAt: data.flashcardSet.updatedAt,
          };
          const withoutCurrent = currentSets.filter((currentSet) => currentSet.id !== set.id);
          return [nextPublicSet, ...withoutCurrent];
        });
      } else {
        setPublicSets((currentSets) => currentSets.filter((currentSet) => currentSet.id !== set.id));
      }
    } catch {
      setMessage('Could not connect to the server');
    } finally {
      setPublishingSetId(null);
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

  useEffect(() => {
    if (activeView !== 'public') return;

    const loadPublicSets = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/flashcard-sets/public');
        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || 'Could not load public flashcard sets');
          return;
        }

        setPublicSets(data.flashcardSets.map((set: FlashcardSetSummary) => ({
          ...set,
          isPublished: true,
        })));
        setMessage('');
      } catch {
        setMessage('Could not connect to the server');
      }
    };

    loadPublicSets();
  }, [activeView]);

  const displayedSets = searchResults !== null ? searchResults : (activeView === 'mine' ? sets : publicSets);

  return (
    <main className="dashboard-root">
      <header className="dashboard-header">
        <div className="dashboard-view-toggle" aria-label="Flashcard set view">
          <button
            className={activeView === 'mine' ? 'dashboard-view-button dashboard-view-button--active' : 'dashboard-view-button'}
            onClick={() => setActiveView('mine')}
          >
            My sets
          </button>
          <button
            className={activeView === 'public' ? 'dashboard-view-button dashboard-view-button--active' : 'dashboard-view-button'}
            onClick={() => setActiveView('public')}
          >
            Public sets
          </button>
        </div>
        <button className="dashboard-create" onClick={createFlashcardSet}>
          create flashcards +
        </button>
        <input
          className="dashboard-search"
          type="text"
          placeholder="Search flashcard sets..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <button className="dashboard-logout" onClick={logout}>Log out</button>
      </header>

      <section className="dashboard-content">
        {message && <p className="dashboard-message">{message}</p>}

        {searchResults !== null && searchQuery && (
          <p className="dashboard-message">
            {searchResults.length === 0
              ? 'No flashcard sets found matching your search.'
              : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for "${searchQuery}"`}
          </p>
        )}
        <div className="dashboard-set-grid">
          {displayedSets.map((set) => (
            <article key={set.id} className="dashboard-set-card">
              <button
                className="dashboard-set-open"
                onClick={() => navigate(`/flashcards/${set.id}`)}
              >
                <span className="dashboard-set-title">{set.title}</span>
                <span className={set.isPublished ? 'dashboard-set-badge dashboard-set-badge--public' : 'dashboard-set-badge'}>
                  {set.isPublished ? 'Published' : 'Private'}
                </span>
                <span>{set.cardCount} cards</span>
                <span>Updated {new Date(set.updatedAt).toLocaleDateString()}</span>
              </button>
              {activeView === 'mine' && (
                <div className="dashboard-set-actions">
                  <button
                    className="dashboard-set-publish"
                    disabled={publishingSetId === set.id}
                    onClick={() => togglePublish(set)}
                  >
                    {publishingSetId === set.id
                      ? 'Saving...'
                      : set.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    className="dashboard-set-delete"
                    disabled={deletingSetId === set.id}
                    onClick={() => deleteFlashcardSet(set)}
                  >
                    {deletingSetId === set.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
