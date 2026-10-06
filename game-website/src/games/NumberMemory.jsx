import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtMemory, PlayIcon, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const ROUNDS = 6;
const randDigits = (len) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');

export default function NumberMemory({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [round, setRound] = useState(0);
  const [num, setNum] = useState(() => randDigits(3));
  const [phase, setPhase] = useState('idle'); // idle | memo | recall
  const [left, setLeft] = useState(0);
  const [input, setInput] = useState('');
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [msg, setMsg] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);
  const timer = useRef(null);

  const challenger = round % 2 === 0 ? 1 : 2;
  const len = 3 + Math.floor(round / 2);
  const done = round >= ROUNDS;

  useEffect(() => () => clearInterval(timer.current), []);

  const finish = (s) => {
    const w = s[1] === s[2] ? 'draw' : s[1] > s[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const begin = () => {
    clearInterval(timer.current);
    const n = randDigits(len);
    setNum(n);
    setInput('');
    setMsg(null);
    setPhase('memo');
    const secs = Math.max(2, Math.round(len * 0.9));
    setLeft(secs);
    timer.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(timer.current);
          setPhase('recall');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const submit = (e) => {
    e?.preventDefault();
    if (phase !== 'recall' || winner || done) return;
    if (isSolo && challenger === 2) return;
    const ok = input.trim() === num;
    const ns = { ...scores, [challenger]: scores[challenger] + (ok ? 1 : 0) };
    setScores(ns);
    setMsg(ok ? `${label(challenger)} +1` : `${t('nmAns')}: ${num}`);
    const nr = round + 1;
    if (nr >= ROUNDS) {
      setRound(nr);
      setTimeout(() => finish(ns), 1100);
    } else {
      setTimeout(() => { setRound(nr); setPhase('idle'); setMsg(null); setInput(''); }, 1100);
    }
  };

  // Solo: computer recalls
  useEffect(() => {
    if (!isSolo || challenger !== 2 || phase !== 'recall' || winner || done || msg) return;
    const id = setTimeout(() => {
      const p = Math.max(0.35, 0.85 - num.length * 0.06);
      const ok = Math.random() < p;
      const ns = { ...scores, 2: scores[2] + (ok ? 1 : 0) };
      setScores(ns);
      setMsg(ok ? `${label(2)} +1` : `${t('nmAns')}: ${num}`);
      const nr = round + 1;
      if (nr >= ROUNDS) { setRound(nr); setTimeout(() => finish(ns), 1100); }
      else setTimeout(() => { setRound(nr); setPhase('idle'); setMsg(null); }, 1100);
    }, 1400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, isSolo]);

  const restart = () => {
    clearInterval(timer.current);
    rep.current = false;
    setRound(0); setNum(randDigits(3)); setPhase('idle');
    setInput(''); setScores({ 1: 0, 2: 0 }); setMsg(null);
    setWinner(null); setShowModal(false);
  };

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtMemory size={20} /></span>{t('nmTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">{t('round')} {Math.min(round + 1, ROUNDS)}/{ROUNDS} · {scores[1]} : {scores[2]}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.4rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          {phase === 'idle' && !winner && (
            <>
              <p style={{ color: 'var(--muted)', fontWeight: 600 }}>{label(challenger)} · {len} {t('nmDigits')}</p>
              <button className="btn btn-primary" onClick={begin}><PlayIcon size={15} /> {t('nmShow')}</button>
            </>
          )}
          {phase === 'memo' && (
            <>
              <div style={{ fontSize: '2.6rem', fontWeight: 800, letterSpacing: '0.2em' }}>{num}</div>
              <div style={{ color: 'var(--muted)', fontWeight: 700 }}>{left}s</div>
            </>
          )}
          {phase === 'recall' && !winner && (
            <form onSubmit={submit} style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder={'?'.repeat(len)}
                inputMode="numeric"
                disabled={isSolo && challenger === 2}
                style={{ padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid var(--line-strong)', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.2em', width: 160, textAlign: 'center' }}
              />
              <button type="submit" className="btn btn-primary" disabled={isSolo && challenger === 2}>OK</button>
            </form>
          )}
          {msg && <div style={{ marginTop: 8, fontWeight: 800 }}>{msg}</div>}
          {winner && <div style={{ fontWeight: 800 }}>{winner === 'draw' ? t('draw') : `${label(winner)} ${t('wins')}`}</div>}
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
