import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtMath, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const ROUNDS = 5;

export default function OddEven({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [first, setFirst] = useState(null); // first hider's pick
  const [firstBy, setFirstBy] = useState(1);
  const [reveal, setReveal] = useState(null); // {a,b}
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const done = round >= ROUNDS;
  const hider = round % 2 === 0 ? 1 : 2; // who picks first (hidden)

  const finish = (s) => {
    const w = s[1] === s[2] ? 'draw' : s[1] > s[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const pick = (n) => {
    if (done || winner) return;
    if (first === null) {
      if (isSolo && hider === 2) return;
      setFirst(n); setFirstBy(hider);
      if (isSolo && hider === 1) {
        // computer picks second right away
        setTimeout(() => {
          const b = 1 + Math.floor(Math.random() * 5);
          resolve(n, b);
        }, 700);
      }
    } else {
      resolve(first, n);
    }
  };

  const resolve = (a, b) => {
    const odd = (a + b) % 2 === 1;
    const rw = odd ? 1 : 2;
    const ns = { ...scores, [rw]: scores[rw] + 1 };
    setScores(ns);
    setReveal({ a, b });
    const nr = round + 1;
    if (nr >= ROUNDS) {
      setTimeout(() => { setRound(nr); finish(ns); }, 1200);
    } else {
      setTimeout(() => { setRound(nr); setFirst(null); setReveal(null); }, 1200);
    }
  };

  // Solo: computer picks first when it's hider
  useEffect(() => {
    if (!isSolo || hider !== 2 || first !== null || done || winner || reveal) return;
    const id = setTimeout(() => {
      setFirst(1 + Math.floor(Math.random() * 5));
      setFirstBy(2);
    }, 800);
    return () => clearTimeout(id);
  }, [round, isSolo, hider, first, done, winner, reveal]);

  const restart = () => {
    rep.current = false;
    setRound(0); setScores({ 1: 0, 2: 0 });
    setFirst(null); setReveal(null); setWinner(null); setShowModal(false);
  };

  const canAct = !done && !winner && !reveal && !(isSolo && (first === null ? hider === 2 : hider === 1 && firstBy === 1));
  const waitingHidden = first !== null && !reveal;

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtMath size={20} /></span>{t('oeTitle')}</h1>
          <div className="game-status">
            {!winner ? (
              <span className="status-item current-player">{t('round')} {Math.min(round + 1, ROUNDS)}/{ROUNDS} · {scores[1]} : {scores[2]}</span>
            ) : winner === 'draw' ? (
              <span className="winner-badge draw"><DrawIcon size={16} /> {t('draw')}</span>
            ) : (
              <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.4rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ color: 'var(--muted)', fontWeight: 700 }}>{label(1)} = {t('oeOdd')} · {label(2)} = {t('oeEven')}</div>
          <div style={{ fontSize: '2.6rem', fontWeight: 800, margin: '0.6rem 0' }}>
            {reveal ? `${reveal.a} + ${reveal.b} = ${reveal.a + reveal.b} ${(reveal.a + reveal.b) % 2 ? t('oeOdd') : t('oeEven')}` : waitingHidden ? '✓ · ?' : '? + ?'}
          </div>
          {!done && canAct && (
            <>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{label(first === null ? hider : (hider === 1 ? 2 : 1))} ✊</div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className="btn btn-primary" style={{ minWidth: 0, padding: '0.6rem 0.9rem' }} onClick={() => pick(n)}>{n}</button>
                ))}
              </div>
            </>
          )}
          {isSolo && !canAct && !done && <div style={{ color: 'var(--muted)' }}>…</div>}
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
