import { useState, useMemo, useEffect, useRef } from 'react';
import './Analytics.css';
import { useNavigate } from 'react-router-dom'; 
// ── Types ──────────────────────────────────────────────────
interface CardSet {
  id: string;
  name: string;
  color: string;
  cards: number;
  accuracy: number;
}

interface Period {
  id: string;
  label: string;
  days: number;
}

interface DataPoint {
  date: Date;
  value: number;
  reviews: number;
}

interface Summary {
  series: DataPoint[];
  accuracy: number;
  accuracyDelta: number;
  reviews: number;
  reviewsDelta: number;
  streak: number;
  streakDelta: number;
  timePerCard: number;
  timeDelta: number;
}

// NEW STUFF FOR DATA
interface RealSet {                                                                                     
    id: string;
    title: string;                                                                                        
    cardCount: number;
  }
// ── Data ──────────────────────────────────────────────────
const CARD_SETS: CardSet[] = [
  { id: 'all',      name: 'All sets',                color: 'linear-gradient(135deg, rgb(23,12,121), rgb(86,182,198))', cards: 354, accuracy: 84 },
  { id: 'es-verbs', name: 'Spanish · Verbs',         color: 'rgb(23, 12, 121)',   cards: 128, accuracy: 92 },
  { id: 'cs-unix',  name: 'CS35L · Unix commands',   color: 'rgb(86, 182, 198)',  cards: 74,  accuracy: 88 },
  { id: 'cs-shell', name: 'CS35L · Shell scripting', color: 'rgb(138, 203, 208)', cards: 52,  accuracy: 76 },
  { id: 'anatomy',  name: 'Anatomy basics',          color: 'rgb(239, 227, 202)', cards: 62,  accuracy: 71 },
  { id: 'music',    name: 'Music theory · Chords',   color: '#c8a8ff',            cards: 38,  accuracy: 64 },
];

const PERIODS: Period[] = [
  { id: '7d',  label: '7 days',  days: 7  },
  { id: '14d', label: '14 days', days: 14 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
];

function seededAccuracy(setId: string, days: number): DataPoint[] {
  const seedBase = setId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const target = (CARD_SETS.find(s => s.id === setId) || CARD_SETS[0]).accuracy;
  const out: DataPoint[] = [];
  let v = target - 8;
  for (let i = 0; i < days; i++) {
    const wobble = Math.sin((i + seedBase) * 0.7) * 4 + Math.cos((i + seedBase) * 1.3) * 3;
    const drift = (target - v) * 0.18;
    v = Math.max(35, Math.min(99, v + drift + wobble));
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    out.push({
      date: d,
      value: Math.round(v),
      reviews: 30 + Math.round(Math.abs(Math.sin((i + seedBase) * 0.9)) * 40 + (Math.random() < 0.3 ? -20 : 8)),
    });
  }
  return out;
}

function summaryFor(setId: string, period: Period): Summary {
  const data = seededAccuracy(setId, period.days);
  const half = Math.floor(data.length / 2);
  const recent = data.slice(half);
  const prev = data.slice(0, half);
  const avg = (arr: DataPoint[]) => Math.round(arr.reduce((a, b) => a + b.value, 0) / arr.length);
  const totalReviews = data.reduce((a, b) => a + b.reviews, 0);
  const prevReviews = prev.reduce((a, b) => a + b.reviews, 0) || 1;
  const recentReviews = recent.reduce((a, b) => a + b.reviews, 0);
  return {
    series: data,
    accuracy: avg(recent),
    accuracyDelta: avg(recent) - avg(prev),
    reviews: totalReviews,
    reviewsDelta: Math.round(((recentReviews - prevReviews) / prevReviews) * 100),
    streak: 11,
    streakDelta: 1,
    timePerCard: 4.2,
    timeDelta: -0.3,
  };
}

// ── Icons ──────────────────────────────────────────────────
const TargetIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);
const LayersIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M2 13l10 5 10-5"/><path d="M2 18l10 5 10-5"/>
  </svg>
);
const FlameIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2s5 4 5 9a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 1-6 1-8z"/>
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
  </svg>
);
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 5 5 9-11"/>
  </svg>
);

