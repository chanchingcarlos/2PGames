import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtMath, TrophyIcon, RestartIcon, HomeIcon } from '../components/icons';

export default function Race21({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [total, setTotal] = useState(0);
  const [turn, setTurn] = useState(1);
  const [log, setLog] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const move = (n) => {
    if (winner) return;
    if (n < 1 || n > 3 || total + n > 21) return;
    const nt = total + n;
    setLog((l) => [...l, { p: turn, n, t: nt }]);
    if (nt === 21) {
      setTotal(nt);
      setWinner(turn); setShowModal(true);
      if (!rep.current) { rep.current = true; onGameEnd?.(turn); }
    } else {
      setTotal(nt);
      setTurn(turn === 1 ? 2 : 1);
    }
  };

  // Solo: computer aims for multiples of 4
  useEffect(() => {
    if (!isSolo || turn !== 2 || winner) return;
    const id = setTimeout(() => {
      let n = 1;
      for (let k = 1; k <= 3; k++) {
        if ((total + k) % 4 === 0 || total + k === 21) { n = k; break; }
        n = k;
      }
      if (total + n > 21) n = 21 - total;
      move(n);
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, turn, isSolo, winner]);

  const restart = () => {
    rep.current = false;
    setTotal(0); setTurn(1); setLog([]); setWinner(null); setShowModal(false);
  };

  const opts = [1, 2, 3].filter((n) => total + n <= 21);
  const locked = !!winner || (isSolo && turn === 2);

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtMath size={20} /></span>{t('r21Title')}</h1>
          <div className="game-status">
            {!winner ? (
              <span className="status-item current-player">{t('currentPlayer')}: {label(turn)}</span>
            ) : (
              <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.4rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '3.6rem', fontWeight: 800 }}>{total}</div>
          <div style={{ color: 'var(--muted)', fontWeight: 700 }}>/ 21</div>
          {!winner && !locked && (
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '0.8rem' }}>
              {opts.map((n) => (
                <button key={n} className="btn btn-primary" onClick={() => move(n)}>+{n}</button>
              ))}
            </div>
          )}
          {isSolo && turn === 2 && !winner && <div style={{ marginTop: 8, color: 'var(--muted)' }}>…</div>}
        </div>

        {log.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {log.slice(-12).map((g, i) => (
              <span key={i} style={{ padding: '0.3rem 0.7rem', borderRadius: 999, background: g.p === 1 ? 'var(--accent-soft)' : 'var(--surface-2)', border: '1px solid var(--line)', fontWeight: 700, fontSize: '0.85rem' }}>
                {label(g.p)} +{g.n} = {g.t}
              </span>
            ))}
          </div>
        )}

        <div className="game-controls">
          <button className="btn btn-primary" onClick={restart}><RestartIcon size={16} /> {t('restart')}</button>
          <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
        </div>

        {showModal && !hideEndModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-medal solid"><TrophyIcon size={28} /></div>
              <h2>{t('congratulations')}</h2>
              <p>{label(winner)} {t('wins')}</p>
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
