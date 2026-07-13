import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';
import type { Player, Question } from '../types/game';
import RaceTrack from '../components/RaceTrack';
import Scoreboard from '../components/Scoreboard';

export default function TeacherRace() {
  const { state, dispatch } = useGame();
  const { on } = useSocket();
  const navigate = useNavigate();

  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(20);

  useEffect(() => {
    if (state.currentQuestion) setCurrentQ(state.currentQuestion);
    if (state.questionIndex !== undefined) setQuestionIndex(state.questionIndex);
    if (state.totalQuestions) setTotalQuestions(state.totalQuestions);
  }, [state.currentQuestion, state.questionIndex, state.totalQuestions]);

  useEffect(() => {
    const unsubProgress = on('progress-update', (data: unknown) => {
      const d = data as { players: Player[] };
      dispatch({ type: 'PROGRESS_UPDATE', payload: d.players });
    });

    const unsubNext = on('next-question', (data: unknown) => {
      const d = data as { question: Question; questionIndex: number; totalQuestions: number; timeSeconds: number; players: Player[] };
      setCurrentQ(d.question);
      setQuestionIndex(d.questionIndex);
      setTotalQuestions(d.totalQuestions);
      dispatch({ type: 'NEXT_QUESTION', payload: { question: d.question, questionIndex: d.questionIndex, players: d.players, timeSeconds: d.timeSeconds } });
    });

    const unsubOver = on('game-over', (data: unknown) => {
      const d = data as { players: Player[]; winner: Player | null };
      dispatch({ type: 'GAME_OVER', payload: d });
      navigate('/results');
    });

    return () => {
      unsubProgress();
      unsubNext();
      unsubOver();
    };
  }, [on, dispatch, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 className="title-pixel" style={{ fontSize: 'clamp(0.7rem, 2vw, 1rem)' }}>
            🏁 MATHRACE — EN VIVO
          </h1>
          <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.45rem', color: 'rgba(0,255,65,0.5)' }}>
            SALA: {state.roomCode}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <span className="text-pixel" style={{ fontSize: '0.4rem', color: 'rgba(255,224,0,0.5)' }}>PREGUNTA</span>
            <p className="title-pixel yellow" style={{ fontSize: '0.9rem' }}>
              {questionIndex + 1} / {totalQuestions}
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span className="text-pixel" style={{ fontSize: '0.4rem', color: 'rgba(0,170,255,0.5)' }}>JUGADORES</span>
            <p className="title-pixel" style={{ fontSize: '0.9rem', color: 'var(--neon-blue)' }}>
              {state.players.length}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${((questionIndex) / totalQuestions) * 100}%` }} />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', flex: 1 }}>
        {/* Left: Race track */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Current question display */}
          {currentQ && (
            <motion.div
              key={currentQ.id}
              className="pixel-card blue"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <span className="badge-pixel" style={{ fontSize: '0.4rem', color: 'var(--neon-blue)', borderColor: 'var(--neon-blue)', marginBottom: '0.5rem', display: 'inline-block' }}>
                    {currentQ.topic} · {currentQ.difficulty === 'easy' ? 'FÁCIL' : currentQ.difficulty === 'medium' ? 'MEDIO' : 'DIFÍCIL'}
                  </span>
                  <p style={{ fontFamily: 'var(--font-game)', fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', fontWeight: 700, color: '#e0f0ff', lineHeight: 1.5 }}>
                    {currentQ.text}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', minWidth: 200 }}>
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <div key={opt} style={{
                      padding: '0.4rem 0.6rem',
                      border: `2px solid ${opt === currentQ.correctOption ? 'var(--neon-green)' : 'rgba(0,170,255,0.3)'}`,
                      background: opt === currentQ.correctOption ? 'rgba(0,255,65,0.1)' : 'rgba(0,170,255,0.05)',
                      fontFamily: 'var(--font-game)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}>
                      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.45rem', color: opt === currentQ.correctOption ? 'var(--neon-green)' : 'var(--neon-blue)' }}>{opt}</span>
                      <span style={{ color: opt === currentQ.correctOption ? '#90ffb0' : '#aaccff', fontSize: '0.8rem' }}>
                        {{ A: currentQ.optionA, B: currentQ.optionB, C: currentQ.optionC, D: currentQ.optionD }[opt]}
                      </span>
                      {opt === currentQ.correctOption && <span style={{ marginLeft: 'auto' }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Race Track */}
          <div style={{ flex: 1 }}>
            <RaceTrack players={state.players} />
          </div>
        </div>

        {/* Right: Scoreboard */}
        <Scoreboard players={state.players} />
      </div>

      {/* Ticker */}
      <div className="marquee-wrap">
        <div className="marquee-text">
          🏁 MATHRACE EN VIVO · {state.players.length} CORREDORES ·
          {state.players.slice(0, 3).map(p => ` ${p.name}: ${p.score}pts ·`).join('')}
          PREGUNTA {questionIndex + 1}/{totalQuestions} ·
        </div>
      </div>
    </div>
  );
}
