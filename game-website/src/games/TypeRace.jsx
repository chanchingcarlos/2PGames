import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtGuess, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const PHRASES = [
  'hello world', 'react is fun', 'coding is cool', '香蕉牛奶很好喝',
  '今晚食咩好', '我愛打機', 'game on', '快手有快手冇', 'ABCDE',
];
const ROUNDS = 3;

export default function TypeRace({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [round, setRound] = useState(0);
  const [phrase, setPhrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  const [inputs, setInputs] = useState({ 1: '', 2: '' });
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [flash, setFlash] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);

  const done = round >= ROUNDS;

  const finish = (s) => {
    const w = s[1] === s[2] ? 'draw' : s[1] > s[2] ? 1 : 2;
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const winRound = (p) => {
    if (flash || winner || done) return;
    const ns = { ...scores, [p]: scores[p] + 1 };
    setScores(ns);
    setFlash(p);
    const nr = round + 1;
    setTimeout(() => {
      if (nr >= ROUNDS) { setRound(nr); finish(ns); }
      else {
        setRound(nr);
        setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
        setInputs({ 1: '', 2: '' });
        setFlash(null);
      }
    }, 1000);
  };

  const type = (p, v) => {
    if (flash || winner || done) return;
    if (isSolo && p === 2) return;
    setInputs((s) => ({ ...s, [p]: v }));
    if (v === phrase) winRound(p);
  };

  // Solo: computer finishes after delay
  useEffect(() => {
    if (!isSolo || flash || winner || done) return;
    const id = setTimeout(() => winRound(2), phrase.length * 380 + 1200 + Math.random() * 2500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, phrase, isSolo, flash]);

  const restart = () => {
    rep.current = false;
    setRound(0);
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    setInputs({ 1: '', 2: '' }); setScores({ 1: 0, 2: 0 });
    setFlash(null); setWinner(null); setShowModal(false);
  };

  const box = (p) => {
    const v = inputs[p];
    const ok = phrase.startsWith(v);
    return (
      <div style={{ flex: 1, padding: '0.8rem', borderRadius: 14, background: flash === p ? 'var(--accent-soft)' : 'var(--surface-2)', border: `2px solid ${flash === p ? 'var(--accent)' : ok ? 'var(--line)' : '#dc2626'}` }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{label(p)} · {scores[p]}</div>
        <input
          value={v}
          onChange={(e) => type(p, e.target.value)}
          disabled={!!flash || !!winner || (isSolo && p === 2)}
          autoCapitalize="off"
          autoCorrect="off"
          style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 10, border: '1.5px solid var(--line-strong)', fontSize: '1rem', fontFamily: 'inherit' }}
        />
      </div>
    );
  };

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtGuess size={20} /></span>{t('tyTitle')}</h1>
          <div className="game-status">
            <span className="status-item current-player">{t('round')} {Math.min(round + 1, ROUNDS)}/{ROUNDS} · {scores[1]} : {scores[2]}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.2rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{phrase}</div>
          {flash && <div style={{ marginTop: 6, fontWeight: 800 }}>{label(flash)} +1</div>}
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {box(1)}
          {isSolo ? (
            <div style={{ flex: 1, padding: '0.8rem', borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{label(2)} · {scores[2]}</div>
              <div style={{ color: 'var(--muted)' }}>… ⌨️</div>
            </div>
          ) : box(2)}
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
