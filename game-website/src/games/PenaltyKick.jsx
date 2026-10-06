import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtPong, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const KICKS = 5;
const DIRS = ['L', 'C', 'R'];

export default function PenaltyKick({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [kick, setKick] = useState(0); // 0..9 (even = P1 shoots, odd = P2 shoots)
  const [shot, setShot] = useState(null);
  const [goals, setGoals] = useState({ 1: 0, 2: 0 });
  const [msg, setMsg] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const done = kick >= KICKS * 2;
  const shooter = kick % 2 === 0 ? 1 : 2;
  const keeper = shooter === 1 ? 2 : 1;

  const finish = (g) => {
    const w = g[1] === g[2] ? 'draw' : g[1] > g[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const choose = (d) => {
    if (winner || done) return;
    if (shot === null) {
      // shooter picks (hidden)
      if (isSolo) {
        if (shooter === 1) {
          setShot(d);
          setTimeout(() => {
            const k = DIRS[Math.floor(Math.random() * 3)];
            resolve(d, k);
          }, 700);
        }
      } else {
        setShot(d);
      }
    } else {
      resolve(shot, d);
    }
  };

  // Solo: computer shoots when it's the shooter
  useEffect(() => {
    if (!isSolo || shooter !== 2 || shot !== null || winner || done) return;
    const id = setTimeout(() => {
      setShot(DIRS[Math.floor(Math.random() * 3)]);
    }, 700);
    return () => clearTimeout(id);
  }, [isSolo, shooter, shot, winner, done, kick]);

  const resolve = (s, k) => {
    const scored = s !== k;
    const ng = { ...goals, [shooter]: goals[shooter] + (scored ? 1 : 0) };
    setGoals(ng);
    setMsg(scored ? `⚽ ${label(shooter)} +1 (${s}→${k})` : `🧤 ${label(keeper)} (${k})`);
    const nk = kick + 1;
    setTimeout(() => {
      setKick(nk); setShot(null); setMsg(null);
      if (nk >= KICKS * 2) finish(ng);
    }, 1100);
  };

  const restart = () => {
    rep.current = false;
    setKick(0); setShot(null); setGoals({ 1: 0, 2: 0 });
    setMsg(null); setWinner(null); setShowModal(false);
  };

  const myTurn = (p) => {
    if (shot === null) return shooter === p;
    return keeper === p;
  };
  const canClick = (p) => !winner && !done && !msg && myTurn(p) && !(isSolo && p === 2);

  const btns = (p) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '0.7rem', borderRadius: 14, background: canClick(p) ? 'var(--accent-soft)' : 'var(--surface-2)', border: '1px solid var(--line)' }}>
      <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 6 }}>
        {label(p)} · {goals[p]} {shot === null ? (shooter === p ? `⚽` : `🧤`) : (keeper === p ? `🧤` : `⚽`)}
      </div>
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
        {DIRS.map((d) => (
          <button key={d} className="btn btn-primary" style={{ padding: '0.45rem 0.7rem', minWidth: 0 }} disabled={!canClick(p)} onClick={() => choose(d)}>
            {d === 'L' ? '◀' : d === 'R' ? '▶' : '●'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtPong size={20} /></span>{t('peTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">{goals[1]} : {goals[2]} · {Math.min(kick + 1, KICKS * 2)}/{KICKS * 2}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.2rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '3rem' }}>🥅</div>
          <div style={{ fontWeight: 700, color: 'var(--muted)' }}>
            {done ? '' : shot === null ? `${label(shooter)} ⚽ → ?` : `${label(keeper)} 🧤 → ?`}
          </div>
          {msg && <div style={{ marginTop: 6, fontWeight: 800 }}>{msg}</div>}
        </div>

        <div style={{ display: 'flex', gap: '0.7rem' }}>
          {btns(1)}
          {btns(2)}
        </div>

        <div className="game-controls">
          <button className="btn btn-primary" onClick={restart}><RestartIcon size={16} /> {t('restart')}</button>
          <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
        </div>

        {showModal && !hideEndModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {winner === 'draw' ? (
                <><div className="modal-medal draw"><DrawIcon size={28} /></div><h2>{t('draw')}</h2><p>{goals[1]} : {goals[2]}</p></>
              ) : (
                <><div className="modal-medal solid"><TrophyIcon size={28} /></div><h2>{t('congratulations')}</h2><p>{label(winner)} {t('wins')}（{goals[1]} : {goals[2]}）</p></>
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
