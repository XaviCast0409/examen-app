import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';

export default function Home() {
  const { dispatch } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const STARS = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 3,
  }));

  return (
    <div className="page-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Stars */}
      {STARS.map(s => (
        <motion.div
          key={s.id}
          style={{
            position: 'fixed',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: 'var(--neon-green)',
            borderRadius: '50%',
            boxShadow: '0 0 4px var(--neon-green)',
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: s.delay }}
        />
      ))}

      {/* Main content */}
      <div className="content-box" style={{ maxWidth: 560, alignItems: 'center' }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', marginBottom: '0.5rem' }}
            animate={{ rotateY: [0, 10, 0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎮
          </motion.div>

          <h1
            className="title-pixel glitch"
            style={{
              fontSize: 'clamp(1.2rem, 4vw, 2rem)',
              letterSpacing: '0.1em',
              lineHeight: 1.6,
            }}
          >
            MATH
            <br />
            <span style={{ color: 'var(--neon-yellow)' }}>RACE</span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.45rem',
            color: 'rgba(0,255,65,0.6)',
            marginTop: '1rem',
            letterSpacing: '0.15em',
          }}>
            ★ MATEMÁTICAS AL MÁXIMO ★
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', alignItems: 'center' }}
        >
          <motion.button
            className="btn-pixel btn-green pixel-pulse"
            style={{ width: '100%', maxWidth: 320, fontSize: '0.65rem', padding: '1.1rem' }}
            onClick={() => {
              dispatch({ type: 'SET_ROLE', payload: 'teacher' });
              navigate('/teacher');
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            🎓 SOY PROFESOR
          </motion.button>

          <motion.button
            className="btn-pixel btn-yellow"
            style={{ width: '100%', maxWidth: 320, fontSize: '0.65rem', padding: '1.1rem' }}
            onClick={() => {
              dispatch({ type: 'SET_ROLE', payload: 'student' });
              navigate('/join');
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            👾 SOY ALUMNO
          </motion.button>
        </motion.div>

        {/* Marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ width: '100%' }}
        >
          <div className="marquee-wrap">
            <div className="marquee-text">
              🏆 FRACCIONES · ÁLGEBRA · GEOMETRÍA · ESTADÍSTICA · PROBABILIDAD · PROPORCIONES ·
              🏆 FRACCIONES · ÁLGEBRA · GEOMETRÍA · ESTADÍSTICA · PROBABILIDAD · PROPORCIONES ·
            </div>
          </div>
        </motion.div>

        <p style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.4rem',
          color: 'rgba(0,255,65,0.3)',
          textAlign: 'center',
        }}>
          HASTA 20 JUGADORES · TIEMPO REAL · 5TO SECUNDARIA
        </p>
      </div>
    </div>
  );
}
