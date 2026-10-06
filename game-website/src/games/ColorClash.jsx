import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtSimon, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const COLORS = [
  { zh: '紅', en: 'RED', ink: '#dc2626' },
  { zh: '藍', en: 'BLUE', ink: '#2563eb' },
  { zh: '綠', en: 'GREEN', ink: '#16a34a' },
  { zh: '黃', en: 'YELLOW', ink: '#ca8a04' },
];
const ROUNDS = 8;

const newQ = () => {
  const wi = Math.floor(Math.random() * 4);
  const match = Math.random() < 0.5;
  const ii = match ? wi : (wi + 1 + Math.floor(Math.random() * 3)) % 4;
  return { wi, ii, match };
};

export default function ColorClash({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t, language } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [round, setRound] = useState(0);
  const [q, setQ] = useState(newQ);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [lock, setLock] = useState({ 1: false, 2: false });
  const [msg, setMsg] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const done = round >= ROUNDS;

  const finish = (s) => {
    const w = s[1] === s[2] ? 'draw' : s[1] > s[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const next = (s) => {
    const nr = round + 1;
    if (nr >= ROUNDS) {
      setRound(nr);
      timer.current = setTimeout(() => finish(s), 800);
    } else {
      setRound(nr); setQ(newQ()); setLock({ 1: false, 2: false }); setMsg(null);
    }
  };

  const answer = (p, sayMatch) => {
    if (winner || done || lock[p]) return;
    if (isSolo && p === 2) return;
    if (sayMatch === q.match) {
      const ns = { ...scores, [p]: scores[p] + 1 };
      setScores(ns);
      setMsg(`${label(p)} +1`);
      timer.current = setTimeout(() => next(ns), 750);
    } else {
      setLock((l) => ({ ...l, [p]: true }));
      if (lock[p === 1 ? 2 : 1]) {
        // both wrong: no point, move on
        timer.current = setTimeout(() => next(scores), 750);
      }
    }
  };

  // Solo: computer races to answer
  useEffect(() => {
    if (!isSolo || winner || done || msg) return;
    const id = setTimeout(() => {
      const correct = Math.random() < 0.8;
      const say = correct ? q.match : !q.match;
      if (say === q.match) {
        const ns = { ...scores, 2: scores[2] + 1 };
        setScores(ns);
        setMsg(`${label(2)} +1`);
        timer.current = setTimeout(() => {
          const nr = round + 1;
          if (nr >= ROUNDS) { setRound(nr); finish(ns); }
          else { setRound(nr); setQ(newQ()); setLock({ 1: false, 2: false }); setMsg(null); }
        }, 750);
      }
    }, 1600 + Math.random() * 1800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, q, isSolo, msg]);

  const restart = () => {
    clearTimeout(timer.current);
    rep.current = false;
    setRound(0); setQ(newQ()); setScores({ 1: 0, 2: 0 });
    setLock({ 1: false, 2: false }); setMsg(null); setWinner(null); setShowModal(false);
  };

  const word = language === 'zh' ? COLORS[q.wi].zh : COLORS[q.wi].en;

  const panel = (p) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '0.8rem', borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--line)', opacity: lock[p] ? 0.5 : 1 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{label(p)} · {scores[p]}</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button className="btn btn-primary" style={{ padding: '0.5rem 0.9rem' }} disabled={!!winner || lock[p] || !!msg || (isSolo && p === 2)} onClick={() => answer(p, true)}>✓</button>
        <button className="btn btn-secondary" style={{ padding: '0.5rem 0.9rem' }} disabled={!!winner || lock[p] || !!msg || (isSolo && p === 2)} onClick={() => answer(p, false)}>✕</button>
      </div>
    </div>
  );

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtSimon size={20} /></span>{t('stTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">{t('round')} {Math.min(round + 1, ROUNDS)}/{ROUNDS} · {scores[1]} : {scores[2]}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.6rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: COLORS[q.ii].ink }}>{word}</div>
          <div style={{ color: 'var(--muted)', fontWeight: 700, marginTop: 4 }}>{t('stAsk')}</div>
          {msg && <div style={{ marginTop: 6, fontWeight: 800 }}>{msg}</div>}
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {panel(1)}
          {panel(2)}
        </div>

        <div className="game-controls">
          <button className="btn btn-primary" onClick={restart}><RestartIcon size={16} /> {t('restart')}</button>
          <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
        </div>

        {showModal && !hideEndModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {winner === 'draw' ? (
                <><div className="modal-medal draw"><DrawIcon size={28} /></div><h2>{t('draw')}</h2><p>{scores[1]} : {scores[2]}</p></>
              ) : (
                <><div className="modal-medal solid"><TrophyIcon size={28} /></div><h2>{t('congratulations')}</h2><p>{label(winner)} {t('wins')}（{scores[1]} : {scores[2]}）</p></>
              )}
              <div className="modal-buttons">
                <button className="btn btn-primary" onClick={restart}><RestartIcon size={16} /> {t('playAgain')}</button>
                <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
