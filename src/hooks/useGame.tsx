import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameState, Player, Question, AnswerResult } from '../types/game';

const initialState: GameState = {
  role: null,
  roomCode: '',
  player: null,
  players: [],
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 20,
  timeSeconds: 30,
  status: 'idle',
  lastAnswerResult: null,
  winner: null,
};

type Action =
  | { type: 'SET_ROLE'; payload: 'teacher' | 'student' }
  | { type: 'SET_ROOM_CODE'; payload: string }
  | { type: 'SET_PLAYER'; payload: Player }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_STATUS'; payload: GameState['status'] }
  | { type: 'GAME_STARTED'; payload: { question: Question; questionIndex: number; totalQuestions: number; timeSeconds: number } }
  | { type: 'NEXT_QUESTION'; payload: { question: Question; questionIndex: number; players: Player[]; timeSeconds: number } }
  | { type: 'SET_ANSWER_RESULT'; payload: AnswerResult }
  | { type: 'PROGRESS_UPDATE'; payload: Player[] }
  | { type: 'GAME_OVER'; payload: { players: Player[]; winner: Player | null } }
  | { type: 'RESET' };

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.payload };
    case 'SET_PLAYER':
      return { ...state, player: action.payload };
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'GAME_STARTED':
      return {
        ...state,
        status: 'playing',
        currentQuestion: action.payload.question,
        questionIndex: action.payload.questionIndex,
        totalQuestions: action.payload.totalQuestions,
        timeSeconds: action.payload.timeSeconds,
        lastAnswerResult: null,
      };
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload.question,
        questionIndex: action.payload.questionIndex,
        players: action.payload.players,
        timeSeconds: action.payload.timeSeconds,
        lastAnswerResult: null,
      };
    case 'SET_ANSWER_RESULT':
      return {
        ...state,
        lastAnswerResult: action.payload,
        player: state.player
          ? { ...state.player, score: action.payload.newScore, position: action.payload.newPosition }
          : null,
      };
    case 'PROGRESS_UPDATE':
      return { ...state, players: action.payload };
    case 'GAME_OVER':
      return {
        ...state,
        status: 'finished',
        players: action.payload.players,
        winner: action.payload.winner,
        currentQuestion: null,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
