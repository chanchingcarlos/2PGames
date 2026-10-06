import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtNim, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const LEVELS = 8;

export default function TowerStack({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [builder, setBuilder] = useState(1); // whose tower now
  const [level, setLevel] = useState(0);
  const [pos, setPos] = useState(0);
  const [dir, setDir] = useState(1);
  const [offsets, setOffsets] = useState({ 1: [], 2: [] });
  const [collapsed, setCollapsed] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);
  const active = winner === null && collapsed === null && (builder === 1 || !isSolo);

  useEffect(() => {
    if (winner || collapsed !== null) return;
    if (isSolo && builder === 2) return;
    const id = setInterval(() => {
      setPos((p) => {
        if (p >= 6) { setDir(-1); return 5; }
        if (p <= 0) { setDir(1); return 1; }
        return p + dir;
      });
    }, 130);
    return () => clearInterval(id);
  }, [builder, winner, collapsed, dir, isSolo]);

  // Solo: computer builds instantly with random offsets
  useEffect(() => {
    if (!isSolo || builder !== 2 || winner || collapsed !== null) return;
    const id = setTimeout(() => {
      const arr = [];
      for (let i = 0; i < LEVELS; i++) {
        const o = Math.floor(Math.random() * 4); // 0-3
        if (o >= 3) { // collapse
          setOffsets((s) => ({ ...s, 2: arr }));
          setCollapsed(2);
          setWinner(1); setShowModal(true);
          if (!rep.current) { rep.current = true; onGameEnd?.(1); }
          return;
        }
        arr.push(o);
      }
      const no = { ...offsets, 2: arr };
      setOffsets(no);
      compare(no);
    }, 1200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder, isSolo]);

  const compare = (no) => {
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const w = sum(no[1]) === sum(no[2]) ? 'draw' : sum(no[1]) < sum(no[2]) ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const lock = () => {
    if (winner || collapsed !== null) return;
    if (isSolo && builder === 2) return;
    const off = Math.abs(pos - 3);
    if (off >= 3) {
      setCollapsed(builder);
      const w = builder === 1 ? 2 : 1;
      setWinner(w); setShowModal(true);
      if (!rep.current) { rep.current = true; onGameEnd?.(w); }
      return;
    }
    const no = { ...offsets, [builder]: [...offsets[builder], off] };
    setOffsets(no);
    if (no[builder].length >= LEVELS) {
      if (builder === 1) {
        setBuilder(2); setLevel(0); setPos(0); setDir(1);
      } else {
        compare(no);
      }
    } else {
      setLevel(no[builder].length);
    }
  };

  const restart = () => {
    rep.current = false;
    setBuilder(1); setLevel(0); setPos(0); setDir(1);
    setOffsets({ 1: [], 2: [] }); setCollapsed(null);
    setWinner(null); setShowModal(false);
  };

  const renderTower = (p) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{label(p)} · Σ{offsets[p].reduce((a, b) => a + b, 0)}</div>
      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 3, minHeight: LEVELS * 20 }}>
        {Array.from({ length: LEVELS }, (_, i) => {
          const locked = i < offsets[p].length;
          const isCur = builder === p && i === offsets[p].length && collapsed === null && !winner;
          const off = locked ? offsets[p][i] : isCur ? Math.abs(pos - 3) : null;
          return (
            <div key={i} style={{
              height: 17, borderRadius: 5, marginLeft: off === null ? 0 : off * 12, marginRight: off === null ? 0 : 0,
              background: locked ? (offsets[p][i] === 2 ? '#ca8a04' : 'var(--accent)') : isCur ? 'var(--accent-soft)' : 'var(--surface-2)',
              border: isCur ? '2px dashed var(--accent)' : '1px solid var(--line)',
            }} />
          );
        })}
      </div>
      {collapsed === p && <div style={{ fontWeight: 800, color: '#dc2626' }}>💥</div>}
    </div>
  );

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtNim size={20} /></span>{t('twTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">
              {winner ? (winner === 'draw' ? t('draw') : `${t('winner')}: ${label(winner)}`) : `${label(builder)} · ${t('twLevel')} ${offsets[builder].length + 1}/${LEVELS}`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          {renderTower(1)}
          <div style={{ alignSelf: 'center', fontWeight: 800, color: 'var(--faint)' }}>VS</div>
          {renderTower(2)}
        </div>

        {active && (
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={lock}>🛑 {t('twStop')} ({level + 1}/{LEVELS})</button>
          </div>
        )}
        {isSolo && builder === 2 && !winner && <div style={{ textAlign: 'center', color: 'var(--muted)' }}>…</div>}

        <div className="game-controls">
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
