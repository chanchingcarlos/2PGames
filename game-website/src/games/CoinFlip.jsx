import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtClash, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const ROUNDS = 5;

export default function CoinFlip({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [played, setPlayed] = useState(0);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [coin, setCoin] = useState(null); // 'H' | 'T'
  const [flipping, setFlipping] = useState(false);
  const [msg, setMsg] = useState(null); // round result text
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const guesser = played % 2 === 0 ? 1 : 2;
  const done = played >= ROUNDS;

  const finish = (s) => {
    const w = s[1] === s[2] ? 'draw' : s[1] > s[2] ? 1 : 2;
    setWinner(w);
    setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const guess = (pick) => {
    if (flipping || done || winner) return;
    if (isSolo && guesser === 2) return;
    setFlipping(true);
    setMsg(null);
    setCoin(null);
    let ticks = 0;
    const spin = () => {
      ticks++;
      setCoin(Math.random() < 0.5 ? 'H' : 'T');
      if (ticks < 6) {
        timer.current = setTimeout(spin, 90);
      } else {
        const final = Math.random() < 0.5 ? 'H' : 'T';
        setCoin(final);
        setFlipping(false);
        const hit = pick === final;
        const ns = { ...scores, [guesser]: scores[guesser] + (hit ? 1 : 0) };
        setScores(ns);
        setMsg(hit ? `${label(guesser)} +1` : '×');
        const np = played + 1;
        setPlayed(np);
        if (np >= ROUNDS) {
          timer.current = setTimeout(() => finish(ns), 900);
        } else {
          timer.current = setTimeout(() => { setCoin(null); setMsg(null); }, 900);
        }
      }
    };
    spin();
  };

  // Solo: computer guesses
  useEffect(() => {
    if (!isSolo || guesser !== 2 || flipping || done || winner || coin || msg) return;
    const id = setTimeout(() => guess(Math.random() < 0.5 ? 'H' : 'T'), 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [played, isSolo]);

  const restart = () => {
    clearTimeout(timer.current);
    rep.current = false;
    setPlayed(0); setScores({ 1: 0, 2: 0 });
    setCoin(null); setFlipping(false); setMsg(null);
    setWinner(null); setShowModal(false);
  };

  const face = coin === null ? '🪙' : coin === 'H' ? '🌕' : '🌑';
  const faceTxt = coin === null ? '?' : coin === 'H' ? t('coinH') : t('coinT');

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtClash size={20} /></span>{t('coinTitle')}</h1>
          <div className="game-status">
            {!winner ? (
              <span className="status-item current-player">{t('round')} {Math.min(played + 1, ROUNDS)}/{ROUNDS} · {scores[1]} : {scores[2]} · {label(guesser)}</span>
            ) : winner === 'draw' ? (
              <span className="winner-badge draw"><DrawIcon size={16} /> {t('draw')}</span>
            ) : (
              <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.2rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '4rem' }}>{face}</div>
          <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{faceTxt}</div>
          {msg && <div style={{ marginTop: 6, fontWeight: 700 }}>{msg}</div>}
          {!done && !flipping && !(isSolo && guesser === 2) && (
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '0.8rem' }}>
              <button className="btn btn-primary" onClick={() => guess('H')}>{t('coinH')}</button>
              <button className="btn btn-primary" onClick={() => guess('T')}>{t('coinT')}</button>
            </div>
          )}
          {isSolo && guesser === 2 && !done && <div style={{ marginTop: 8, color: 'var(--muted)' }}>…</div>}
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
