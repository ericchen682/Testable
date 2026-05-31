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

interface ToughCard {
  q: string;
  a: string;
  miss: number;
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

const TOUGH_CARDS: Record<string, ToughCard[]> = {
  all: [
    { q: "subjunctive vs indicative — 'cuando' triggers?", a: 'Spanish · Verbs',  miss: 78 },
    { q: 'grep -E vs egrep — deprecation status',          a: 'CS35L · Unix',     miss: 71 },
    { q: 'what does `set -euo pipefail` do?',              a: 'CS35L · Shell',    miss: 64 },
    { q: 'vagus nerve — cranial nerve number',             a: 'Anatomy basics',   miss: 58 },
    { q: 'minor 7 flat 5 chord — intervals',               a: 'Music theory',     miss: 52 },
  ],
  'es-verbs': [
    { q: "subjunctive vs indicative — 'cuando' triggers?", a: 'imperfect sub.',    miss: 78 },
    { q: "preterite of 'andar'",                           a: 'anduve, anduviste…', miss: 64 },
    { q: "'haber' vs 'tener' — perfect tense",             a: 'auxiliary use',    miss: 51 },
    { q: "'por' vs 'para' — purpose vs duration",          a: 'preposition pair', miss: 47 },
  ],
  'cs-unix': [
    { q: 'grep -E vs egrep — deprecation status', a: 'POSIX note',       miss: 71 },
    { q: 'xargs -0 flag — when to use',           a: 'null-separated',   miss: 58 },
    { q: 'awk: NF vs NR',                         a: 'fields vs records', miss: 44 },
  ],
  'cs-shell': [
    { q: 'what does `set -euo pipefail` do?',         a: 'strict mode',      miss: 64 },
    { q: '${var:-default} vs ${var:=default}',        a: 'assign vs return', miss: 56 },
    { q: 'trap EXIT — when does it fire?',            a: 'shell cleanup',    miss: 49 },
  ],
  anatomy: [
    { q: 'vagus nerve — cranial nerve number', a: 'X (CN 10)',   miss: 58 },
    { q: 'carotid sheath contents',            a: '3 structures', miss: 51 },
  ],
  music: [
    { q: 'minor 7 flat 5 chord — intervals',           a: 'half-diminished', miss: 52 },
    { q: 'circle of fifths — key signature for D♭ major', a: '5 flats',       miss: 44 },
  ],
};

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
const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
  </svg>
);
const UpIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 15 6-6 6 6"/>
  </svg>
);
const DownIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

