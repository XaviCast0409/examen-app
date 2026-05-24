import { useState, useEffect } from 'react';
import { EXAM_QUESTIONS } from './config/questions';
import { useExam } from './hooks/useExam';
import { Quiz } from './components/Quiz';
import { LoginForm } from './components/LoginForm';
import { IndividualResult } from './components/IndividualResult';
import { AdminPanel } from './components/AdminPanel';
import { saveResultToLocalStorage } from './utils/storage';
import type { Student, ExamResult } from './types';

function App() {
  const [step, setStep] = useState<'login' | 'quiz' | 'result' | 'admin-ranking'>('login');
  const [student, setStudent] = useState<Student>({ fullName: '', university: '' });
  
  // Google Sheets integration URL for auto-upload upon completion
  const [googleScriptUrl] = useState<string>(() => {
    return (
      localStorage.getItem('google_script_url') ||
      'https://script.google.com/macros/s/AKfycbxmV2vNlkyrhrFDdaSMU7khW9t2WUL29nwppMQojGqxi9v0uKHljiIyO_CK8L4NMSihmQ/exec'
    );
  });

  // Custom states for single student result view
  const [lastSavedResult, setLastSavedResult] = useState<ExamResult | null>(null);

  const {
    currentQuestion,
    currentIndex,
    isFirst,
    isLast,
    answers,
    handleSelectOption,
    nextQuestion,
    prevQuestion,
    calculateScore,
  } = useExam(EXAM_QUESTIONS);

  // Synchronize with URL path or hash to load Admin Dashboard
  useEffect(() => {
    const handleLocationCheck = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const isRanking = path.includes('rankin') || hash.includes('rankin');

      if (isRanking) {
        setStep('admin-ranking');
      }
    };

    // Run check on mount
    handleLocationCheck();

    // Listen to changes in navigation
    window.addEventListener('popstate', handleLocationCheck);
    window.addEventListener('hashchange', handleLocationCheck);

    return () => {
      window.removeEventListener('popstate', handleLocationCheck);
      window.removeEventListener('hashchange', handleLocationCheck);
    };
  }, []);

  const handleStart = (studentData: Student) => {
    setStudent(studentData);
    setStep('quiz');
  };

  const handleFinish = async () => {
    const score = calculateScore();
    const totalQuestions = EXAM_QUESTIONS.length;
    // Calculate relative score out of 20 (Formula: (Score / Total) * 20)
    const grade = (score / totalQuestions) * 20;

    const result: ExamResult = {
      id: 'res_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
      fullName: student.fullName.trim(),
      university: student.university.trim(),
      score,
      grade: parseFloat(grade.toFixed(2)),
      totalQuestions,
      timestamp: Date.now(),
    };

    // 1. Save locally immediately (offline protection)
    saveResultToLocalStorage(result);
    setLastSavedResult(result);

    // 2. If remote sync URL exists, upload result in background
    if (googleScriptUrl.trim()) {
      try {
        await fetch(googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors', // Avoid CORS preflight block from Google
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(result),
        });
        console.log('Sincronización en la nube iniciada para:', result.fullName);
      } catch (err) {
        console.error('Error al enviar a la nube (se guardó localmente):', err);
      }
    }

    setStep('result');
  };

  const handleResetExam = () => {
    setStep('login');
    if (window.location.hash) {
      window.location.hash = '';
    }
    window.location.reload();
  };

  const handleAdminExit = () => {
    window.location.hash = '';
    setStep('login');
  };

  const totalAnsweredQuestions = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-indigo-100 w-full">
      {/* Hidden Gear Button for Quick Admin Access */}
      {step === 'login' && (
        <a
          href="#rankind"
          className="absolute top-4 right-4 w-9 h-9 border-2 border-slate-900 bg-white rounded-lg flex items-center justify-center hover:bg-slate-100 hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-slate-500 hover:text-slate-900 z-50 text-xs"
          title="Panel de Administración"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = 'rankind';
            setStep('admin-ranking');
          }}
        >
          ⚙️
        </a>
      )}

      {/* STEP 1: LOGIN FORM */}
      {step === 'login' && (
        <LoginForm
          onStart={handleStart}
          totalQuestions={EXAM_QUESTIONS.length}
        />
      )}

      {/* STEP 2: ACTIVE QUIZ */}
      {step === 'quiz' && (
        <Quiz
          question={currentQuestion}
          currentIndex={currentIndex}
          total={EXAM_QUESTIONS.length}
          selectedOption={answers[currentQuestion.id]}
          onSelect={handleSelectOption}
          onNext={nextQuestion}
          onPrev={prevQuestion}
          onFinish={handleFinish}
          isFirst={isFirst}
          isLast={isLast}
          totalAnswered={totalAnsweredQuestions}
        />
      )}

      {/* STEP 3: INDIVIDUAL RESULT SCREEN */}
      {step === 'result' && lastSavedResult && (
        <IndividualResult
          result={lastSavedResult}
          googleScriptUrl={googleScriptUrl}
          onReset={handleResetExam}
        />
      )}

      {/* STEP 4: MASTER ADMIN RANKING */}
      {step === 'admin-ranking' && (
        <AdminPanel onExit={handleAdminExit} />
      )}
    </div>
  );
}

export default App;