  import { useCallback, useEffect, useState } from 'react';
import Analytics from './Analytics';
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
  const [activeView, setActiveView] = useState<'mine' | 'public' | 'analytics'>('mine');
  const [message, setMessage] = useState('Loading flashcard sets...');
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);
  const [publishingSetId, setPublishingSetId] = useState<string | null>(null);
  const [copyingSetId, setCopyingSetId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
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
  
  const copyFlashcardSet = async (set: FlashcardSetSummary) => {
    if (!token) {
      handleAuthError();
      return;
    }

    setCopyingSetId(set.id);
    setMessage('');
    
    try {
      const response = await fetch(`http://localhost:3001/api/flashcard-sets/${set.id}/copy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if(!response.ok)
      {
        if(response.status === 401 || response.status === 403)
        {
          handleAuthError();
          return;
        }
        else
        {
          setMessage(data.error || 'Could not copy set');
          return;
        }
      }

      navigate(`/flashcards/${data.flashcardSet.id}/edit`);
    } catch {
      setMessage('Could not connect to the server');
    } finally {
      setCopyingSetId(null);
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
    <main className="dashboard-root page-fade-in">
      <header className="dashboard-header">
        <div className="logo">
          <svg width={31} height={31} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10.5" stroke="#F5F0E1" strokeWidth="1.4" />
            <path d="M7.5 12.2l3.2 3.2 6-6.4" stroke="#F5F0E1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Testable
        </div>
        <span className="dashboard-greeting"> Ready to continue your studying journey? </span>
      </header>
      <div className="dashboard-body">
        <div className="dashboard-left">
          <nav className="dashboard-aria" aria-label="Flashcard set view">
            <button
              className={activeView === 'mine' ? 'dashboard-nav-link dashboard-nav-link--active' : 'dashboard-nav-link'}
      onClick={() => setActiveView('mine')}
            >
              My sets
            </button>
            <button
              className={activeView === 'public' ? 'dashboard-nav-link dashboard-nav-link--active' : 'dashboard-nav-link'}
              onClick={() => setActiveView('public')}
            >
              Public sets
            </button>
            <button
              className={activeView === 'analytics' ? 'dashboard-nav-link dashboard-nav-link--active' : 'dashboard-nav-link'}
              onClick={() => setActiveView('analytics')}
            >
              Analytics
            </button>
          </nav>
          <button className="dashboard-logout" onClick={logout}>
            Logout
          </button>
        </div>
        <section className="dashboard-content">
          {activeView === 'analytics' ? <Analytics embedded /> : <>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: '24px', marginLeft: '24px' }}>
            <div className="dashboard-search-bar" style={{ marginTop: 0, marginLeft: 0, flex: 1, maxWidth: '900px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#707ba5" strokeWidth="2"/>
                <path d="M16.5 16.5L21 21" stroke="#707ba5" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search study sets"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="dashboard-create" onClick={createFlashcardSet}>
              + Create set
            </button>
          </div>
          {message && <p className="dashboard-message">{message}</p>}
          <span className="dashboard-banner">
            Pick up where you left off!
          </span>
          {sets.length === 0 && (<div className="dashboard-no-set">No sets yet! Click "+ Create set" to get started.</div>)}
          <div className="dashboard-set-grid">
            {displayedSets.filter((set) => set.title.toLowerCase().includes(search.toLowerCase())).map((set) => (
              <article key={set.id} className="dashboard-set-card">
                <button
                  className="dashboard-set-open"
                  onClick={() => navigate(`/flashcards/${set.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="dashboard-set-title">{set.title}</span>
                  <span className={set.isPublished ? 'dashboard-set-badge dashboard-set-badge--public' : 'dashboard-set-badge'}>
                    {set.isPublished ? 'Published' : 'Private'}
                  </span>
                  </div>
                  <div className="dashboard-set-updated">
                    <span>Updated {new Date(set.updatedAt).toLocaleDateString()}</span>
                    <span>{set.cardCount} cards</span>
                  </div>
                  <div>
                    <button className="dashboard-continue" onClick={() => navigate(`/flashcards/${set.id}`)}>
                      Continue
                    </button>
                    <button className="dashboard-edit" onClick={(e) => { e.stopPropagation(); navigate(`/flashcards/${set.id}/edit`); }}>
                      Edit
                    </button>
                  </div>
                </button>

                
                <div className="dashboard-set-actions">
                  {activeView === 'mine' && (
                    <button
                      className="dashboard-set-publish"
                      disabled={publishingSetId === set.id}
                      onClick={() => togglePublish(set)}
                    >
                      {publishingSetId === set.id
                        ? 'Saving...'
                        : set.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                  )}
                  {activeView === 'mine' && (
                    <button
                      className="dashboard-set-delete"
                      disabled={deletingSetId === set.id}
                      onClick={() => deleteFlashcardSet(set)}
                    >
                      {deletingSetId === set.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                  <button
                    className="dashboard-set-copy"
                    disabled={copyingSetId === set.id}
                    onClick={() => copyFlashcardSet(set)}
                  >
                    Make a copy
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>}
        </section>
      </div>
    </main>
  );
}