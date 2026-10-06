import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtClash, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const SYMS = ['🍒', '🍋', '🔔', '⭐', '💎'];
const SPINS = 5;

const spinReels = () => [0, 1, 2].map(() => SYMS[Math.floor(Math.random() * SYMS.length)]);
const scoreSpin = (r) => (r[0] === r[1] && r[1] === r[2] ? 3 : r[0] === r[1] || r[1] === r[2] || r[0] === r[2] ? 1 : 0);

export default function SlotMachine({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [played, setPlayed] = useState(0);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [reels, setReels] = useState(['🍒', '🍋', '🔔']);
  const [spinning, setSpinning] = useState(false);
  const [msg, setMsg] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const turn = played % 2 === 0 ? 1 : 2;
  const done = played >= SPINS * 2;

  const finish = (s) => {
    const w = s[1] === s[2] ? 'draw' : s[1] > s[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const spin = () => {
    if (spinning || done || winner || (isSolo && turn === 2)) return;
    setSpinning(true);
    setMsg(null);
    let ticks = 0;
    const id = setInterval(() => {
      ticks++;
      setReels(spinReels());
      if (ticks >= 8) {
        clearInterval(id);
        const r = spinReels();
        setReels(r);
        setSpinning(false);
        const pts = scoreSpin(r);
        const ns = { ...scores, [turn]: scores[turn] + pts };
        setScores(ns);
        setMsg(pts > 0 ? `${label(turn)} +${pts}` : '—');
        const np = played + 1;
        setPlayed(np);
        if (np >= SPINS * 2) setTimeout(() => finish(ns), 900);
      }
    }, 90);
  };

  useEffect(() => {
    if (!isSolo || turn !== 2 || done || winner || spinning) return;
    const id = setTimeout(spin, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [played, isSolo]);

  const restart = () => {
    rep.current = false;
    setPlayed(0); setScores({ 1: 0, 2: 0 });
    setReels(['🍒', '🍋', '🔔']); setSpinning(false);
    setMsg(null); setWinner(null); setShowModal(false);
  };

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtClash size={20} /></span>{t('slTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">
              {winner ? (winner === 'draw' ? t('draw') : `${t('winner')}: ${label(winner)}`) : `${label(turn)} · ${scores[1]} : ${scores[2]}`}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.6rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '3.4rem', letterSpacing: '0.3em' }}>{reels.join('')}</div>
          {msg && <div style={{ marginTop: 6, fontWeight: 800 }}>{msg}</div>}
          {!done && !(isSolo && turn === 2) && (
            <button className="btn btn-primary" style={{ marginTop: '0.8rem' }} disabled={spinning} onClick={spin}>
              🎰 {spinning ? '…' : t('slSpin')} ({Math.min(played + 1, SPINS * 2)}/{SPINS * 2})
            </button>
          )}
          {isSolo && turn === 2 && !done && <div style={{ marginTop: 8, color: 'var(--muted)' }}>…</div>}
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
} // SlotMachine