// ── Sparkline ──────────────────────────────────────────────
function Sparkline({ data, color = 'rgb(23, 12, 121)', height = 32, width = 100 }: {
    data: (number | DataPoint)[];
    color?: string;
    height?: number;
    width?: number;
  }) 
  {
    if (!data || !data.length) return null;
    const vals = data.map(d => typeof d === 'number' ? d : d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = Math.max(1, max - min);
    const pad = 2;
    const W = width - pad * 2;
    const H = height - pad * 2;
    const xs = (i: number) => pad + (W * i) / Math.max(1, vals.length - 1);
    const ys = (v: number) => pad + H * (1 - (v - min) / range);
    let d = `M ${xs(0)} ${ys(vals[0])}`;
    for (let i = 1; i < vals.length; i++) {
      const x0 = xs(i - 1), y0 = ys(vals[i - 1]);
      const x1 = xs(i),     y1 = ys(vals[i]);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    const area = d + ` L ${xs(vals.length - 1)} ${height - pad} L ${xs(0)} ${height - pad} Z`;
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <path d={area} fill={color} opacity="0.15" />
        <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

// ── Line chart ──────────────────────────────────────────────
function LineChart({ data, height = 280, accent = 'rgb(23, 12, 121)' }: {
  data: DataPoint[];
  height?: number;
  accent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<{ i: number } | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const pad = { l: 44, r: 16, t: 16, b: 30 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;

  const xs = (i: number) => pad.l + (W * i) / Math.max(1, data.length - 1);
  const ys = (v: number) => pad.t + H * (1 - v / 100);

  const linePath = useMemo(() => {
    if (!data.length) return '';
    let d = `M ${xs(0)} ${ys(data[0].value)}`;
    for (let i = 1; i < data.length; i++) {
      const x0 = xs(i - 1), y0 = ys(data[i - 1].value);
      const x1 = xs(i),     y1 = ys(data[i].value);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  }, [data, width]);

  const areaPath = linePath
    ? linePath + ` L ${xs(data.length - 1)} ${pad.t + H} L ${xs(0)} ${pad.t + H} Z`
    : '';

  const ticks = [0, 25, 50, 75, 100];

  const xTicks = useMemo(() => {
    if (data.length <= 8) return data.map((_, i) => i);
    const step = Math.max(1, Math.floor(data.length / 6));
    const out: number[] = [];
    for (let i = 0; i < data.length; i += step) out.push(i);
    if (out[out.length - 1] !== data.length - 1) out.push(data.length - 1);
    return out;
  }, [data.length]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < pad.l || x > width - pad.r) { setHover(null); return; }
    const rel = (x - pad.l) / W;
    const i = Math.round(rel * (data.length - 1));
    setHover({ i: Math.max(0, Math.min(data.length - 1, i)) });
  }

  function fmtDate(d: Date) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const gradId = 'lc-grad-' + accent.replace(/[^a-z0-9]/gi, '');

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height }}
      onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map(t => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={ys(t)} y2={ys(t)}
              stroke="rgba(23,12,121,0.10)" strokeWidth="1"
              strokeDasharray={t === 0 || t === 100 ? '' : '3 4'} />
            <text x={pad.l - 10} y={ys(t) + 4} textAnchor="end"
              fontSize="11" fill="rgba(23,12,121,0.55)"
              fontFamily="Plus Jakarta Sans, sans-serif">{t}%</text>
          </g>
        ))}

        {xTicks.map(i => (
          <text key={i} x={xs(i)} y={height - 8} textAnchor="middle"
            fontSize="11" fill="rgba(23,12,121,0.6)" fontWeight="500"
            fontFamily="Plus Jakarta Sans, sans-serif">
            {fmtDate(data[i].date)}
          </text>
        ))}

        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={accent} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {data.map((p, i) => (
          <circle key={i} cx={xs(i)} cy={ys(p.value)}
            r={hover && hover.i === i ? 6 : 3.5}
            fill="white" stroke={accent} strokeWidth="2.5" />
        ))}

        {hover && (
          <line x1={xs(hover.i)} x2={xs(hover.i)} y1={pad.t} y2={pad.t + H}
            stroke={accent} strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
        )}
      </svg>

      {hover && (
        <div className="an-tooltip" style={{
          left: xs(hover.i),
          top: ys(data[hover.i].value) - 8,
        }}>
          <strong>{data[hover.i].value}%</strong>
          {' · '}
          {fmtDate(data[hover.i].date)}
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
            {data[hover.i].reviews} reviews
          </div>
        </div>
      )}
    </div>
  );
}

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
function Stat({ icon, label, value, unit, delta, deltaSuffix, sparkData, sparkColor }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  deltaSuffix?: string;
  sparkData?: (number | DataPoint)[];
  sparkColor?: string;
}) {
  const isUp   = delta !== undefined && delta > 0;
  const isDown = delta !== undefined && delta < 0;
  return (
    <div className="an-stat">
      <div className="an-stat-label">
        <span className="an-stat-icon">{icon}</span>
        {label}
      </div>
      <div className="an-stat-value">
        {value}{unit && <span className="an-unit">{unit}</span>}
      </div>
      <div className="an-stat-row">
        {/* {delta !== undefined && (
          <span className={'an-stat-delta ' + (isUp ? 'up' : isDown ? 'down' : '')}>
            {isUp && <UpIcon />}{isDown && <DownIcon />}
            {Math.abs(delta)}{deltaSuffix || ''}
          </span>
        )} */}
        {/* {sparkData && (
          <div className="an-stat-spark">
            <Sparkline data={sparkData} color={sparkColor || 'rgb(86, 182, 198)'} width={100} height={32} />
          </div>
        )} */}
      </div>
    </div>
  );
}

