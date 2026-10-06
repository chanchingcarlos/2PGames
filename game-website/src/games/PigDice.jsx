import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { DiceFace, TrophyIcon, RestartIcon, HomeIcon } from '../components/icons';

const TARGET = 50;

export default function PigDice({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [bank, setBank] = useState({ 1: 0, 2: 0 });
  const [turnTotal, setTurnTotal] = useState(0);
  const [turn, setTurn] = useState(1);
  const [die, setDie] = useState(6);
  const [msg, setMsg] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const roll = () => {
    if (winner || (isSolo && turn === 2)) return;
    const d = 1 + Math.floor(Math.random() * 6);
    setDie(d);
    if (d === 1) {
      setMsg(`💥 ${label(turn)} bust`);
      setTurnTotal(0);
      setTimeout(() => { setMsg(null); setTurn(turn === 1 ? 2 : 1); }, 900);
    } else {
      setTurnTotal(turnTotal + d);
    }
  };

  const hold = () => {
    if (winner || (isSolo && turn === 2)) return;
    const nb = { ...bank, [turn]: bank[turn] + turnTotal };
    setBank(nb);
    setTurnTotal(0);
    setMsg(null);
    if (nb[turn] >= TARGET) {
      setWinner(turn); setShowModal(true);
      if (!rep.current) { rep.current = true; onGameEnd?.(turn); }
    } else {
      setTurn(turn === 1 ? 2 : 1);
    }
  };

  // Solo AI
  useEffect(() => {
    if (!isSolo || turn !== 2 || winner) return;
    const id = setTimeout(() => {
      if (bank[2] + turnTotal >= TARGET) { hold(); return; }
      if (turnTotal >= 16 + Math.random() * 6) { hold(); return; }
      // roll inline (avoid stale closure by reusing logic)
      const d = 1 + Math.floor(Math.random() * 6);
      setDie(d);
      if (d === 1) {
        setTurnTotal(0);
        setTurn(1);
      } else {
        setTurnTotal(turnTotal + d);
      }
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSolo, turn, turnTotal, bank, winner]);

  const restart = () => {
    rep.current = false;
    setBank({ 1: 0, 2: 0 }); setTurnTotal(0); setTurn(1);
    setDie(6); setMsg(null); setWinner(null); setShowModal(false);
  };

  const locked = !!winner || (isSolo && turn === 2);

  const panel = (p) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '0.9rem', borderRadius: 16, background: turn === p && !winner ? 'var(--accent-soft)' : 'var(--surface-2)', border: turn === p && !winner ? '2px solid var(--accent)' : '1px solid var(--line)' }}>
      <div style={{ fontWeight: 800 }}>{label(p)}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800 }}>{bank[p]}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 700 }}>+{p === turn ? turnTotal : 0}</div>
    </div>
  );

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><DiceFace value={die} size={20} /></span>{t('pigTitle')}</h1>
          <div className="game-status">
            {!winner ? (
              <span className="status-item current-player">{t('currentPlayer')}: {label(turn)} · {t('pigTarget')}: {TARGET}</span>
            ) : (
              <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {panel(1)}
          <div style={{ alignSelf: 'center' }}><DiceFace value={die} size={64} /></div>
          {panel(2)}
        </div>
        {msg && <div style={{ textAlign: 'center', fontWeight: 800 }}>{msg}</div>}

        {!winner && !locked && (
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={roll}>🎲 {t('pigRoll')}</button>
            <button className="btn btn-secondary" onClick={hold} disabled={turnTotal === 0}>✋ {t('pigHold')} (+{turnTotal})</button>
          </div>
        )}
        {isSolo && turn === 2 && !winner && <div style={{ textAlign: 'center', color: 'var(--muted)' }}>…</div>}

        <div className="game-controls">
          <button className="btn btn-primary" onClick={restart}><RestartIcon size={16} /> {t('restart')}</button>
          <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
        </div>

        {showModal && !hideEndModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-medal solid"><TrophyIcon size={28} /></div>
              <h2>{t('congratulations')}</h2>
              <p>{label(winner)} {t('wins')}（{bank[1]} : {bank[2]}）</p>
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
