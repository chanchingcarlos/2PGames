import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtMath, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';
import './MathDuel.css';

const ROUNDS = 5;

function newQ() {
  const op = ['+', '−', '×'][Math.floor(Math.random() * 3)];
  let a, b, ans;
  if (op === '+') { a = 5 + Math.floor(Math.random() * 25); b = 5 + Math.floor(Math.random() * 25); ans = a + b; }
  else if (op === '−') { a = 10 + Math.floor(Math.random() * 30); b = 2 + Math.floor(Math.random() * a - 1); ans = a - b; }
  else { a = 2 + Math.floor(Math.random() * 8); b = 2 + Math.floor(Math.random() * 8); ans = a * b; }
  return { a, b, op, ans };
}

export default function MathDuel({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));

  const [q, setQ] = useState(newQ);
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [inputs, setInputs] = useState({ 1: '', 2: '' });
  const [flash, setFlash] = useState(null); // round winner just scored
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const reported = useRef(false);
  // 2P time-trial: players answer in turn against the clock
  const [qs, setQs] = useState({ 1: newQ(), 2: newQ() });
  const [active, setActive] = useState(1);
  const [times, setTimes] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const t0Ref = useRef(Date.now());
  const inputRefs = useRef({});

  // Keep the active player's input focused so they can type immediately
  useEffect(() => {
    if (!winner && !flash) inputRefs.current[isSolo ? 1 : active]?.focus({ preventScroll: true });
  }, [round, active, isSolo, winner, flash]);

  const end = (s) => {
    const w = s[1] === s[2] ? 'draw' : s[1] > s[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!reported.current) { reported.current = true; onGameEnd?.(w); }
  };

  const nextRound = (s) => {
    if (round >= ROUNDS) { end(s); return; }
    setRound(round + 1); setQ(newQ()); setQs({ 1: newQ(), 2: newQ() });
    setActive(1); setTimes({}); setElapsed(0);
    t0Ref.current = Date.now();
    setInputs({ 1: '', 2: '' }); setFlash(null);
  };

  const scoreRound = (p) => {
    const ns = p === 'draw' ? { ...scores } : { ...scores, [p]: scores[p] + 1 };
    setScores(ns); setFlash(p);
    setTimeout(() => nextRound(ns), 900);
  };

  const answer = (p, raw) => {
    if (winner || flash) return;
    const n = parseInt(raw, 10);
    if (!Number.isInteger(n)) return;
    if (isSolo) {
      if (n === q.ans) scoreRound(p);
      else setInputs((v) => ({ ...v, [p]: '' }));
      return;
    }
    if (p !== active) return;
    if (n !== qs[p].ans) {
      setInputs((v) => ({ ...v, [p]: '' }));
      return;
    }
    const ms = Date.now() - t0Ref.current;
    if (active === 1) {
      setTimes({ 1: ms });
      setActive(2);
      setElapsed(0);
      t0Ref.current = Date.now();
    } else {
      const t1 = times[1];
      if (ms < t1) scoreRound(2);
      else if (ms > t1) scoreRound(1);
      else scoreRound('draw');
    }
  };

  // 2P live timer
  useEffect(() => {
    if (isSolo || winner || flash) return;
    const id = setInterval(() => setElapsed(Date.now() - t0Ref.current), 100);
    return () => clearInterval(id);
  }, [isSolo, winner, flash, round, active]);

  // Solo: computer answers after a delay
  useEffect(() => {
    if (!isSolo || winner || flash) return;
    const id = setTimeout(() => scoreRound(2), 4000 + Math.random() * 5000);
    return () => clearTimeout(id);
  });

  const submit = (p) => (e) => {
    e.preventDefault();
    if (isSolo && p === 2) return;
    if (!isSolo && p !== active) return;
    answer(p, inputs[p]);
  };

  const restart = () => {
    setQ(newQ()); setRound(1); setScores({ 1: 0, 2: 0 });
    setQs({ 1: newQ(), 2: newQ() }); setActive(1); setTimes({});
    setElapsed(0); t0Ref.current = Date.now();
    setInputs({ 1: '', 2: '' }); setFlash(null);
    setWinner(null); setShowModal(false); reported.current = false;
  };

  const box = (p) => {
    const dis = !!winner || !!flash || (isSolo ? p === 2 : p !== active);
    const timeTxt = isSolo ? '' : times[p] != null
      ? ` · ${(times[p] / 1000).toFixed(1)}s`
      : p === active ? ` · ${(elapsed / 1000).toFixed(1)}s` : '';
    return (
      <form className={`md-box ${flash === p ? 'win' : ''}`} onSubmit={submit(p)} key={p}>
        <span className="md-name">{label(p)} · {scores[p]}{timeTxt}</span>
        <input
          ref={(el) => { inputRefs.current[p] = el; }}
          value={inputs[p]}
          onChange={(e) => setInputs((v) => ({ ...v, [p]: e.target.value.replace(/[^0-9-]/g, '') }))}
          placeholder="?"
          inputMode="numeric"
          disabled={dis}
          aria-label={label(p)}
        />
        <button type="submit" className="btn btn-primary" disabled={dis}>OK</button>
      </form>
    );
  };

  const showQ = isSolo ? q : qs[active];

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtMath size={20} /></span>{t('mathTitle')}</h1>
          <div className="game-status">
            {!winner ? (
              <span className="status-item current-player">{t('round')} {round}/{ROUNDS} · {scores[1]} : {scores[2]}</span>
            ) : winner === 'draw' ? (
              <span className="winner-badge draw"><DrawIcon size={16} /> {t('draw')}</span>
            ) : (
              <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            )}
          </div>
        </div>

        <div className="md-q">{showQ.a} {showQ.op} {showQ.b} = ?</div>
        {flash && <p className="md-flash">{flash === 'draw' ? t('draw') : `${label(flash)} ✓`}</p>}

        <div className="md-duel">
          {box(1)}
          {!isSolo && box(2)}
          {isSolo && (
            <div className={`md-box ${flash === 2 ? 'win' : ''}`}>
              <span className="md-name">{label(2)} · {scores[2]}</span>
              <span className="md-thinking">…</span>
            </div>
          )}
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
                <button className="btn btn-primary" onClick={restart}><RestartIcon size={16} /> {t('restart')}</button>
                <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
