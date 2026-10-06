import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtBlackjack, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const TURNS = 10;

const drawCard = () => Math.floor(Math.random() * 13);

export default function HighLow({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [card, setCard] = useState(drawCard);
  const [played, setPlayed] = useState(0);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [msg, setMsg] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const turn = played % 2 === 0 ? 1 : 2;
  const done = played >= TURNS;

  const finish = (s) => {
    const w = s[1] === s[2] ? 'draw' : s[1] > s[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const play = (dir) => {
    if (done || winner || (isSolo && turn === 2)) return;
    const next = drawCard();
    let ok = false;
    if (next > card && dir === 'hi') ok = true;
    if (next < card && dir === 'lo') ok = true;
    const ns = { ...scores, [turn]: scores[turn] + (ok ? 1 : 0) };
    setScores(ns);
    setCard(next);
    setMsg(ok ? `${label(turn)} +1 · ${RANKS[next]}` : `${RANKS[next]}`);
    const np = played + 1;
    setPlayed(np);
    if (np >= TURNS) setTimeout(() => finish(ns), 900);
  };

  useEffect(() => {
    if (!isSolo || turn !== 2 || done || winner) return;
    const id = setTimeout(() => play(Math.random() < 0.5 ? 'hi' : 'lo'), 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [played, isSolo]);

  const restart = () => {
    rep.current = false;
    setCard(drawCard()); setPlayed(0); setScores({ 1: 0, 2: 0 });
    setMsg(null); setWinner(null); setShowModal(false);
  };

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtBlackjack size={20} /></span>{t('hlTitle')}</h1>
          <div className="game-status">
            {!winner ? (
              <span className="status-item current-player">{label(turn)} · {scores[1]} : {scores[2]} · {played}/{TURNS}</span>
            ) : winner === 'draw' ? (
              <span className="winner-badge draw"><DrawIcon size={16} /> {t('draw')}</span>
            ) : (
              <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.4rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '3.4rem', fontWeight: 800 }}>{RANKS[card]}</div>
          {msg && <div style={{ marginTop: 4, fontWeight: 700 }}>{msg}</div>}
          {!done && !(isSolo && turn === 2) && (
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '0.9rem' }}>
              <button className="btn btn-primary" onClick={() => play('hi')}>▲ {t('hlHigh')}</button>
              <button className="btn btn-primary" onClick={() => play('lo')}>▼ {t('hlLow')}</button>
            </div>
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
}
