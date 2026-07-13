import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';
import type { Player, Question } from '../types/game';

export default function StudentJoin() {
  const { state, dispatch } = useGame();
  const { emit, on } = useSocket();
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [step, setStep] = useState<'form' | 'waiting'>('form');
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const unsubJoined = on('joined-room', (data: unknown) => {
      const d = data as { player: Player; roomCode: string };
      dispatch({ type: 'SET_PLAYER', payload: d.player });
      dispatch({ type: 'SET_ROOM_CODE', payload: d.roomCode });
      dispatch({ type: 'SET_STATUS', payload: 'waiting' });
      setStep('waiting');
      setJoining(false);
    });

    const unsubError = on('join-error', (data: unknown) => {
      const d = data as { message: string };
      setError(d.message);
      setJoining(false);
    });

    const unsubPlayerJoined = on('player-joined', (data: unknown) => {
      const d = data as { players: Player[] };
      setLocalPlayers(d.players);
      dispatch({ type: 'SET_PLAYERS', payload: d.players });
    });

    const unsubStarted = on('game-started', (data: unknown) => {
      const d = data as { question: Question; questionIndex: number; totalQuestions: number; timeSeconds: number };
      dispatch({ type: 'GAME_STARTED', payload: d });
      navigate('/play');
    });

    const unsubTeacherDisco = on('teacher-disconnected', () => {
      setError('El profesor se desconectó.');
      setStep('form');
    });

    return () => {
      unsubJoined();
      unsubError();
      unsubPlayerJoined();
      unsubStarted();
      unsubTeacherDisco();
    };
  }, [on, dispatch, navigate]);

  const handleJoin = () => {
    const code = roomCode.trim().toUpperCase();
    const name = playerName.trim();
    if (!code || !name) {
      setError('Completa todos los campos.');
      return;
    }
    setError('');
    setJoining(true);
    emit('join-room', { roomCode: code, playerName: name });
  };

  if (step === 'waiting') {
    return (
      <div className="page-container">
        <div className="content-box" style={{ maxWidth: 520, alignItems: 'center' }}>
          <motion.div
            className="pixel-card yellow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ width: '100%', textAlign: 'center' }}
          >
            <motion.div
              style={{ fontSize: '3rem', marginBottom: '0.75rem' }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {['🏎️', '🚗', '🚕', '🚙', '⚡', '🔥', '💨', '🌟'][((state.player?.avatar ?? 1) - 1) % 8]}
            </motion.div>

            <p className="title-pixel yellow" style={{ fontSize: '0.7rem', marginBottom: '0.5rem' }}>
              {state.player?.name?.toUpperCase()}
            </p>
            <p style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '0.45rem',
              color: 'rgba(255,224,0,0.6)',
            }}>
              SALA: {state.roomCode}
            </p>
          </motion.div>

          <div className="pixel-card" style={{ width: '100%', textAlign: 'center' }}>
            <p className="title-pixel" style={{ fontSize: '0.65rem', marginBottom: '1rem' }}>
              <span className="blink">█</span> ESPERANDO AL PROFESOR
            </p>
            <p style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '0.45rem',
              color: 'rgba(0,255,65,0.5)',
            }}>
              {localPlayers.length} jugador(es) conectado(s)
            </p>

            {localPlayers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                {localPlayers.map(p => (
                  <motion.span
                    key={p.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '0.4rem',
                      padding: '0.3rem 0.6rem',
                      border: `2px solid ${p.color}`,
                      color: p.color,
                    }}
                  >
                    {p.name.slice(0, 10)}
                  </motion.span>
                ))}
              </div>
            )}
          </div>

          <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', color: 'rgba(0,255,65,0.3)', textAlign: 'center' }}>
            ¡La carrera está por comenzar! Prepárate... 🚦
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-box">
        <button
          className="btn-pixel btn-red"
          style={{ alignSelf: 'flex-start', fontSize: '0.5rem', padding: '0.5rem 0.9rem' }}
          onClick={() => navigate('/')}
        >
          ← VOLVER
        </button>

        <motion.h1
          className="title-pixel yellow"
          style={{ fontSize: '0.9rem', textAlign: 'center' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          👾 UNIRSE A PARTIDA
        </motion.h1>

        <motion.div
          className="pixel-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div>
            <label className="text-pixel" style={{ fontSize: '0.5rem', display: 'block', marginBottom: '0.5rem' }}>
              CÓDIGO DE SALA
            </label>
            <input
              className="input-pixel"
              type="text"
              placeholder="Ej: ABCD-1234"
              value={roomCode}
              onChange={e => {
                setError('');
                setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
              }}
              maxLength={9}
            />
          </div>

          <div>
            <label className="text-pixel" style={{ fontSize: '0.5rem', display: 'block', marginBottom: '0.5rem' }}>
              TU NOMBRE / ALIAS
            </label>
            <input
              className="input-pixel"
              type="text"
              placeholder="Ej: SHADOW_X99"
              value={playerName}
              onChange={e => {
                setError('');
                setPlayerName(e.target.value.toUpperCase());
              }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={15}
              autoFocus
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-pixel text-red"
              style={{ fontSize: '0.45rem' }}
            >
              ⚠ {error}
            </motion.p>
          )}

          <motion.button
            className={`btn-pixel ${joining ? 'btn-red' : 'btn-yellow'}`}
            style={{ width: '100%', fontSize: '0.65rem', padding: '1rem' }}
            onClick={handleJoin}
            disabled={joining}
            whileHover={!joining ? { scale: 1.02 } : {}}
            whileTap={!joining ? { scale: 0.98 } : {}}
          >
            {joining ? '⏳ CONECTANDO...' : '▶ ¡ENTRAR A LA CARRERA!'}
          </motion.button>
        </motion.div>

        <p style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.4rem',
          color: 'rgba(0,255,65,0.3)',
          textAlign: 'center',
        }}>
          Pide el código a tu profesor
        </p>
      </div>
    </div>
  );
}
