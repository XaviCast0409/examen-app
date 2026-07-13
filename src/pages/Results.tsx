import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';

const PODIUM_HEIGHTS = [160, 110, 80];
const FIREWORKS = ['🎆', '🎇', '✨', '🎉', '🎊', '⭐', '🌟', '💫'];

export default function Results() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  const top3 = state.players.slice(0, 3);
  const rest = state.players.slice(3);

  // Fireworks
  const fws = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60,
    emoji: FIREWORKS[Math.floor(Math.random() * FIREWORKS.length)],
    delay: Math.random() * 2,
    duration: 1.5 + Math.random(),
  }));

  return (
    <div className="page-container" style={{ gap: '1.5rem', overflow: 'hidden' }}>
      {/* Fireworks */}
      {fws.map(f => (
        <motion.div
          key={f.id}
          style={{
            position: 'fixed',
            left: `${f.x}%`,
            top: `${f.y}%`,
            fontSize: '1.5rem',
            pointerEvents: 'none',
            zIndex: 0,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], y: [0, -30, -60] }}
          transition={{ duration: f.duration, repeat: Infinity, delay: f.delay }}
        >
          {f.emoji}
        </motion.div>
      ))}

      <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 1 }}>
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            style={{ fontSize: '4rem' }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
          >
            🏆
          </motion.div>
          <h1 className="title-pixel yellow glitch" style={{ fontSize: 'clamp(1rem, 4vw, 1.8rem)', marginTop: '0.5rem' }}>
            ¡FIN DE LA CARRERA!
          </h1>
        </motion.div>

        {/* Podium */}
        {top3.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="podium-wrap">
              {/* 2nd place */}
              {top3[1] && (
                <div className="podium-block">
                  <motion.div
                    style={{ fontSize: '2rem' }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    🥈
                  </motion.div>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: top3[1].color, textAlign: 'center' }}>
                    {top3[1].name.slice(0, 10)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: 'var(--neon-yellow)' }}>
                    {top3[1].score}⭐
                  </span>
                  <div
                    className="podium-stand"
                    style={{ height: PODIUM_HEIGHTS[1], borderColor: '#aaa', background: 'linear-gradient(180deg, rgba(170,170,170,0.3), rgba(170,170,170,0.1))' }}
                  >
                    <span style={{ fontFamily: 'var(--font-pixel)', color: '#aaa' }}>2</span>
                  </div>
                </div>
              )}

              {/* 1st place */}
              {top3[0] && (
                <div className="podium-block">
                  <motion.div
                    style={{ fontSize: '3rem' }}
                    animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    👑
                  </motion.div>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: top3[0].color, textAlign: 'center' }}>
                    {top3[0].name.slice(0, 10)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: 'var(--neon-yellow)' }}>
                    {top3[0].score}⭐
                  </span>
                  <div
                    className="podium-stand"
                    style={{ height: PODIUM_HEIGHTS[0], borderColor: 'var(--neon-yellow)', background: 'linear-gradient(180deg, rgba(255,224,0,0.3), rgba(255,224,0,0.1))' }}
                  >
                    <span style={{ fontFamily: 'var(--font-pixel)', color: 'var(--neon-yellow)', fontSize: '1.2rem' }}>1</span>
                  </div>
                </div>
              )}

              {/* 3rd place */}
              {top3[2] && (
                <div className="podium-block">
                  <motion.div
                    style={{ fontSize: '2rem' }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                  >
                    🥉
                  </motion.div>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: top3[2].color, textAlign: 'center' }}>
                    {top3[2].name.slice(0, 10)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: 'var(--neon-yellow)' }}>
                    {top3[2].score}⭐
                  </span>
                  <div
                    className="podium-stand"
                    style={{ height: PODIUM_HEIGHTS[2], borderColor: '#cd7f32', background: 'linear-gradient(180deg, rgba(205,127,50,0.3), rgba(205,127,50,0.1))' }}
                  >
                    <span style={{ fontFamily: 'var(--font-pixel)', color: '#cd7f32' }}>3</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Rest of players */}
        {rest.length > 0 && (
          <div className="pixel-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {rest.map((p, i) => (
              <div key={p.id} className="scoreboard-row">
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', width: 30 }}>#{i + 4}</span>
                <div style={{ width: 10, height: 10, background: p.color, boxShadow: `0 0 4px ${p.color}`, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: 'var(--font-pixel)', fontSize: '0.45rem', color: p.color }}>{p.name}</span>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.45rem', color: 'var(--neon-yellow)' }}>{p.score}⭐</span>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', color: 'rgba(0,255,65,0.5)' }}>
                  {p.correctCount}/{p.answeredCount}✓
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-pixel btn-green"
            style={{ fontSize: '0.6rem' }}
            onClick={() => {
              dispatch({ type: 'RESET' });
              navigate('/');
            }}
          >
            🏠 INICIO
          </button>
          <button
            className="btn-pixel btn-yellow"
            style={{ fontSize: '0.6rem' }}
            onClick={() => {
              dispatch({ type: 'RESET' });
              navigate('/teacher');
            }}
          >
            🔄 NUEVA PARTIDA
          </button>
        </div>
      </div>
    </div>
  );
}
