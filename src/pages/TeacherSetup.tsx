import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';
import type { Player, Question } from '../types/game';

export default function TeacherSetup() {
  const { state, dispatch } = useGame();
  const { emit, on } = useSocket();
  const navigate = useNavigate();

  const [teacherName, setTeacherName] = useState('');
  const [step, setStep] = useState<'name' | 'lobby'>('name');
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubCreated = on('room-created', (data: unknown) => {
      const d = data as { code: string; teacherName: string };
      dispatch({ type: 'SET_ROOM_CODE', payload: d.code });
      setStep('lobby');
    });

    const unsubJoined = on('player-joined', (data: unknown) => {
      const d = data as { players: Player[] };
      setPlayers(d.players);
      dispatch({ type: 'SET_PLAYERS', payload: d.players });
    });

    const unsubLeft = on('player-left', (data: unknown) => {
      const d = data as { players: Player[] };
      setPlayers(d.players);
      dispatch({ type: 'SET_PLAYERS', payload: d.players });
    });

    // If game started (from here), navigate to race view
    const unsubStarted = on('game-started', (data: unknown) => {
      const d = data as { question: Question; questionIndex: number; totalQuestions: number; timeSeconds: number };
      dispatch({ type: 'GAME_STARTED', payload: { question: d.question, questionIndex: d.questionIndex, totalQuestions: d.totalQuestions, timeSeconds: d.timeSeconds } });
      navigate('/race');
    });

    return () => {
      unsubCreated();
      unsubJoined();
      unsubLeft();
      unsubStarted();
    };
  }, [on, dispatch, navigate]);

  const handleCreateRoom = () => {
    if (!teacherName.trim()) return;
    emit('create-room', { teacherName: teacherName.trim() });
  };

  const handleStartGame = () => {
    if (players.length === 0) return;
    emit('start-game', { roomCode: state.roomCode });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(state.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <div className="content-box" style={{ maxWidth: 520 }}>
        {/* Back */}
        <button
          className="btn-pixel btn-red"
          style={{ alignSelf: 'flex-start', fontSize: '0.5rem', padding: '0.5rem 0.9rem' }}
          onClick={() => navigate('/')}
        >
          ← VOLVER
        </button>

        <motion.h1
          className="title-pixel"
          style={{ fontSize: '0.9rem', textAlign: 'center' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🎓 PANEL PROFESOR
        </motion.h1>

        {step === 'name' ? (
          <motion.div
            className="pixel-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <p className="text-pixel" style={{ fontSize: '0.55rem', marginBottom: '0.5rem' }}>
              ¿CÓMO TE LLAMAS?
            </p>
            <input
              className="input-pixel"
              type="text"
              placeholder="Ej: PROF. GARCIA"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
              maxLength={20}
              autoFocus
            />
            <button
              className="btn-pixel btn-green"
              style={{ width: '100%', fontSize: '0.6rem' }}
              onClick={handleCreateRoom}
              disabled={!teacherName.trim()}
            >
              ▶ CREAR SALA
            </button>
          </motion.div>
        ) : (
          <>
            {/* Room Code */}
            <motion.div
              className="pixel-card yellow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center' }}
            >
              <p className="text-pixel text-yellow" style={{ fontSize: '0.5rem', marginBottom: '0.5rem' }}>
                CÓDIGO DE SALA
              </p>
              <motion.p
                className="title-pixel yellow"
                style={{ fontSize: 'clamp(1.2rem, 5vw, 2rem)', letterSpacing: '0.15em' }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {state.roomCode}
              </motion.p>
              <p style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.4rem',
                color: 'rgba(255,224,0,0.5)',
                marginTop: '0.5rem',
              }}>
                Los alumnos entran con este código
              </p>
              <button
                className="btn-pixel btn-yellow"
                style={{ marginTop: '0.75rem', fontSize: '0.5rem', padding: '0.5rem 1rem' }}
                onClick={handleCopy}
              >
                {copied ? '✓ COPIADO!' : '📋 COPIAR'}
              </button>
            </motion.div>

            {/* Players List */}
            <div className="pixel-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="text-pixel" style={{ fontSize: '0.5rem' }}>
                  👾 JUGADORES CONECTADOS
                </p>
                <span className="badge-pixel text-green" style={{ fontSize: '0.45rem' }}>
                  {players.length}/20
                </span>
              </div>

              {players.length === 0 ? (
                <p style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '0.45rem',
                  color: 'rgba(0,255,65,0.3)',
                  textAlign: 'center',
                  padding: '1rem',
                }}>
                  <span className="blink">█</span> ESPERANDO JUGADORES...
                </p>
              ) : (
                <div className="avatar-grid">
                  {players.map((p, i) => (
                    <motion.div
                      key={p.id}
                      className="avatar-card"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ borderColor: p.color }}
                    >
                      <div style={{
                        fontSize: '1.5rem',
                        filter: `drop-shadow(0 0 6px ${p.color})`,
                      }}>
                        {['🏎️', '🚗', '🚕', '🚙', '⚡', '🔥', '💨', '🌟', '🎮', '👾', '🚀', '💎', '⭐', '🎯', '🏆', '💥', '🎸', '🦊', '🐉', '🌈'][i % 20]}
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '0.4rem',
                        color: p.color,
                        textShadow: `0 0 6px ${p.color}`,
                        wordBreak: 'break-all',
                        textAlign: 'center',
                      }}>
                        {p.name.slice(0, 10)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Start Button */}
            <motion.button
              className={`btn-pixel ${players.length > 0 ? 'btn-green pixel-pulse' : 'btn-red'}`}
              style={{ width: '100%', fontSize: '0.7rem', padding: '1.1rem' }}
              onClick={handleStartGame}
              disabled={players.length === 0}
              whileHover={players.length > 0 ? { scale: 1.02 } : {}}
              whileTap={players.length > 0 ? { scale: 0.98 } : {}}
            >
              {players.length > 0 ? '🏁 ¡INICIAR CARRERA!' : '⌛ ESPERANDO JUGADORES'}
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