// ── Set row ──────────────────────────────────────────────
function SetRow({ set, period }: { set: CardSet; period: Period }) {
  const series = useMemo(() => seededAccuracy(set.id, period.days), [set.id, period.days]);
  const half = Math.ceil(period.days / 2);
  const pct = Math.round(series.slice(-half).reduce((a, b) => a + b.value, 0) / half);
  const reviews = series.reduce((a, b) => a + b.reviews, 0);
  return (
    <div className="an-row-set">
      <span className="an-rs-swatch" style={{ background: set.color }} />
      <div>
        <div className="an-rs-name">{set.name}</div>
        <div className="an-rs-sub">{set.cards} cards · last studied 2h ago</div>
      </div>
      <div className="an-rs-bar">
        <span className="an-rs-bar-fill" style={{ width: pct + '%', background: set.color }} />
      </div>
      <div className="an-rs-pct">{pct}%</div>
      <div><Sparkline data={series} color={set.color} width={70} height={24} /></div>
      <div className="an-rs-num">{reviews}</div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────
function OverviewTab({ setId, period, realAccuracy }: { setId: string; period: Period; realAccuracy?: number | null })      {
  const data = useMemo(() => summaryFor(setId, period), [setId, period]);
  const tough = TOUGH_CARDS[setId] || TOUGH_CARDS.all;
  const visibleSets = CARD_SETS.filter(s => s.id !== 'all');
  const sparkAcc = data.series.map(d => d.value);
  const sparkReviews = data.series.map(d => d.reviews);
  const currentSet = CARD_SETS.find(s => s.id === setId) || CARD_SETS[0];

  return (
    <>
      <div className="an-grid an-stat-grid">
        <Stat icon={<TargetIcon />} label="Accuracy" value={realAccuracy ?? data.accuracy} unit="%" delta={data.accuracyDelta} deltaSuffix="%" sparkData={sparkAcc} sparkColor="rgb(86, 182, 198)" />
        <Stat icon={<LayersIcon />} label="Reviews" value={data.reviews.toLocaleString()} delta={data.reviewsDelta} deltaSuffix="%" sparkData={sparkReviews} sparkColor="rgb(23, 12, 121)" />
        <Stat icon={<FlameIcon />} label="Day streak" value={data.streak} unit=" days" delta={data.streakDelta} sparkData={[8,9,9,10,10,11,11]} sparkColor="rgb(138, 203, 208)" />
        <Stat icon={<ClockIcon />} label="Avg time / card" value={data.timePerCard} unit="s" delta={data.timeDelta} deltaSuffix="s" sparkData={[4.6, 4.5, 4.4, 4.4, 4.3, 4.2, 4.2]} sparkColor="rgb(239, 227, 202)" />
      </div>

      {/* <div className="an-card" style={{ marginBottom: 20 }}>
        <div className="an-card-head">
          <div>
            <div className="an-title">Accuracy over time</div>
            <div className="an-sub">{currentSet.name} · past {period.label}</div>
          </div>
          <div className="an-chart-legend">
            <span><span className="an-legend-dot" style={{ background: 'rgb(23, 12, 121)' }} />accuracy</span>
            <span><span className="an-legend-dot" style={{ background: 'rgba(86,182,198,0.4)' }} />area</span>
          </div>
        </div>
        <div className="an-card-body">
          <div className="an-chart-wrap">
            <LineChart data={data.series} accent="rgb(23, 12, 121)" />
          </div>
        </div>
      </div> */}

      {/* <div className="an-two-col">
        <div className="an-card">
          <div className="an-card-head">
            <div>
              <div className="an-title">Performance by set</div>
              <div className="an-sub">click a set to filter the rest of the page</div>
            </div>
          </div>
          {visibleSets.map(s => <SetRow key={s.id} set={s} period={period} />)}
        </div>

        <div className="an-card">
          <div className="an-card-head">
            <div>
              <div className="an-title">Toughest cards</div>
              <div className="an-sub">where most reviews go wrong</div>
            </div>
          </div>
          {tough.map((t, i) => (
            <div className="an-tough-item" key={i}>
              <div>
                <div className="an-tough-q">{t.q}</div>
                <div className="an-tough-a">{t.a}</div>
              </div>
              <div className="an-tough-miss">{t.miss}% miss</div>
            </div>
          ))}
        </div> */}
      {/* </div> */}
    </>
  );
}

// ── Accuracy tab ──────────────────────────────────────────
function AccuracyTab({ setId, period }: { setId: string; period: Period }) {
  const data = useMemo(() => summaryFor(setId, period), [setId, period]);
  return (
    <>
      <div className="an-grid an-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Stat icon={<TargetIcon />} label="Current accuracy" value={data.accuracy} unit="%" delta={data.accuracyDelta} deltaSuffix="%" sparkData={data.series.map(d => d.value)} sparkColor="rgb(86, 182, 198)" />
        <Stat icon={<TargetIcon />} label="Best day" value={Math.max(...data.series.map(d => d.value))} unit="%" />
        <Stat icon={<TargetIcon />} label="Worst day" value={Math.min(...data.series.map(d => d.value))} unit="%" />
      </div>
      <div className="an-card">
        <div className="an-card-head">
          <div>
            <div className="an-title">Daily accuracy</div>
            <div className="an-sub">hover the chart for a day-by-day breakdown</div>
          </div>
        </div>
        <div className="an-card-body">
          <div className="an-chart-wrap" style={{ height: 360 }}>
            <LineChart data={data.series} height={360} accent="rgb(23, 12, 121)" />
          </div>
        </div>
      </div>
    </>
  );
}

// ── By Set tab ──────────────────────────────────────────
function BySetTab({ period }: { period: Period }) {
  const visibleSets = CARD_SETS.filter(s => s.id !== 'all');
  return (
    <div className="an-card">
      <div className="an-card-head">
        <div>
          <div className="an-title">All card sets</div>
          <div className="an-sub">{visibleSets.length} active sets · past {period.label}</div>
        </div>
      </div>
      {visibleSets.map(s => <SetRow key={s.id} set={s} period={period} />)}
    </div>
  );
}

// ── History tab ──────────────────────────────────────────
function HistoryTab({ setId, period }: { setId: string; period: Period }) {
  const data = useMemo(() => summaryFor(setId, period), [setId, period]);
  const rows = [...data.series].reverse();
  return (
    <div className="an-card">
      <div className="an-card-head">
        <div>
          <div className="an-title">Session history</div>
          <div className="an-sub">most recent first</div>
        </div>
      </div>
      <div className="an-history-header">
        <div>Date</div><div>Accuracy</div><div>Reviews</div><div>Time</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="an-history-row"
          style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none' }}>
          <div className="an-history-date">
            {r.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div>
            <span style={{
              fontWeight: 700,
              color: r.value >= 80 ? 'var(--ok)' : r.value >= 60 ? 'var(--warn)' : 'var(--bad)',
            }}>{r.value}%</span>
          </div>
          <div>{r.reviews}</div>
          <div className="an-history-muted">{Math.round(r.reviews * 4.2 / 60)} min</div>
        </div>
      ))}
    </div>
  );
}

