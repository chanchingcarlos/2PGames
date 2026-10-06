import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtSnake, PlayIcon, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const W = 14;
const H = 14;
const TICK = 170;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export default function TronDuel({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [running, setRunning] = useState(false);
  const [trails, setTrails] = useState({ 1: [], 2: [] });
  const [heads, setHeads] = useState({ 1: [3, 7], 2: [10, 7] });
  const [dirs, setDirs] = useState({ 1: 'right', 2: 'left' });
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const st = useRef(null);
  const rep = useRef(false);
  const isSoloRef = useRef(isSolo);
  useEffect(() => { st.current = { heads, dirs, trails, running, winner }; });
  useEffect(() => { isSoloRef.current = isSolo; });

  const endWith = useCallback((w) => {
    setRunning(false);
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  }, [onGameEnd]);

  const step = useCallback(() => {
    const s = st.current;
    if (!s.running || s.winner) return;
    let { heads: h, dirs: d, trails: tr } = s;
    // Solo AI: turn if blocked ahead
    if (isSoloRef.current) {
      const [hx, hy] = h[2];
      const [dx, dy] = DIRS[d[2]];
      const nx = hx + dx;
      const ny = hy + dy;
      const occ = new Set([...tr[1].map(String), ...tr[2].map(String), [h[1]].map(String)[0]]);
      const blocked = nx < 0 || ny < 0 || nx >= W || ny >= H || occ.has([nx, ny].toString());
      if (blocked || Math.random() < 0.06) {
        const opts = ['up', 'down', 'left', 'right'].filter((k) => {
          const [ox, oy] = DIRS[k];
          const ax = hx + ox;
          const ay = hy + oy;
          if (ax < 0 || ay < 0 || ax >= W || ay >= H) return false;
          if (occ.has([ax, ay].toString())) return false;
          // no 180° turn
          if (ox === -dx && oy === -dy) return false;
          return true;
        });
        if (opts.length > 0) d = { ...d, 2: opts[Math.floor(Math.random() * opts.length)] };
      }
    }
    const nh = {};
    const dead = {};
    for (const p of [1, 2]) {
      const [dx, dy] = DIRS[d[p]];
      nh[p] = [h[p][0] + dx, h[p][1] + dy];
    }
    const occ = new Set();
    [...tr[1], ...tr[2], h[1], h[2]].forEach((c) => occ.add(c.toString()));
    for (const p of [1, 2]) {
      const [x, y] = nh[p];
      dead[p] = x < 0 || y < 0 || x >= W || y >= H || occ.has([x, y].toString());
    }
    // head-on same cell = draw
    if (nh[1].toString() === nh[2].toString()) { setHeads(nh); endWith('draw'); return; }
    if (dead[1] && dead[2]) { setHeads(nh); endWith('draw'); return; }
    if (dead[1]) { setHeads(nh); endWith(2); return; }
    if (dead[2]) { setHeads(nh); endWith(1); return; }
    setTrails({ 1: [...tr[1], h[1]], 2: [...tr[2], h[2]] });
    setHeads(nh);
    setDirs(d);
  }, [endWith]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(step, TICK);
    return () => clearInterval(id);
  }, [running, step]);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const set = (p, dir) => setDirs((d) => {
        const cur = DIRS[d[p]];
        const nxt = DIRS[dir];
        if (cur[0] === -nxt[0] && cur[1] === -nxt[1]) return d;
        return { ...d, [p]: dir };
      });
      if (k === 'w') set(1, 'up');
      else if (k === 's') set(1, 'down');
      else if (k === 'a') set(1, 'left');
      else if (k === 'd') set(1, 'right');
      else if (e.key === 'ArrowUp') { if (!isSolo) set(2, 'up'); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { if (!isSolo) set(2, 'down'); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { if (!isSolo) set(2, 'left'); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { if (!isSolo) set(2, 'right'); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSolo]);

  const start = () => {
    rep.current = false;
    setTrails({ 1: [], 2: [] });
    setHeads({ 1: [3, 7], 2: [10, 7] });
    setDirs({ 1: 'right', 2: 'left' });
    setWinner(null); setShowModal(false);
    setRunning(true);
  };

  const pad = (p, map) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: 4, justifyContent: 'center' }}>
      <span />
      <button className="btn btn-secondary" style={{ padding: '0.4rem 0' }} onClick={() => map('up')}>▲</button>
      <span />
      <button className="btn btn-secondary" style={{ padding: '0.4rem 0' }} onClick={() => map('left')}>◀</button>
      <button className="btn btn-secondary" style={{ padding: '0.4rem 0' }} onClick={() => map('down')}>▼</button>
      <button className="btn btn-secondary" style={{ padding: '0.4rem 0' }} onClick={() => map('right')}>▶</button>
    </div>
  );
  const turn = (p, dir) => setDirs((d) => {
    const cur = DIRS[d[p]];
    const nxt = DIRS[dir];
    if (cur[0] === -nxt[0] && cur[1] === -nxt[1]) return d;
    return { ...d, [p]: dir };
  });

  const occ1 = new Set(trails[1].map(String));
  const occ2 = new Set(trails[2].map(String));

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtSnake size={20} /></span>{t('trTitle')}</h1>
          <div className="game-status">
            {winner ? (
              winner === 'draw' ? <span className="winner-badge draw"><DrawIcon size={16} /> {t('draw')}</span>
                : <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            ) : (
              <span className="status-item current-player">{label(1)} (WASD) · {label(2)} (←↑↓→)</span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${W}, 1fr)`, gap: 1, padding: 6, borderRadius: 16, background: '#0b1020', border: '1px solid var(--line)', maxWidth: 420, margin: '0 auto', width: '100%' }}>
          {Array.from({ length: H }, (_, y) =>
            Array.from({ length: W }, (_, x) => {
              const k = [x, y].toString();
              const isH1 = heads[1].toString() === k;
              const isH2 = heads[2].toString() === k;
              const bg = isH1 ? '#38bdf8' : isH2 ? '#f87171' : occ1.has(k) ? '#0ea5e9' : occ2.has(k) ? '#ef4444' : 'transparent';
              return <div key={k} style={{ aspectRatio: '1', borderRadius: 2, background: bg }} />;
            }),
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {pad(1, (d) => turn(1, d))}
          {!isSolo && pad(2, (d) => turn(2, d))}
        </div>

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
