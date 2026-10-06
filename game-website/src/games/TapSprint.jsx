import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtRace, TapIcon, PlayIcon, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const ROUNDS = 7;

export default function TapSprint({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | wait | go
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [flash, setFlash] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const phaseRef = useRef(phase);
  const timers = useRef([]);
  const rep = useRef(false);
  const scoresRef = useRef(scores);
  scoresRef.current = scores;
  const scoredRef = useRef(false); // round already decided — ignore further taps

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const clearT = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);

  const finish = useCallback((s) => {
    clearT();
    setPhase('idle');
    const w = s[1] === s[2] ? 'draw' : s[1] > s[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  }, [clearT, onGameEnd]);

  const scorePoint = useCallback((p) => {
    if (scoredRef.current) return;
    scoredRef.current = true;
    clearT(); // cancel pending GO / computer timers so the decided round can't score again
    const ns = { ...scoresRef.current, [p]: scoresRef.current[p] + 1 };
    setScores(ns);
    setFlash(p);
    const nr = round + 1;
    if (nr >= ROUNDS) {
      const id = setTimeout(() => finish(ns), 900);
      timers.current.push(id);
    } else {
      const id = setTimeout(() => { setRound(nr); setFlash(null); beginRound(); }, 1000);
      timers.current.push(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, finish, clearT]);

  const beginRound = useCallback(() => {
    scoredRef.current = false;
    setPhase('wait');
    const d = 800 + Math.random() * 1800;
    const id = setTimeout(() => {
      setPhase('go');
      if (isSolo) {
        const cid = setTimeout(() => {
          if (phaseRef.current === 'go') scorePoint(2);
        }, 260 + Math.random() * 420);
        timers.current.push(cid);
      }
    }, d);
    timers.current.push(id);
  }, [isSolo, scorePoint]);

  const start = () => {
    clearT();
    rep.current = false;
    scoredRef.current = false;
    setStarted(true); setRound(0); setScores({ 1: 0, 2: 0 });
    setFlash(null); setWinner(null); setShowModal(false);
    setTimeout(beginRound, 300);
  };

  const tap = (p) => {
    if (!started || winner) return;
    if (phaseRef.current === 'wait') {
      // foul: opponent scores
      scorePoint(p === 1 ? 2 : 1);
    } else if (phaseRef.current === 'go') {
      if (isSolo && p === 2) return;
      scorePoint(p);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'q') tap(1);
      else if (k === 'p' && !isSolo) tap(2);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, winner, round, phase, isSolo]);

  const bg = !started || winner ? 'var(--surface)' : phase === 'go' ? '#16a34a' : '#dc2626';
  const fg = phase === 'wait' || phase === 'go' ? '#fff' : undefined;

  return (
    <Layout showBack onBack={() => { clearT(); onBack(); }}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtRace size={20} /></span>{t('tapTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">{t('round')} {Math.min(round + 1, ROUNDS)}/{ROUNDS} · {scores[1]} : {scores[2]}</span>
            {winner && winner !== 'draw' && <span className="winner-badge"><TrophyIcon size={16} /> {label(winner)}</span>}
            {winner === 'draw' && <span className="winner-badge draw"><DrawIcon size={16} /> {t('draw')}</span>}
          </div>
        </div>

        {!started ? (
          <div style={{ textAlign: 'center', padding: '1.6rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <p style={{ color: 'var(--muted)', fontWeight: 600 }}>{t('tapDesc')}</p>
            <button className="btn btn-primary" onClick={start}><PlayIcon size={15} /> {t('startGame')}</button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '2rem 1rem', borderRadius: 20, background: bg, color: fg, fontWeight: 800, fontSize: '1.8rem', transition: 'background 0.2s' }}>
              {winner ? (winner === 'draw' ? t('draw') : `${label(winner)} ${t('wins')}`) : phase === 'go' ? t('go') : phase === 'wait' ? '···' : ''}
              {flash && !winner && <div style={{ fontSize: '1rem' }}>{label(flash)} +1</div>}
            </div>
            {!winner && (
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button type="button" className="btn btn-primary" style={{ flex: 1, padding: '1.4rem 0' }} onClick={() => tap(1)}>
                  <TapIcon size={16} /> {label(1)} [Q]
                </button>
                <button type="button" className="btn btn-primary" style={{ flex: 1, padding: '1.4rem 0' }} onClick={() => tap(2)} disabled={isSolo}>
                  <TapIcon size={16} /> {label(2)} [P]
                </button>
              </div>
            )}
          </>
        )}

        <div className="game-controls">
          {started && !winner && <button className="btn btn-primary" onClick={start}><RestartIcon size={16} /> {t('restart')}</button>}
          {winner && <button className="btn btn-primary" onClick={start}><RestartIcon size={16} /> {t('playAgain')}</button>}
          <button className="btn btn-secondary" onClick={() => { clearT(); onBack(); }}><HomeIcon size={16} /> {t('backToMenu')}</button>
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
                <button className="btn btn-primary" onClick={() => { setShowModal(false); start(); }}><RestartIcon size={16} /> {t('playAgain')}</button>
                <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
