import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';
import type { Question, AnswerResult, Player } from '../types/game';
import Timer from '../components/Timer';

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function getOptionText(q: Question, opt: typeof OPTION_KEYS[number]) {
  return { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt];
}

export default function StudentGame() {
  const { state, dispatch } = useGame();
  const { emit, on } = useSocket();

  const [selected, setSelected] = useState<typeof OPTION_KEYS[number] | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [showResult, setShowResult] = useState(false);

  // Listen for next-question
  useEffect(() => {
    const unsubNext = on('next-question', (data: unknown) => {
      const d = data as { question: Question; questionIndex: number; totalQuestions: number; timeSeconds: number };
      dispatch({ type: 'NEXT_QUESTION', payload: { question: d.question, questionIndex: d.questionIndex, players: [], timeSeconds: d.timeSeconds } });
      setSelected(null);
      setAnswered(false);
      setAnswerResult(null);
      setShowResult(false);
      setQuestionStartTime(Date.now());
    });

    const unsubResult = on('answer-result', (data: unknown) => {
      const d = data as AnswerResult;
      setAnswerResult(d);
      setShowResult(true);
      dispatch({ type: 'SET_ANSWER_RESULT', payload: d });
    });

    const unsubOver = on('game-over', (data: unknown) => {
      const d = data as { players: Player[]; winner: Player | null };
      dispatch({ type: 'GAME_OVER', payload: { players: d.players, winner: d.winner } });
    });

    setQuestionStartTime(Date.now());

    return () => {
      unsubNext();
      unsubResult();
      unsubOver();
    };
  }, [on, dispatch]);

  const handleSelect = useCallback((option: typeof OPTION_KEYS[number]) => {
    if (answered || !state.player || !state.currentQuestion) return;
    const timeMs = Date.now() - questionStartTime;
    setSelected(option);
    setAnswered(true);

    emit('submit-answer', {
      roomCode: state.roomCode,
      playerId: state.player.id,
      selectedOption: option,
      timeMs,
    });
  }, [answered, state.player, state.currentQuestion, state.roomCode, questionStartTime, emit]);

  if (state.status === 'finished') return null; // handled by App router

  const q = state.currentQuestion;
  if (!q) {
    return (
      <div className="page-container">
        <div className="pixel-card text-center">
          <p className="title-pixel" style={{ fontSize: '0.7rem' }}>⏳ ESPERANDO...</p>
        </div>
      </div>
    );
  }

  const difficultyColor = q.difficulty === 'easy' ? 'var(--neon-green)' : q.difficulty === 'medium' ? 'var(--neon-yellow)' : 'var(--neon-red)';
  const difficultyLabel = q.difficulty === 'easy' ? 'FÁCIL' : q.difficulty === 'medium' ? 'MEDIO' : 'DIFÍCIL';

  return (
    <div className="page-container" style={{ padding: '1rem', justifyContent: 'flex-start', paddingTop: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Header HUD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span className="text-pixel" style={{ color: 'rgba(0,255,65,0.5)', fontSize: '0.45rem' }}>JUGADOR</span>
            <p className="text-pixel" style={{ fontSize: '0.6rem', color: state.player?.color || 'var(--neon-green)' }}>
              {state.player?.name?.toUpperCase() || '???'}
            </p>
          </div>
          <div className="text-center">
            <span className="text-pixel" style={{ color: 'rgba(255,224,0,0.5)', fontSize: '0.4rem' }}>PREGUNTA</span>
            <p className="text-pixel text-yellow" style={{ fontSize: '0.7rem' }}>
              {state.questionIndex + 1} / {state.totalQuestions}
            </p>
          </div>
          <div className="text-center">
            <span className="text-pixel" style={{ color: 'rgba(0,170,255,0.5)', fontSize: '0.4rem' }}>PUNTOS</span>
            <p className="text-pixel text-blue" style={{ fontSize: '0.7rem' }}>
              {state.player?.score || 0}
            </p>
          </div>
          <Timer seconds={state.timeSeconds} active={!answered} />
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="progress-bar-wrap" style={{ flex: 1 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${((state.questionIndex) / state.totalQuestions) * 100}%` }}
            />
          </div>
          <span className="badge-pixel" style={{ color: difficultyColor, borderColor: difficultyColor, fontSize: '0.4rem' }}>
            {difficultyLabel}
          </span>
          <span className="badge-pixel text-purple" style={{ fontSize: '0.4rem' }}>{q.topic}</span>
        </div>

        {/* Question Card */}
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: -20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="pixel-card"
          style={{ minHeight: 120 }}
        >
          <p style={{
            fontFamily: 'var(--font-game)',
            fontSize: 'clamp(1rem, 3vw, 1.3rem)',
            fontWeight: 700,
            color: '#e0ffe0',
            lineHeight: 1.5,
          }}>
            {q.text}
          </p>
        </motion.div>

        {/* Answer Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {OPTION_KEYS.map((opt, i) => {
            let className = 'answer-option';
            if (answered) {
              if (opt === q.correctOption) className += ' reveal-correct';
              if (opt === selected && answerResult?.isCorrect) className += ' selected-correct';
              if (opt === selected && !answerResult?.isCorrect) className += ' selected-wrong';
            }

            return (
              <motion.button
                key={opt}
                className={className}
                onClick={() => handleSelect(opt)}
                disabled={answered}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={!answered ? { scale: 1.01 } : {}}
              >
                <span className="answer-key" style={{ color: answered && opt === q.correctOption ? 'var(--neon-green)' : answered && opt === selected && !answerResult?.isCorrect ? 'var(--neon-red)' : 'var(--neon-green)' }}>
                  {OPTION_LABELS[i]}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>{getOptionText(q, opt)}</span>
                {answered && opt === q.correctOption && (
                  <span style={{ color: 'var(--neon-green)', fontSize: '1rem' }}>✓</span>
                )}
                {answered && opt === selected && !answerResult?.isCorrect && opt !== q.correctOption && (
                  <span style={{ color: 'var(--neon-red)', fontSize: '1rem' }}>✗</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Answer Result Banner */}
        <AnimatePresence>
          {showResult && answerResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`pixel-card ${answerResult.isCorrect ? '' : 'red'}`}
              style={{ textAlign: 'center' }}
            >
              {answerResult.isCorrect ? (
                <>
                  <p className="title-pixel" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    ⭐ ¡CORRECTO!
                  </p>
                  <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: 'var(--neon-yellow)' }}>
                    +{answerResult.pointsEarned} PUNTOS
                    {answerResult.pointsEarned > 100 && (
                      <span style={{ color: 'var(--neon-pink)' }}> ⚡ BONUS RÁPIDO!</span>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="title-pixel red" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    💀 INCORRECTO
                  </p>
                  <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: 'rgba(255,51,51,0.7)' }}>
                    La respuesta era: {q.correctOption}
                  </p>
                </>
              )}
              <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: 'rgba(0,255,65,0.5)', marginTop: '0.5rem' }}>
                Esperando siguiente pregunta...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