// ── Dropdown ──────────────────────────────────────────────
function SetDropdown({ value, onChange, sets }: { value: string; onChange: (id: string) => void; sets: RealSet[]}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = sets.filter(s => s.title.toLowerCase().includes(q.toLowerCase()));
  const current = sets.find(s => s.id === value) || sets[0];
  if (!current) return null;

  return (
    <div className="an-dd-wrap" ref={ref}>
      <button className="an-dd-trigger" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="an-dd-swatch" style={{ background: 'var(--teal)' }} />
        <span className="an-dd-text">
          <span className="an-dd-lbl">card set</span>
          <span className="an-dd-val">{current.title}</span>
        </span>
        <span className="an-dd-chev"><ChevronIcon /></span>
      </button>
      {open && (
        <div className="an-dd-menu" role="listbox">
          <div className="an-dd-search">
            <SearchIcon />
            <input autoFocus placeholder="Search your sets…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          {filtered.map(s => (
            <div key={s.id}
              className={'an-dd-item' + (s.id === value ? ' selected' : '')}
              onClick={() => { onChange(s.id); setOpen(false); setQ(''); }}>
              <span className="an-sw" style={{ background: 'var(--teal)'}} />
              <div>
                <div className="an-name">{s.title}</div>
              </div>
              <div className="an-meta">{s.cardCount} cards</div>
              <span className="an-check"><CheckIcon /></span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="an-dd-empty">No sets match "{q}"</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────
function Stat({ icon, label, value, unit }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  deltaSuffix?: string;
  sparkData?: (number | DataPoint)[];
  sparkColor?: string;
}) {
  return (
    <div className="an-stat">
      <div className="an-stat-label">
        <span className="an-stat-icon">{icon}</span>
        {label}
      </div>
      <div className="an-stat-value">
        {value}{unit && <span className="an-unit">{unit}</span>}
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────
 function OverviewTab({ setId, period, realAccuracy, realReviews, realStreak, realAvgTime }: { setId: string; period: Period; realAccuracy?: number; realReviews?: number; realStreak?: number; realAvgTime?:number})    {
  const data = useMemo(() => summaryFor(setId, period), [setId, period]);
  const sparkAcc = data.series.map(d => d.value);
  const sparkReviews = data.series.map(d => d.reviews);

  return (
    <div className="an-grid an-stat-grid">
      <Stat icon={<TargetIcon />} label="Accuracy" value={realAccuracy ?? data.accuracy} unit="%" delta={data.accuracyDelta} deltaSuffix="%" sparkData={sparkAcc} sparkColor="rgb(86, 182, 198)" />
      <Stat icon={<LayersIcon />} label="Reviews" value={(realReviews ?? data.reviews).toLocaleString()} delta={data.reviewsDelta} deltaSuffix="%" sparkData={sparkReviews} sparkColor="rgb(23, 12, 121)" />
      <Stat icon={<FlameIcon />} label="Day streak" value={realStreak ?? data.streak} unit=" days" delta={data.streakDelta} sparkData={[8,9,9,10,10,11,11]} sparkColor="rgb(138, 203, 208)" />
      <Stat icon={<ClockIcon />} label="Avg time / card" value={realAvgTime ?? data.timePerCard} unit="s" delta={data.timeDelta} deltaSuffix="s" sparkData={[4.6, 4.5, 4.4, 4.4, 4.3, 4.2, 4.2]} sparkColor="rgb(239, 227, 202)" />
    </div>
  );
}

// ── Main Analytics page ──────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview' },
];

export default function Analytics({ embedded = false }: { embedded?: boolean }) {
  const [setId, setSetId] = useState('');
  const [periodId, setPeriodId] = useState('7d');
  const [tab, setTab] = useState('overview');

  // ALL THE CONSTS 
  const [realSets, setRealSets] = useState<RealSet[]>([]);
  const [realAccuracy, setRealAccuracy] = useState(0);
  const [realReviews, setRealReviews] = useState(0);
  const [realStreak, setRealStreak] = useState(0); 
  const [realAvgTime, setRealAvgTime] = useState(0);   
  const period = PERIODS.find(p => p.id === periodId)!;
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch('http://localhost:3001/api/flashcard-sets', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setRealSets(data.flashcardSets);
        if (data.flashcardSets.length > 0) setSetId(data.flashcardSets[0].id);
      })
      .catch(() => {});
  }, [token, navigate]);

  useEffect(() => {
    if (!setId || !token) return;
    // BASE
    setRealAccuracy(0);
    setRealReviews(0);
    setRealStreak(0);
    setRealAvgTime(0);

    fetch(`http://localhost:3001/api/analytics/${setId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const analytics = data.analytics as { attempts: number; correctCount: number }[];
        if (!analytics?.length) return;
        const totalAttempts = analytics.reduce((a, b) => a + b.attempts, 0);
        const totalCorrect = analytics.reduce((a, b) => a + b.correctCount, 0);
        if (totalAttempts === 0) return;
        setRealAccuracy(Math.round((totalCorrect / totalAttempts) * 100));
        setRealReviews(totalAttempts);  
        setRealStreak(data.streak ?? 0);  
        setRealAvgTime(data.avgTime??0);
      })
      .catch(() => {});
  }, [setId, token]);

  return (
    <div className={embedded ? "analytics-embedded" : "analytics-root page-fade-in"}>
      {!embedded && <header className="an-topnav">
          <div className="an-topnav-inner">
            <div className="an-brand">
              <svg width={21} height={21} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10.5" stroke="#EFE3CA" strokeWidth="1.4" />
                <path d="M7.5 12.2l3.2 3.2 6-6.4" stroke="#EFE3CA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Testable
            </div>
            <nav className="an-nav-links">
              <button className="an-nav-link"  onClick={() => navigate('/dashboard')}>My sets</button>
              <button className="an-nav-link active">Analytics</button>
            </nav>
            <div className="an-nav-right">
              
              <div className="an-avatar">JM</div>
            </div>
          </div>
        </header>}
      <div className="analytics-app">
        <div className="an-page">
          <div className="an-page-head">
            <div className="an-page-title">
              <h1>Analytics</h1>
              <p>Track accuracy, streaks, and where to focus next.</p>
            </div>
            <SetDropdown value={setId} onChange={setSetId} sets={realSets} />   
          </div>

          <div className="an-tabs-row">
            <div className="an-tabs" role="tablist">
              {TABS.map(t => (
                <button key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className={'an-tab' + (tab === t.id ? ' active' : '')}
                  onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'overview' && <OverviewTab setId={setId} period={period} realAccuracy={realAccuracy} realReviews={realReviews} realStreak={realStreak} realAvgTime={realAvgTime}/>}
        </div>
      </div>
      
    </div>
  );
}
