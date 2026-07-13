// Tipos compartidos frontend - backend

export interface Player {
  id: string;
  name: string;
  roomCode: string;
  score: number;
  position: number;
  answeredCount: number;
  correctCount: number;
  color: string;
  avatar: number;
  isReady: boolean;
  socketId: string;
}

export interface Question {
  id: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  points: number;
}

export type GameStatus = 'idle' | 'waiting' | 'playing' | 'finished';
export type UserRole = 'teacher' | 'student' | null;

export interface AnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  newScore: number;
  newPosition: number;
}

export interface GameState {
  role: UserRole;
  roomCode: string;
  player: Player | null;
  players: Player[];
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  timeSeconds: number;
  status: GameStatus;
  lastAnswerResult: AnswerResult | null;
  winner: Player | null;
}

export const AVATAR_PIXEL_COLORS = [
  '#FF3333', '#33FF33', '#3399FF', '#FFE000',
  '#FF66FF', '#FF9900', '#00FFFF', '#FF6699',
  '#99FF00', '#FF4400', '#00FF99', '#AA44FF',
  '#FF0088', '#44AAFF', '#FFAA00', '#00FFCC',
  '#FF8844', '#88FF44', '#FF44AA', '#44FFAA'
];
