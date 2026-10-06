import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtMole, PlayIcon, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const CELLS = 12;
const TIME = 20;

export default function BalloonPop({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [stage, setStage] = useState(0); // 0 idle, 1 P1, 2 P2, 3 done
  const [balloon, setBalloon] = useState(null);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [left, setLeft] = useState(TIME);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);
  const scoreRef = useRef(scores);
  scoreRef.current = scores;

  useEffect(() => {
    if (stage !== 1 && stage !== 2) return;
    setBalloon(Math.floor(Math.random() * CELLS));
    setLeft(TIME);
    const hop = setInterval(() => {
      setBalloon(Math.floor(Math.random() * CELLS));
    }, 750);
    const clock = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(hop); clearInterval(clock);
          endStage();
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => { clearInterval(hop); clearInterval(clock); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const endStage = () => {
    setBalloon(null);
    if (stage === 1) {
      if (isSolo) {
        const cpu = 6 + Math.floor(Math.random() * 7);
        const ns = { 1: scoreRef.current[1], 2: cpu };
        setScores(ns);
        finishAll(ns);
      } else {
        setStage(2);
      }
    } else {
      finishAll(scoreRef.current);
    }
  };

  const finishAll = (sc) => {
    setStage(3);
    const w = sc[1] === sc[2] ? 'draw' : sc[1] > sc[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const pop = (i) => {
    if ((stage !== 1 && stage !== 2) || winner) return;
    if (isSolo && stage === 2) return;
    if (i === balloon) {
      setScores((s) => ({ ...s, [stage]: s[stage] + 1 }));
      setBalloon(Math.floor(Math.random() * CELLS));
    }
  };

  const start = () => {
    rep.current = false;
    setScores({ 1: 0, 2: 0 }); setWinner(null); setShowModal(false);
    setStage(1);
  };

  const active = stage === 1 || stage === 2;

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtMole size={20} /></span>{t('baTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">
              {stage === 0 && `${scores[1]} : ${scores[2]}`}
              {active && `${label(stage)} · ${left}s · ${scores[1]} : ${scores[2]}`}
              {stage === 3 && (winner === 'draw' ? t('draw') : `${t('winner')}: ${label(winner)} (${scores[1]} : ${scores[2]})`)}
            </span>
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {Array.from({ length: CELLS }, (_, i) => (
              <button
                key={i}
                onClick={() => pop(i)}
                disabled={!active}
                style={{
                  aspectRatio: '0.85', borderRadius: 14, border: '1px solid var(--line)',
                  background: 'var(--surface-2)', fontSize: '2rem', cursor: active ? 'pointer' : 'default',
                }}
              >
                {i === balloon && active ? '🎈' : ''}
              </button>
            ))}
          </div>
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
} // BalloonPop
