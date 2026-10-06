import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { DiceFace, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const TURNS = 10;
const rollDie = () => 1 + Math.floor(Math.random() * 6);

export default function LuckySeven({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [played, setPlayed] = useState(0);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [dice, setDice] = useState([3, 4]);
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

  const bet = (kind) => {
    if (done || winner || (isSolo && turn === 2)) return;
    const d = [rollDie(), rollDie()];
    setDice(d);
    const sum = d[0] + d[1];
    let pts = 0;
    if (kind === 'seven' && sum === 7) pts = 2;
    else if (kind === 'over' && sum > 7) pts = 1;
    else if (kind === 'under' && sum < 7) pts = 1;
    const ns = { ...scores, [turn]: scores[turn] + pts };
    setScores(ns);
    setMsg(pts > 0 ? `${label(turn)} +${pts} · ${sum}` : `${sum}`);
    const np = played + 1;
    setPlayed(np);
    if (np >= TURNS) setTimeout(() => finish(ns), 1000);
  };

  useEffect(() => {
    if (!isSolo || turn !== 2 || done || winner) return;
    const kinds = ['over', 'under', 'seven'];
    const id = setTimeout(() => bet(kinds[Math.floor(Math.random() * 3)]), 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [played, isSolo]);

  const restart = () => {
    rep.current = false;
    setPlayed(0); setScores({ 1: 0, 2: 0 }); setDice([3, 4]);
    setMsg(null); setWinner(null); setShowModal(false);
  };

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><DiceFace value={6} size={20} /></span>{t('l7Title')}</h1>
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
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
            <DiceFace value={dice[0]} size={72} />
            <DiceFace value={dice[1]} size={72} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.4rem', marginTop: 6 }}>= {dice[0] + dice[1]}</div>
          {msg && <div style={{ marginTop: 4, fontWeight: 700 }}>{msg}</div>}
          {!done && !(isSolo && turn === 2) && (
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '0.9rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => bet('under')}>▼7</button>
              <button className="btn btn-primary" onClick={() => bet('seven')}>7 ★</button>
              <button className="btn btn-primary" onClick={() => bet('over')}>▲7</button>
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