// ── Main Analytics page ──────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview' },
  // { id: 'accuracy', label: 'Accuracy' },
  // { id: 'byset',   label: 'By set', count: CARD_SETS.length - 1 },
  // { id: 'history', label: 'History' },
];

export default function Analytics() {
  const [setId, setSetId] = useState('');
  const [periodId, setPeriodId] = useState('7d');
  const [tab, setTab] = useState('overview');
  const [realSets, setRealSets] = useState<RealSet[]>([]);
  const [realAccuracy, setRealAccuracy] = useState<number | null>(null);
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
    setRealAccuracy(null);
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
      })
      .catch(() => {});
  }, [setId, token]);

  return (
    <div className="analytics-root">
      <header className="an-topnav">
          <div className="an-topnav-inner">
            <div className="an-brand">
              <span className="an-brand-mark" />
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
        </header>
      <div className="analytics-app">
        <div className="an-page">
          <div className="an-page-head">
            <div className="an-page-title">
              <h1>Analytics</h1>
              <p>Track <span className="accent">accuracy</span>, streaks, and where to focus next.</p>
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
                  {t.count !== undefined && <span className="an-count">{t.count}</span>}
                </button>
              ))}
            </div>
            {/* <div className="an-seg">
              {PERIODS.map(p => (
                <button key={p.id}
                  className={periodId === p.id ? 'on' : ''}
                  onClick={() => setPeriodId(p.id)}>{p.id}</button>
              ))}
            </div> */}
          </div>

          {tab === 'overview' && <OverviewTab setId={setId} period={period} realAccuracy={realAccuracy} />}
          {tab === 'accuracy' && <AccuracyTab setId={setId} period={period} />}
          {tab === 'byset'    && <BySetTab period={period} />}
          {tab === 'history'  && <HistoryTab setId={setId} period={period} />}
        </div>
      </div>
      
    </div>
  );
}
