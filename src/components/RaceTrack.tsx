import { motion } from 'framer-motion';
import type { Player } from '../types/game';

interface RaceTrackProps {
  players: Player[];
  compact?: boolean;
}

// Pixel car emojis with color variation via filter
const CAR_EMOJIS = ['🏎️', '🚗', '🚕', '🚙', '🏁', '⚡', '🔥', '💨', '🌟', '🎮', '👾', '🚀', '💎', '⭐', '🎯', '🏆', '💥', '🎸', '🦊', '🐉'];

function getCarEmoji(index: number) {
  return CAR_EMOJIS[index % CAR_EMOJIS.length];
}

export default function RaceTrack({ players, compact = false }: RaceTrackProps) {
  const sorted = [...players].sort((a, b) => b.position - a.position);
  const laneHeight = compact ? 36 : 48;
  const nameWidth = compact ? 60 : 90;

  return (
    <div className="race-track" style={{ borderRadius: 0 }}>
      {/* Track header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        fontFamily: 'var(--font-pixel)',
        fontSize: compact ? '0.4rem' : '0.5rem',
        color: 'rgba(0,255,65,0.5)',
        paddingLeft: nameWidth + 8,
      }}>
        <span>SALIDA</span>
        <span>⚑ META</span>
      </div>

      {/* Lanes */}
      {sorted.map((player, idx) => (
        <motion.div
          key={player.id}
          className="track-lane"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          {/* Player name */}
          <div style={{ width: nameWidth, flexShrink: 0 }}>
            <span
              className="player-name-label"
              style={{
                color: player.color,
                textShadow: `0 0 8px ${player.color}`,
                fontSize: compact ? '0.35rem' : '0.4rem',
                width: nameWidth,
              }}
            >
              {player.name.toUpperCase().slice(0, compact ? 8 : 12)}
            </span>
          </div>

          {/* Road */}
          <div className="track-road" style={{ height: laneHeight }}>
            {/* Finish line */}
            <div className="track-finish-line" />

            {/* Car */}
            <motion.div
              className="pixel-car"
              style={{
                left: `${Math.max(1, Math.min(player.position, 96))}%`,
                color: player.color,
                fontSize: compact ? '1rem' : '1.4rem',
              }}
              animate={{ left: `${Math.max(1, Math.min(player.position, 96))}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            >
              {getCarEmoji(idx)}
            </motion.div>

            {/* Dust trail */}
            {player.position > 5 && (
              <motion.div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${Math.max(0, player.position - 8)}%`,
                  transform: 'translateY(-50%)',
                  opacity: 0.4,
                  fontSize: compact ? '0.5rem' : '0.7rem',
                  pointerEvents: 'none',
                }}
                animate={{ opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ···
              </motion.div>
            )}
          </div>

          {/* Score */}
          <div style={{
            width: compact ? 50 : 70,
            textAlign: 'right',
            fontFamily: 'var(--font-pixel)',
            fontSize: compact ? '0.4rem' : '0.5rem',
            color: 'var(--neon-yellow)',
            flexShrink: 0,
          }}>
            {player.score}⭐
          </div>
        </motion.div>
      ))}

      {players.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: 'rgba(0,255,65,0.3)' }}>
          ESPERANDO JUGADORES...
        </div>
      )}
    </div>
  );
}
