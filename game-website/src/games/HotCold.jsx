import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtGuess, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const MAXN = 50;

export default function HotCold({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [phase, setPhase] = useState('set'); // set | guess | done
  const [setter, setSetter] = useState(1);
  const guesser = setter === 1 ? 2 : 1;
  const [secret, setSecret] = useState('');
  const [target, setTarget] = useState(null);
  const [input, setInput] = useState('');
  const [tries, setTries] = useState([]);
  const [counts, setCounts] = useState({ 1: 0, 2: 0 });
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const hintFor = (n) => {
    if (tries.length === 0) {
      const d = Math.abs(n - target);
      if (d === 0) return 'hit';
      return d <= 5 ? 'hot' : d <= 12 ? 'warm' : 'cold';
    }
    const prev = Math.abs(tries[tries.length - 1].n - target);
    const cur = Math.abs(n - target);
    if (cur === 0) return 'hit';
    if (cur < prev) return 'hot';
    if (cur > prev) return 'cold';
    return 'same';
  };

  const hintTxt = (h) => h === 'hot' ? `🔥 ${t('hcHot')}` : h === 'warm' ? `🌤 ${t('hcWarm')}` : h === 'cold' ? `❄️ ${t('hcCold')}` : h === 'same' ? t('hcSame') : '🎯';

  const startGuessing = (e) => {
    e?.preventDefault();
    if (isSolo && setter === 2) return;
    const n = parseInt(secret, 10);
    if (!Number.isInteger(n) || n < 1 || n > MAXN) return;
    setTarget(n);
    setSecret('');
    setTries([]);
    setPhase('guess');
  };

  const beginSolo = () => {
    // computer sets secret, player guesses; computer's own count simulated
    const n = 1 + Math.floor(Math.random() * MAXN);
    setTarget(n);
    setTries([]);
    setPhase('guess');
  };

  const doGuess = (e) => {
    e?.preventDefault();
    if (phase !== 'guess' || winner) return;
    const n = parseInt(input, 10);
    if (!Number.isInteger(n) || n < 1 || n > MAXN) return;
    setInput('');
    const h = hintFor(n);
    const nt = [...tries, { n, h }];
    setTries(nt);
    if (h === 'hit') {
      const cnt = nt.length;
      if (isSolo) {
        // computer's simulated count: binary-ish 5-8
        const cpu = 5 + Math.floor(Math.random() * 4);
        const w = cnt < cpu ? 1 : cnt > cpu ? 2 : 'draw';
        setCounts({ 1: cnt, 2: cpu });
        setWinner(w); setShowModal(true);
        setPhase('done');
        if (!rep.current) { rep.current = true; onGameEnd?.(w); }
      } else {
        const nc = { ...counts, [guesser]: cnt };
        setCounts(nc);
        if (setter === 1) {
          // swap roles
          setSetter(2); setTarget(null); setTries([]); setPhase('set');
        } else {
          const w = nc[1] === nc[2] ? 'draw' : nc[1] < nc[2] ? 1 : 2;
          setWinner(w); setShowModal(true);
          setPhase('done');
          if (!rep.current) { rep.current = true; onGameEnd?.(w); }
        }
      }
    }
  };

  const restart = () => {
    rep.current = false;
    setPhase('set'); setSetter(1); setSecret(''); setTarget(null);
    setInput(''); setTries([]); setCounts({ 1: 0, 2: 0 });
    setWinner(null); setShowModal(false);
  };

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtGuess size={20} /></span>{t('hcTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">
              {phase === 'done'
                ? (winner === 'draw' ? t('draw') : `${t('winner')}: ${label(winner)} (${counts[1]} : ${counts[2]})`)
                : phase === 'set'
                  ? (isSolo ? t('hcSoloSet') : `${label(setter)}: ${t('hcSetSecret')} 1–${MAXN}`)
                  : `${label(guesser)} · ${tries.length} ${t('hcTries')}`}
            </span>
          </div>
        </div>

        <div style={{ padding: '1.2rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)', textAlign: 'center' }}>
          {phase === 'set' && (
            isSolo ? (
              <button className="btn btn-primary" onClick={beginSolo}>{t('startGame')}</button>
            ) : (
              <form onSubmit={startGuessing} style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <input
                  type="password" inputMode="numeric"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                  placeholder={`1–${MAXN}`}
                  style={{ padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid var(--line-strong)', fontSize: '1.1rem', width: 110, textAlign: 'center' }}
                />
                <button type="submit" className="btn btn-primary">OK</button>
              </form>
            )
          )}
          {phase === 'guess' && !winner && (
            <>
              <form onSubmit={doGuess} style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <input
                  type="number" min={1} max={MAXN}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`1–${MAXN}`}
                  style={{ padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid var(--line-strong)', fontSize: '1.1rem', width: 110, textAlign: 'center' }}
                />
                <button type="submit" className="btn btn-primary">{t('guessAction')}</button>
              </form>
              {tries.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
                  {[...tries].reverse().map((g, i) => (
                    <span key={i} style={{ padding: '0.3rem 0.7rem', borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--line)', fontWeight: 700, fontSize: '0.85rem' }}>
                      {g.n} {hintTxt(g.h)}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
          {phase === 'done' && (
            <div style={{ fontWeight: 800 }}>{winner === 'draw' ? t('draw') : `${label(winner)} ${t('wins')}`}</div>
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
                <><div className="modal-medal draw"><DrawIcon size={28} /></div><h2>{t('draw')}</h2><p>{counts[1]} : {counts[2]}</p></>
              ) : (
                <><div className="modal-medal solid"><TrophyIcon size={28} /></div><h2>{t('congratulations')}</h2><p>{label(winner)} {t('wins')}（{counts[1]} : {counts[2]}）</p></>
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
