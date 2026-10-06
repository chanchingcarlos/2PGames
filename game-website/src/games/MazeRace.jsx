import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtBattle, PlayIcon, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const MAP = [
  '#############',
  '#A....#.....#',
  '###.#.#.###.#',
  '#...#...#...#',
  '#.#####.###.#',
  '#.....#...#.#',
  '#####.###.#.#',
  '#...#.....#.#',
  '#.#.#######.#',
  '#.#.......#.#',
  '#.#######.#.#',
  '#B......#...E',
  '#############',
];
const W = MAP[0].length;
const H = MAP.length;
const LIMIT = 90;

const findChar = (ch) => {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (MAP[y][x] === ch) return [x, y];
  return [1, 1];
};
const START_A = findChar('A');
const START_B = findChar('B');
const EXIT = findChar('E');
const isWall = (x, y) => x < 0 || y < 0 || x >= W || y >= H || MAP[y][x] === '#';

export default function MazeRace({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState({ 1: START_A, 2: START_B });
  const [left, setLeft] = useState(LIMIT);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const endWith = (w) => {
    setRunning(false);
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id);
          // closer to exit wins
          const d = (p) => Math.abs(pos[p][0] - EXIT[0]) + Math.abs(pos[p][1] - EXIT[1]);
          const w = isSolo ? (d(1) === 0 ? 1 : 2) : d(1) === d(2) ? 'draw' : d(1) < d(2) ? 1 : 2;
          endWith(w);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, pos, isSolo]);

  const move = (p, dx, dy) => {
    if (!running || winner) return;
    if (isSolo && p === 2) return;
    setPos((s) => {
      const [x, y] = s[p];
      if (isWall(x + dx, y + dy)) return s;
      const np = { ...s, [p]: [x + dx, y + dy] };
      if (np[p][0] === EXIT[0] && np[p][1] === EXIT[1]) {
        setTimeout(() => endWith(p), 50);
      }
      return np;
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w') move(1, 0, -1);
      else if (k === 's') move(1, 0, 1);
      else if (k === 'a') move(1, -1, 0);
      else if (k === 'd') move(1, 1, 0);
      else if (e.key === 'ArrowUp') { if (!isSolo) move(2, 0, -1); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { if (!isSolo) move(2, 0, 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { if (!isSolo) move(2, -1, 0); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { if (!isSolo) move(2, 1, 0); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, winner, isSolo]);

  const start = () => {
    rep.current = false;
    setPos({ 1: START_A, 2: START_B });
    setLeft(LIMIT); setWinner(null); setShowModal(false);
    setRunning(true);
  };

  const pad = (p) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gap: 4, justifyContent: 'center' }}>
      <span />
      <button className="btn btn-secondary" style={{ padding: '0.5rem 0' }} onClick={() => move(p, 0, -1)}>▲</button>
      <span />
      <button className="btn btn-secondary" style={{ padding: '0.5rem 0' }} onClick={() => move(p, -1, 0)}>◀</button>
      <button className="btn btn-secondary" style={{ padding: '0.5rem 0' }} onClick={() => move(p, 0, 1)}>▼</button>
      <button className="btn btn-secondary" style={{ padding: '0.5rem 0' }} onClick={() => move(p, 1, 0)}>▶</button>
    </div>
  );

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtBattle size={20} /></span>{t('mzTitle')}</h1>
          <div className="game-status">
            {winner ? (
              winner === 'draw' ? <span className="winner-badge draw"><DrawIcon size={16} /> {t('draw')}</span>
                : <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            ) : (
              <span className="status-item current-player">⏱ {left}s</span>
            )}
          </div>
        </div>

        <div style={{ padding: 8, borderRadius: 16, background: '#0b1020', border: '1px solid var(--line)', maxWidth: 430, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${W}, 1fr)`, gap: 1 }}>
            {Array.from({ length: H }, (_, y) =>
              Array.from({ length: W }, (_, x) => {
                const wall = MAP[y][x] === '#';
                const isE = x === EXIT[0] && y === EXIT[1];
                const p1 = pos[1][0] === x && pos[1][1] === y;
                const p2 = !isSolo && pos[2][0] === x && pos[2][1] === y;
                let bg = wall ? '#243044' : '#e8edf5';
                let txt = '';
                if (isE) { bg = '#16a34a'; txt = '🏁'; }
                if (p1 && p2) { bg = '#a855f7'; txt = ''; }
                else if (p1) { bg = '#38bdf8'; }
                else if (p2) { bg = '#f87171'; }
                return <div key={`${x}-${y}`} style={{ aspectRatio: '1', borderRadius: 2, background: bg, display: 'grid', placeItems: 'center', fontSize: 10 }}>{txt}</div>;
              }),
            )}
          </div>
        </div>

        {running && !winner && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 800, marginBottom: 4 }}>{label(1)}</div>{pad(1)}</div>
            {!isSolo && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 800, marginBottom: 4 }}>{label(2)}</div>{pad(2)}</div>}
          </div>
        )}

        <div className="game-controls">
          <button className="btn btn-primary" onClick={start}><PlayIcon size={15} /> {running ? t('restart') : t('startGame')}</button>
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
