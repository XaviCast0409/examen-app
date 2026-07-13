import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './hooks/useGame';
import Home from './pages/Home';
import TeacherSetup from './pages/TeacherSetup';
import StudentJoin from './pages/StudentJoin';
import StudentGame from './pages/StudentGame';
import TeacherRace from './pages/TeacherRace';
import Results from './pages/Results';
import './styles/retro.css';

function App() {
  return (
    <GameProvider>
      <div className="stars-bg" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher" element={<TeacherSetup />} />
          <Route path="/join" element={<StudentJoin />} />
          <Route path="/play" element={<StudentGame />} />
          <Route path="/race" element={<TeacherRace />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;