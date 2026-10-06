import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtMole, PlayIcon, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const COLS = 7;
const ROWS = 5;
const TIME = 20;

export default function CatchFall({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [stage, setStage] = useState(0); // 0 idle, 1 P1 playing, 2 P2 playing, 3 done
  const [basket, setBasket] = useState(3);
  const [items, setItems] = useState([]); // {id,col,row}
  const [score, setScore] = useState({ 1: 0, 2: 0 });
  const [left, setLeft] = useState(TIME);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);
  const idRef = useRef(0);
  const st = useRef({ stage, basket, items });
  st.current = { stage, basket, items };

  const active = stage === 1 ? 1 : stage === 2 ? 2 : null;

  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    setBasket(3); setItems([]); setLeft(TIME);
    const spawn = setInterval(() => {
      idRef.current++;
      const col = Math.floor(Math.random() * COLS);
      const id = idRef.current;
      setItems((it) => [...it, { id, col, row: 0 }]);
    }, 650);
    const fall = setInterval(() => {
      const s = st.current;
      setItems((it) => {
        const moved = it.map((o) => ({ ...o, row: o.row + 1 }));
        const caught = moved.filter((o) => o.row === ROWS - 1 && o.col === s.basket);
        if (caught.length > 0) {
          const p = s.stage;
          setScore((sc) => ({ ...sc, [p]: sc[p] + caught.length }));
        }
        return moved.filter((o) => o.row < ROWS);
      });
    }, 550);
    const clock = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(spawn); clearInterval(fall); clearInterval(clock);
          endStage();
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => { clearInterval(spawn); clearInterval(fall); clearInterval(clock); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const endStage = () => {
    const s = st.current.stage;
    if (s === 1) {
      if (isSolo) {
        // computer scores randomly then finish
        const cpu = 5 + Math.floor(Math.random() * 9);
        const ns = { 1: scoreRef.current[1], 2: cpu };
        setScore(ns);
        finishAll(ns);
      } else {
        setStage(2);
      }
    } else if (s === 2) {
      finishAll(scoreRef.current);
    }
  };
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const finishAll = (sc) => {
    setStage(3);
    const w = sc[1] === sc[2] ? 'draw' : sc[1] > sc[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const move = (d) => {
    if (active === null) return;
    if (isSolo && active === 2) return;
    setBasket((b) => Math.max(0, Math.min(COLS - 1, b + d)));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (active === null) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { move(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') { move(1); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isSolo]);

  const start = () => {
    rep.current = false;
    setScore({ 1: 0, 2: 0 }); setWinner(null); setShowModal(false);
    setStage(1);
  };

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtMole size={20} /></span>{t('caTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">
              {stage === 0 && `${score[1]} : ${score[2]}`}
              {active && `${label(active)} · ${left}s · ${score[1]} : ${score[2]}`}
              {stage === 3 && (winner === 'draw' ? t('draw') : `${t('winner')}: ${label(winner)} (${score[1]} : ${score[2]})`)}
            </span>
          </div>
        </div>

        <div style={{ padding: 10, borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 3 }}>
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const it = items.find((o) => o.row === r && o.col === c);
                const isB = r === ROWS - 1 && c === basket && active !== null;
                return (
                  <div key={`${r}-${c}`} style={{ aspectRatio: '1', borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', fontSize: '1.2rem' }}>
                    {it ? '🍎' : isB ? '🧺' : ''}
                  </div>
                );
              }),
            )}
          </div>
          {active !== null && !(isSolo && active === 2) && (
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: 10 }}>
              <button className="btn btn-secondary" onClick={() => move(-1)}>◀</button>
              <button className="btn btn-secondary" onClick={() => move(1)}>▶</button>
            </div>
          )}
          {stage === 0 && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button className="btn btn-primary" onClick={start}><PlayIcon size={15} /> {t('startGame')}</button>
            </div>
          )}
        </div>

        <div className="game-controls">
          <button className="btn btn-primary" onClick={start}><RestartIcon size={16} /> {t('restart')}</button>
          <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
        </div>

        {showModal && !hideEndModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {winner === 'draw' ? (
                <><div className="modal-medal draw"><DrawIcon size={28} /></div><h2>{t('draw')}</h2><p>{score[1]} : {score[2]}</p></>
              ) : (
                <><div className="modal-medal solid"><TrophyIcon size={28} /></div><h2>{t('congratulations')}</h2><p>{label(winner)} {t('wins')}（{score[1]} : {score[2]}）</p></>
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
