import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ArtSos, TrophyIcon, DrawIcon, RestartIcon, HomeIcon } from '../components/icons';

const WORDS = ['apple', 'brave', 'crane', 'dance', 'eagle', 'flame', 'grape', 'house', 'ivory', 'joker', 'knife', 'lemon', 'mango', 'night', 'ocean', 'piano', 'queen', 'river', 'snake', 'tiger', 'uncle', 'vivid', 'water', 'youth', 'zebra', 'bread', 'cloud', 'dream', 'earth', 'fruit'];
const MAX_TRIES = 12;

const scoreGuess = (secret, g) => {
  const res = Array(5).fill('miss');
  const counts = {};
  for (let i = 0; i < 5; i++) {
    if (g[i] === secret[i]) res[i] = 'hit';
    else counts[secret[i]] = (counts[secret[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'hit') continue;
    if (counts[g[i]] > 0) { res[i] = 'near'; counts[g[i]]--; }
  }
  return res;
};

export default function WordleDuel({ onBack, mode = '2p', names = null, hideEndModal = false, onGameEnd = null }) {
  const { t } = useLanguage();
  const isSolo = mode === 'solo';
  const soloTries = 6;
  const label = (p) => (names && names[p - 1]) || t(isSolo ? (p === 1 ? 'you' : 'computer') : (p === 1 ? 'player1' : 'player2'));
  const [secret, setSecret] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [tries, setTries] = useState([]);
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rep = useRef(false);
  const inputRef = useRef(null);

  const limit = isSolo ? soloTries : MAX_TRIES;
  const turn = tries.length % 2 === 0 ? 1 : 2;

  const endWith = (w) => {
    setWinner(w); setShowModal(true);
    if (!rep.current) { rep.current = true; onGameEnd?.(w); }
  };

  const submit = (e) => {
    e?.preventDefault();
    if (winner) return;
    const g = input.trim().toLowerCase();
    if (!/^[a-z]{5}$/.test(g)) { setErr('A–Z × 5'); return; }
    setErr('');
    setInput('');
    const fb = scoreGuess(secret, g);
    const nt = [...tries, { p: isSolo ? 1 : turn, g, fb }];
    setTries(nt);
    if (g === secret) {
      endWith(isSolo ? 1 : turn);
    } else if (nt.length >= limit) {
      endWith(isSolo ? 2 : 'draw');
    }
  };

  const restart = () => {
    rep.current = false;
    setSecret(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setTries([]); setInput(''); setErr('');
    setWinner(null); setShowModal(false);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
  };

  const cellBg = (s) => s === 'hit' ? '#16a34a' : s === 'near' ? '#ca8a04' : 'var(--surface-2)';

  // On-screen keyboard: best status per letter across all guesses (hit > near > miss)
  const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const keyRank = {};
  tries.forEach((row) => {
    row.g.split('').forEach((ch, i) => {
      const r = row.fb[i] === 'hit' ? 3 : row.fb[i] === 'near' ? 2 : 1;
      if ((keyRank[ch] || 0) < r) keyRank[ch] = r;
    });
  });
  const keyStyle = (ch) => {
    const r = keyRank[ch] || 0;
    return {
      background: r === 3 ? '#16a34a' : r === 2 ? '#ca8a04' : r === 1 ? '#6b7280' : 'var(--surface-2)',
      color: r === 0 ? 'var(--text)' : '#fff',
    };
  };
  const pressKey = (ch) => {
    if (winner) return;
    setErr('');
    setInput((v) => (v + ch).replace(/[^a-z]/g, '').slice(0, 5));
  };

  return (
    <Layout showBack onBack={onBack}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title"><span className="title-mark"><ArtSos size={20} /></span>{t('wdTitle')}</h1>
          <div className="game-status">
            {!winner ? (
              <span className="status-item current-player">{isSolo ? label(1) : `${label(turn)}`} · {tries.length}/{limit}</span>
            ) : winner === 'draw' ? (
              <span className="winner-badge draw"><DrawIcon size={16} /> {t('draw')}</span>
            ) : (
              <span className="winner-badge"><TrophyIcon size={16} /> {t('winner')}: {label(winner)}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', padding: '1rem', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          {tries.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <span style={{ width: 70, fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textAlign: 'right' }}>{label(row.p)}</span>
              {row.g.split('').map((ch, i) => (
                <span key={i} style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 8, background: cellBg(row.fb[i]), color: row.fb[i] === 'miss' ? 'var(--text)' : '#fff', fontWeight: 800, textTransform: 'uppercase' }}>{ch}</span>
              ))}
            </div>
          ))}
          {tries.length === 0 && <div style={{ color: 'var(--muted)', fontWeight: 600 }}>_ _ _ _ _</div>}
        </div>

        {!winner && (
          <>
            <form onSubmit={submit} style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <input
                ref={inputRef}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 5))}
                placeholder="abcde"
                maxLength={5}
                style={{ padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid var(--line-strong)', fontSize: '1.1rem', fontWeight: 700, width: 140, textAlign: 'center', textTransform: 'lowercase' }}
              />
              <button type="submit" className="btn btn-primary">OK</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }} aria-label="keyboard">
              {KB_ROWS.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                  {ri === 2 && (
                    <button
                      type="button"
                      onClick={() => setInput((v) => v.slice(0, -1))}
                      style={{ minWidth: 44, height: 46, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer' }}
                      aria-label="backspace"
                    >⌫</button>
                  )}
                  {row.split('').map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => pressKey(ch)}
                      style={{ minWidth: 0, width: 32, height: 46, borderRadius: 8, border: '1px solid var(--line)', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', cursor: 'pointer', ...keyStyle(ch) }}
                    >{ch}</button>
                  ))}
                  {ri === 2 && (
                    <button
                      type="button"
                      onClick={() => submit()}
                      style={{ minWidth: 44, height: 46, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--accent)', color: '#fff', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer' }}
                      aria-label="enter"
                    >⏎</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {err && <p style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{err}</p>}
        {winner && <p style={{ textAlign: 'center', fontWeight: 800 }}>{t('hangmanAnswer')}: {secret.toUpperCase()}</p>}

        <div className="game-controls">
          <button className="btn btn-primary" onClick={restart}><RestartIcon size={16} /> {t('restart')}</button>
          <button className="btn btn-secondary" onClick={onBack}><HomeIcon size={16} /> {t('backToMenu')}</button>
        </div>

        {showModal && !hideEndModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {winner === 'draw' ? (
                <><div className="modal-medal draw"><DrawIcon size={28} /></div><h2>{t('draw')}</h2><p>{secret.toUpperCase()}</p></>
              ) : (
                <><div className="modal-medal solid"><TrophyIcon size={28} /></div><h2>{t('congratulations')}</h2><p>{label(winner)} {t('wins')} · {secret.toUpperCase()}</p></>
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
