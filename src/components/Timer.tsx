import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  seconds: number;
  active: boolean;
  onExpire?: () => void;
}

export default function Timer({ seconds, active, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!active) return;
    if (remaining <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, remaining, onExpire]);

  const isDanger = remaining <= 10;
  const pct = (remaining / seconds) * 100;
  const barColor = isDanger ? 'var(--neon-red)' : remaining <= 20 ? 'var(--neon-yellow)' : 'var(--neon-green)';

  return (
    <div style={{ textAlign: 'center' }}>
      <span className="text-pixel" style={{ color: 'rgba(255,224,0,0.5)', fontSize: '0.4rem' }}>TIEMPO</span>
      <motion.div
        className={`timer-display ${isDanger ? 'danger' : ''}`}
        animate={isDanger ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isDanger ? Infinity : 0 }}
        style={{ fontSize: '0.9rem' }}
      >
        {String(remaining).padStart(2, '0')}s
      </motion.div>
      <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.1)', marginTop: '2px' }}>
        <motion.div
          style={{
            height: '100%',
            background: barColor,
            boxShadow: `0 0 6px ${barColor}`,
            width: `${pct}%`,
          }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
