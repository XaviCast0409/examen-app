import { motion } from 'framer-motion';
import type { Player } from '../types/game';

interface ScoreboardProps {
  players: Player[];
  compact?: boolean;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Scoreboard({ players, compact = false }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="pixel-card" style={{ padding: compact ? '0.75rem' : '1rem' }}>
      <p className="title-pixel" style={{ fontSize: '0.55rem', marginBottom: '0.75rem' }}>
        🏆 RANKING
      </p>

      {sorted.map((player, idx) => (
        <motion.div
          key={player.id}
          className="scoreboard-row"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          layout
        >
          {/* Rank */}
          <span style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: compact ? '0.7rem' : '0.9rem',
            width: 28,
            textAlign: 'center',
            flexShrink: 0,
          }}>
            {idx < 3 ? MEDALS[idx] : `#${idx + 1}`}
          </span>

          {/* Color dot */}
          <div style={{
            width: 12, height: 12,
            background: player.color,
            boxShadow: `0 0 6px ${player.color}`,
            flexShrink: 0,
          }} />

          {/* Name */}
          <span style={{
            flex: 1,
            fontFamily: 'var(--font-pixel)',
            fontSize: compact ? '0.4rem' : '0.5rem',
            color: player.color,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {player.name.toUpperCase()}
          </span>

          {/* Correct */}
          {!compact && (
            <span style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '0.4rem',
              color: 'rgba(0,255,65,0.5)',
            }}>
              {player.correctCount}✓
            </span>
          )}

          {/* Score */}
          <span style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: compact ? '0.5rem' : '0.6rem',
            color: 'var(--neon-yellow)',
            textShadow: '0 0 8px rgba(255,224,0,0.5)',
            minWidth: 60,
            textAlign: 'right',
          }}>
            {player.score}⭐
          </span>
        </motion.div>
      ))}

      {players.length === 0 && (
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.45rem',
          color: 'rgba(0,255,65,0.3)',
          padding: '1rem',
        }}>
          SIN JUGADORES AÚN
        </p>
      )}
    </div>
  );
}
