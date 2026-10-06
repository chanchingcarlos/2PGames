import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtDotsBoxes, TrophyIcon, DrawIcon, RestartIcon, HomeIcon, PlayIcon } from '../components/icons';

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const newBoard = () => shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);

const hasLine = (marks) => LINES.some((l) => l.every((i) => marks[i]));

export default function MiniBingo({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [boards, setBoards] = useState(() => [newBoard(), newBoard()]);
  const [pool, setPool] = useState(() => shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const [drawn, setDrawn] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const marksFor = (bi) => boards[bi].map((n) => drawn.includes(n));
  const m1 = marksFor(0);
  const m2 = marksFor(1);

  const call = () => {
    if (winner || pool.length === 0) return;
    const [next, ...rest] = pool;
    const nd = [...drawn, next];
    setDrawn(nd);
    setPool(rest);
    const w1 = hasLine(boards[0].map((n) => nd.includes(n)));
    const w2 = hasLine(boards[1].map((n) => nd.includes(n)));
    let w = null;
    if (w1 && w2) w = 'draw';
    else if (w1) w = 1;
    else if (w2) w = 2;
    else if (rest.length === 0) w = 'draw';
    if (w) {
      setWinner(w); setShowModal(true);
      if (!rep.current) { rep.current = true; onGameEnd?.(w); }
    }
  };

  const restart = () => {
    rep.current = false;
    setBoards([newBoard(), newBoard()]);
    setPool(shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    setDrawn([]); setWinner(null); setShowModal(false);
  };

  const grid = (bi, marks) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{label(bi + 1)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {boards[bi].map((n, i) => (
          <div key={i} style={{
            aspectRatio: '1', display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: '1.2rem', borderRadius: 12,
            background: marks[i] ? 'var(--accent-soft)' : 'var(--surface-2)',
            border: marks[i] ? '2px solid var(--accent)' : '1px solid var(--line)',
          }}>{n}</div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtDotsBoxes size={20} /></span>{t('bgTitle')}</h1>
          <div className="game-status">
            {!winner ? (
              <span className="status-item current-player">{t('bgLeft')}: {pool.length}</span>
            ) : winner === 'draw' ? (
              <span className="winner-badge draw"><DrawIcon size={16} /> {t('draw')}</span>
            ) : (
              <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          {grid(0, m1)}
          <div style={{ alignSelf: 'center', fontWeight: 800, color: 'var(--faint)' }}>VS</div>
          {grid(1, m2)}
        </div>

        <div style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 700 }}>
          {drawn.length > 0 ? `${t('bgCalled')}: ${drawn.join(' · ')}` : '—'}
        </div>

        <div className="game-controls">
          {!winner && pool.length > 0 && (
            <button className="btn btn-primary" onClick={call}><PlayIcon size={15} /> {t('bgCall')}</button>
          )}
          <button className="btn btn-primary" onClick={restart}><RestartIcon size={16} /> {t('restart')}</button>
          <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
        </div>

        {showModal && !hideEndModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {winner === 'draw' ? (
                <><div className="modal-medal draw"><DrawIcon size={28} /></div><h2>{t('draw')}</h2></>
              ) : (
                <><div className="modal-medal solid"><TrophyIcon size={28} /></div><h2>{t('congratulations')}</h2><p>{label(winner)} {t('wins')}</p></>
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
