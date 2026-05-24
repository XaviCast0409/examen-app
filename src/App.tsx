import React, { useState, useEffect } from 'react';
import { EXAM_QUESTIONS } from './config/questions';
import { useExam } from './hooks/useExam';
import { Quiz } from './components/Quiz';
import type { Student, ExamResult } from './types';

// Helper utility to read results from LocalStorage safely
const getResultsFromLocalStorage = (): ExamResult[] => {
  try {
    const resultsJson = localStorage.getItem('simulacro_results');
    return resultsJson ? JSON.parse(resultsJson) : [];
  } catch (e) {
    console.error("Error reading from localStorage", e);
    return [];
  }
};

// Helper utility to save result to LocalStorage
const saveResultToLocalStorage = (result: ExamResult) => {
  try {
    const existingResults = getResultsFromLocalStorage();
    
    // Prevent duplicate entries of the exact same submission in quick succession (5 seconds)
    const isDuplicate = existingResults.some(
      r => r.fullName.toLowerCase() === result.fullName.toLowerCase() && 
           r.university.toLowerCase() === result.university.toLowerCase() && 
           Math.abs(r.timestamp - result.timestamp) < 5000
    );
    
    if (!isDuplicate) {
      existingResults.push(result);
      localStorage.setItem('simulacro_results', JSON.stringify(existingResults));
    }
  } catch (e) {
    console.error("Error saving to localStorage", e);
  }
};

function App() {
  const [step, setStep] = useState<'login' | 'quiz' | 'result' | 'admin-ranking'>('login');
  const [student, setStudent] = useState<Student>({ fullName: '', university: '' });
  const [nameError, setNameError] = useState<string | null>(null);
  const [rankingList, setRankingList] = useState<ExamResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Google Sheets integration state
  const [googleScriptUrl, setGoogleScriptUrl] = useState<string>(() => {
    return localStorage.getItem('google_script_url') || 'https://script.google.com/macros/s/AKfycbxmV2vNlkyrhrFDdaSMU7khW9t2WUL29nwppMQojGqxi9v0uKHljiIyO_CK8L4NMSihmQ/exec';
  });
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);
  const [cloudUrlInput, setCloudUrlInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Custom states for single student result view
  const [lastSavedResult, setLastSavedResult] = useState<ExamResult | null>(null);

  const {
    currentQuestion, currentIndex, isFirst, isLast, answers,
    handleSelectOption, nextQuestion, prevQuestion, calculateScore
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

  // Fetch data (local + Google Sheets if configured)
  const loadRankingData = async () => {
    setIsSyncing(true);
    setSyncMessage("Cargando registros...");
    
    // 1. Load local results first as immediate display / fallback
    const localData = getResultsFromLocalStorage();
    setRankingList(localData);

    // 2. If Google Sheets API is configured, fetch live remote data
    if (googleScriptUrl.trim()) {
      try {
        const response = await fetch(googleScriptUrl);
        
        if (response.ok) {
          const remoteData = await response.json();
          if (Array.isArray(remoteData)) {
            // Merge remote and local data avoiding duplicates by unique ID
            const mergedMap = new Map<string, ExamResult>();
            
            // Add remote items
            remoteData.forEach((r: any) => {
              if (r.id) {
                mergedMap.set(r.id, {
                  id: r.id,
                  fullName: r.fullName,
                  university: r.university,
                  score: Number(r.score),
                  grade: Number(r.grade),
                  totalQuestions: Number(r.totalQuestions),
                  timestamp: Number(r.timestamp)
                });
              }
            });
            
            // Add local items (if not already fetched from remote)
            localData.forEach(r => {
              if (!mergedMap.has(r.id)) {
                mergedMap.set(r.id, r);
              }
            });

            const mergedList = Array.from(mergedMap.values());
            setRankingList(mergedList);
            
            // Update local storage to match the server if remote has more/different items
            // This propagates sync across all machines!
            localStorage.setItem('simulacro_results', JSON.stringify(mergedList));
            
            setSyncMessage("☁️ Base de datos en la nube sincronizada con éxito.");
          } else {
            setSyncMessage("⚠️ La respuesta de la nube no tiene un formato de lista válido.");
          }
        } else {
          setSyncMessage("⚠️ No se pudo obtener datos de la nube. Código: " + response.status);
        }
      } catch (err) {
        console.error("Error fetching remote database:", err);
        setSyncMessage("⚠️ Error de conexión con la nube. Mostrando historial local.");
      }
    } else {
      setSyncMessage("Modo local activo. Configura la URL en la nube para sincronizar.");
    }
    
    setIsSyncing(false);
    setTimeout(() => setSyncMessage(null), 5000);
  };

  // Trigger data load when in admin ranking view
  useEffect(() => {
    if (step === 'admin-ranking') {
      loadRankingData();
      setCloudUrlInput(googleScriptUrl);
    }
  }, [step, googleScriptUrl]);

  // Validates full name strictly (minimum 1 first name and 2 last names -> at least 3 words)
  const validateFullName = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    
    // Filter words to ensure they are real words (at least 2 letters, ignoring initials)
    const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
    
    return words.length >= 3;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStudent(prev => ({ ...prev, fullName: val }));
    
    if (val.trim() === '') {
      setNameError(null);
    } else {
      const isValid = validateFullName(val);
      if (!isValid) {
        setNameError('Ingresa tu nombre completo (mínimo 1 nombre y 2 apellidos, Ej: "Juan Carlos Pérez Gómez")');
      } else {
        setNameError(null);
      }
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (student.fullName.trim() && student.university.trim()) {
      if (!validateFullName(student.fullName)) {
        setNameError('Nombre inválido. Debes escribir al menos 1 nombre y 2 apellidos.');
        return;
      }
      setNameError(null);
      setStep('quiz');
    }
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
      timestamp: Date.now()
    };

    // 1. Guardar localmente de inmediato (Garantía absoluta contra cortes de internet)
    saveResultToLocalStorage(result);
    setLastSavedResult(result);
    
    // 2. Si hay URL de la nube configurada, enviarlo inmediatamente a Google Sheets
    if (googleScriptUrl.trim()) {
      try {
        // Enviar usando POST simple en formato de texto plano para evadir bloqueos de CORS
        await fetch(googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors', // Evita el chequeo OPTIONS preflight que Google bloquea
          headers: {
            'Content-Type': 'text/plain'
          },
          body: JSON.stringify(result)
        });
        console.log("Sincronización en la nube iniciada para:", result.fullName);
      } catch (err) {
        console.error("Error al enviar a la nube (se guardó localmente):", err);
      }
    }
    
    setStep('result');
  };

  const handleResetExam = () => {
    // Clear student input
    setStudent({ fullName: '', university: '' });
    setNameError(null);
    setStep('login');
    // Refresh page hash/url to root in case they accessed from a hashed link
    if (window.location.hash) {
      window.location.hash = '';
    }
    // Simple reload to reset the exam state inside the custom hook
    window.location.reload();
  };

  // Guardar configuración de la URL de la nube en LocalStorage
  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = cloudUrlInput.trim();
    localStorage.setItem('google_script_url', cleanUrl);
    setGoogleScriptUrl(cleanUrl);
    setIsCloudConfigOpen(false);
    alert("Configuración de nube guardada. Intentando sincronizar...");
  };

  // Subir manualmente todos los registros locales a la nube (Útil si se rindieron exámenes offline)
  const handleForceSyncAllToCloud = async () => {
    if (!googleScriptUrl.trim()) {
      alert("Por favor, configura la URL de la nube primero.");
      return;
    }

    setIsSyncing(true);
    setSyncMessage("Subiendo registros locales pendientes...");
    
    const localData = getResultsFromLocalStorage();
    let successCount = 0;
    
    for (const r of localData) {
      try {
        await fetch(googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: JSON.stringify(r)
        });
        successCount++;
      } catch (err) {
        console.error("Error subiendo registro:", r.fullName, err);
      }
    }

    setSyncMessage(`Sincronización manual: ${successCount} registros procesados.`);
    setTimeout(() => {
      loadRankingData();
    }, 1000);
  };

  // CSV Export utility
  const exportToCSV = () => {
    const results = [...rankingList];
    if (results.length === 0) {
      alert("No hay registros para exportar.");
      return;
    }
    
    // Sort results by grade descending (Ranked)
    results.sort((a, b) => b.grade - a.grade);
    
    // UTF-8 BOM for Spanish characters (accents, ñ) in Excel
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Puesto,Nombre Completo,Universidad,Respuestas Correctas,Nota (Escala 20),Fecha y Hora\n";
    
    results.forEach((r, idx) => {
      const dateStr = new Date(r.timestamp).toLocaleString('es-PE');
      const escapedName = `"${r.fullName.replace(/"/g, '""')}"`;
      const escapedUni = `"${r.university.replace(/"/g, '""')}"`;
      csvContent += `${idx + 1},${escapedName},${escapedUni},${r.score}/${r.totalQuestions},${r.grade.toFixed(2)},${dateStr}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ranking_Simulacro_Admision_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export utility
  const exportToJSON = () => {
    if (rankingList.length === 0) {
      alert("No hay registros para exportar.");
      return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(rankingList, null, 2)
    )}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `Datos_Simulacro_Completo_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy structured list to clipboard
  const copyToClipboard = () => {
    if (rankingList.length === 0) {
      alert("No hay registros para copiar.");
      return;
    }
    const sorted = [...rankingList].sort((a, b) => b.grade - a.grade);
    let text = "🏆 RANKING DE PARTICIPANTES - SIMULACRO VIRTUAL DE ADMISIÓN 🏆\n\n";
    sorted.forEach((r, idx) => {
      const date = new Date(r.timestamp).toLocaleString('es-PE');
      text += `Puesto ${idx + 1}°: ${r.fullName} ➔ Univ: ${r.university} | Nota: ${r.grade.toFixed(2)}/20 (Aciertos: ${r.score}/${r.totalQuestions}) | ${date}\n`;
    });
    
    navigator.clipboard.writeText(text)
      .then(() => alert("¡Ranking copiado al portapapeles con formato listo para compartir!"))
      .catch(err => alert("Error al copiar al portapapeles: " + err));
  };

  // Clear results from database/localstorage
  const handleClearDatabase = () => {
    const confirm1 = window.confirm("⚠️ ¿Estás completamente seguro de borrar TODOS los registros locales? Esta acción es irreversible.");
    if (confirm1) {
      const confirm2 = window.confirm("Por favor, confirma una vez más. Se borrarán los datos de todos los participantes de este navegador.");
      if (confirm2) {
        localStorage.removeItem('simulacro_results');
        setRankingList([]);
        alert("Base de datos local borrada. Nota: Los datos en tu Google Sheet no se alterarán.");
      }
    }
  };

  // Filtered ranking list for admin view
  const filteredRanking = rankingList
    .filter(r => 
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.university.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.grade - a.grade); // Sorted highest score first

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
        <form 
          onSubmit={handleStart} 
          className="w-full max-w-lg bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_rgba(15,23,42,1)] p-8 rounded-3xl"
        >
          <div className="text-center mb-8">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-black uppercase px-4 py-1.5 border-2 border-indigo-900 rounded-full tracking-wider neo-brutalism-shadow-sm inline-block mb-3">
              Admisión Universitaria
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">
              SIMULACRO <span className="text-indigo-600 block sm:inline">VIRTUAL</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Ingresa tus datos reales para iniciar la evaluación.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-slate-900 font-extrabold uppercase text-xs tracking-wider mb-2 flex justify-between items-center">
                <span>Nombre y Apellidos Completos</span>
                <span className="text-red-500 text-xs font-bold font-sans">* Obligatorio</span>
              </label>
              <input
                type="text" 
                required
                placeholder="Ej. Juan Andrés Pérez Gómez"
                className={`w-full border-3 p-4 rounded-xl font-bold bg-slate-50 text-slate-900 focus:bg-white focus:outline-none transition-all duration-200
                  ${nameError 
                    ? 'border-rose-400 focus:border-rose-500 text-rose-900 bg-rose-50/50' 
                    : 'border-slate-900 focus:border-indigo-600 focus:shadow-[4px_4px_0_0_rgba(79,70,229,1)]'
                  }`}
                value={student.fullName}
                onChange={handleNameChange}
              />
              {nameError ? (
                <p className="mt-2 text-xs font-extrabold text-rose-500 flex items-center gap-1">
                  ⚠️ {nameError}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-400 font-semibold">
                  Mínimo tu primer nombre y tus dos apellidos (paterno y materno).
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-900 font-extrabold uppercase text-xs tracking-wider mb-2 flex justify-between items-center">
                <span>Universidad a la que postula</span>
                <span className="text-red-500 text-xs font-bold font-sans">* Obligatorio</span>
              </label>
              <input
                type="text" 
                required
                placeholder="Ej. Universidad Nacional Mayor de San Marcos (UNMSM)"
                className="w-full border-3 border-slate-900 p-4 rounded-xl font-bold bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:shadow-[4px_4px_0_0_rgba(79,70,229,1)] transition-all duration-200"
                value={student.university}
                onChange={e => setStudent({ ...student, university: e.target.value })}
              />
              <p className="mt-2 text-xs text-slate-400 font-semibold">
                Escribe la universidad de tu interés.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!!nameError || !student.fullName.trim() || !student.university.trim()}
            className="w-full py-4 text-center bg-indigo-500 text-white font-black border-3 border-slate-900 rounded-xl shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:bg-indigo-600 hover:shadow-[6px_6px_0_0_rgba(15,23,42,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-0 active:translate-x-0 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-lg flex items-center justify-center gap-2"
          >
            ⚡ COMENZAR EXAMEN AHORA
          </button>

          <div className="mt-6 text-center border-t-2 border-dashed border-slate-200 pt-4 flex justify-between items-center text-xs font-bold text-slate-400">
            <span>Total: {EXAM_QUESTIONS.length} Preguntas</span>
            <span>Escala: 0 a 20 Puntos</span>
          </div>
        </form>
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
        <div className="w-full max-w-xl bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0_0_rgba(15,23,42,1)] rounded-3xl text-center">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-4 py-1.5 border-2 border-emerald-950 rounded-full tracking-wider inline-block mb-4">
            ¡Examen Completado Exitosamente!
          </span>
          
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">
            Tu Calificación
          </h2>
          <p className="text-slate-500 font-bold text-lg mb-6">{lastSavedResult.fullName}</p>
          
          {/* Main Grade Circle */}
          <div className="w-48 h-48 rounded-full border-4 border-slate-900 bg-indigo-50 mx-auto flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(15,23,42,1)] mb-6 animate-pulse-subtle">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Nota Final</span>
            <span className="text-5xl font-black text-indigo-600 my-1">
              {lastSavedResult.grade.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-400">sobre 20.00</span>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-4 border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
              <p className="text-xs font-black text-slate-400 uppercase">Correctas</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {lastSavedResult.score} <span className="text-sm text-slate-400 font-bold">/ {lastSavedResult.totalQuestions}</span>
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
              <p className="text-xs font-black text-slate-400 uppercase">Postulación</p>
              <p className="text-sm font-black text-indigo-600 truncate mt-2 px-1" title={lastSavedResult.university}>
                {lastSavedResult.university}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded-xl text-amber-900 text-sm font-bold flex items-center gap-2 justify-center neo-brutalism-shadow-sm">
              <span>{googleScriptUrl.trim() ? "☁️" : "💾"}</span> 
              {googleScriptUrl.trim() 
                ? "¡Puntaje enviado a la base de datos en la nube y guardado localmente!" 
                : "Su puntaje ha sido registrado en la base de datos de esta máquina."
              }
            </div>

            <button 
              onClick={handleResetExam}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black border-3 border-slate-900 rounded-xl shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-0 active:translate-x-0 transition-all cursor-pointer"
            >
              🔄 REGISTRAR NUEVO ALUMNO
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: MASTER ADMIN RANKING */}
      {step === 'admin-ranking' && (
        <div className="w-full max-w-5xl bg-white border-4 border-slate-900 p-6 md:p-8 shadow-[10px_10px_0_0_rgba(15,23,42,1)] rounded-3xl my-8">
          
          {/* Status Message Overlay */}
          {syncMessage && (
            <div className="mb-4 p-4 bg-indigo-100 border-3 border-slate-900 rounded-2xl font-bold text-slate-800 text-sm flex items-center justify-between shadow-[4px_4px_0_0_rgba(15,23,42,1)] animate-bounce">
              <span>{syncMessage}</span>
              <button onClick={() => setSyncMessage(null)} className="text-xs underline cursor-pointer">Cerrar</button>
            </div>
          )}

          {/* Admin Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900 pb-6 mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white text-xs font-black uppercase px-3 py-1 border-2 border-slate-900 rounded-full tracking-wider shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
                  Consola Privada
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-bold text-slate-400">
                  {googleScriptUrl.trim() ? "Nube Sincronizada" : "Modo Local Autónomo"}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-2">
                🏆 Panel de Ranking General
              </h2>
              <p className="text-slate-500 font-semibold mt-1">
                Visualiza, descarga y gestiona las calificaciones de los estudiantes en tiempo real.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex gap-4">
              <div className="bg-indigo-50 border-2 border-slate-900 px-4 py-2 rounded-xl text-center shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
                <span className="text-[10px] font-black text-slate-400 uppercase">Evaluados</span>
                <p className="text-2xl font-black text-indigo-600 leading-tight">{rankingList.length}</p>
              </div>
              
              <div className="bg-emerald-50 border-2 border-slate-900 px-4 py-2 rounded-xl text-center shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
                <span className="text-[10px] font-black text-slate-400 uppercase">Nota Promedio</span>
                <p className="text-2xl font-black text-emerald-600 leading-tight">
                  {rankingList.length > 0 
                    ? (rankingList.reduce((acc, curr) => acc + curr.grade, 0) / rankingList.length).toFixed(2)
                    : "0.00"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Cloud Synchronization Settings Panel */}
          <div className="mb-6 bg-slate-100 border-3 border-slate-900 p-5 rounded-2xl shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-slate-900 uppercase text-sm tracking-wide flex items-center gap-2">
                <span>☁️</span> Sincronización en la Nube (Google Sheets)
              </h3>
              <button 
                onClick={() => setIsCloudConfigOpen(!isCloudConfigOpen)}
                className="text-xs font-black bg-white border-2 border-slate-900 px-3 py-1 rounded-lg hover:bg-slate-200 active:translate-y-0.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] cursor-pointer"
              >
                {isCloudConfigOpen ? "Cerrar Configuración" : "Abrir Configuración"}
              </button>
            </div>

            {isCloudConfigOpen ? (
              <form onSubmit={handleSaveCloudConfig} className="space-y-4 pt-2">
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  Pega aquí la URL de la aplicación web generada al publicar tu Google Apps Script en la hoja de cálculo. Esto permitirá sincronizar todas las computadoras del simulacro automáticamente en tiempo real.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    required
                    placeholder="Ej. https://script.google.com/macros/s/.../exec"
                    className="flex-grow border-2 border-slate-900 p-3 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-600 text-xs sm:text-sm"
                    value={cloudUrlInput}
                    onChange={e => setCloudUrlInput(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-5 py-3 bg-indigo-500 text-white text-xs font-black border-2 border-slate-900 rounded-xl hover:bg-indigo-600 active:translate-y-0.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] cursor-pointer"
                    >
                      💾 Guardar URL
                    </button>
                    {googleScriptUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem('google_script_url');
                          setGoogleScriptUrl('');
                          setCloudUrlInput('');
                          setIsCloudConfigOpen(false);
                          alert("Integración de nube desactivada. Volviendo al modo local.");
                        }}
                        className="px-3 py-3 bg-rose-100 text-rose-700 text-xs font-black border-2 border-rose-300 hover:border-slate-900 rounded-xl hover:bg-rose-200 cursor-pointer"
                      >
                        Desconectar
                      </button>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500">Estado de conexión: </span>
                  {googleScriptUrl.trim() ? (
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1 mt-1 sm:mt-0 sm:inline-flex">
                      🟢 Enlazado y Sincronizado a: <code className="bg-white border border-slate-300 px-1 py-0.5 rounded text-[10px] text-slate-600">{googleScriptUrl.substring(0, 45)}...</code>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-extrabold mt-1 sm:mt-0 sm:inline-flex">
                      🟡 Modo local autónomo. Los resultados no se sincronizan con otras máquinas.
                    </span>
                  )}
                </div>
                
                {googleScriptUrl.trim() && (
                  <div className="flex gap-2 self-start sm:self-auto">
                    <button
                      onClick={loadRankingData}
                      disabled={isSyncing}
                      className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-lg hover:bg-slate-200 text-slate-800 font-bold active:translate-y-0.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] cursor-pointer disabled:opacity-50"
                    >
                      🔄 Recargar Servidor
                    </button>
                    <button
                      onClick={handleForceSyncAllToCloud}
                      disabled={isSyncing}
                      className="px-3 py-1.5 bg-indigo-50 border-2 border-slate-900 rounded-lg hover:bg-indigo-100 text-indigo-900 font-extrabold active:translate-y-0.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] cursor-pointer disabled:opacity-50"
                      title="Sube datos recolectados si esta máquina estuvo desconectada de internet"
                    >
                      📤 Subir datos de esta PC
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-50 border-2 border-slate-900 p-4 rounded-2xl">
            {/* Search filter input */}
            <div className="w-full md:w-80 relative">
              <span className="absolute left-3.5 top-3.5 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Buscar por alumno o universidad..."
                className="w-full border-2 border-slate-900 pl-10 pr-4 py-2 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0_0_rgba(15,23,42,1)] transition-all text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Download and clear buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-emerald-400 text-slate-900 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:bg-emerald-500 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
                title="Descargar para Excel"
              >
                📊 Descargar Excel (CSV)
              </button>

              <button
                onClick={exportToJSON}
                className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:bg-slate-200 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                💾 Copia JSON
              </button>

              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-indigo-200 text-indigo-900 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:bg-indigo-300 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                📋 Copiar Ranking
              </button>

              <button
                onClick={handleClearDatabase}
                className="px-4 py-2 bg-rose-100 text-rose-700 text-xs font-black border-2 border-rose-300 hover:border-slate-900 hover:bg-rose-200 rounded-xl active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="Restaurar toda la información de esta máquina"
              >
                🗑️ Borrar Historial Local
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="border-3 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0_0_rgba(15,23,42,1)] bg-white mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider border-b-2 border-slate-900">
                    <th className="py-4 px-4 text-center w-16">Puesto</th>
                    <th className="py-4 px-6">Estudiante / Alumno</th>
                    <th className="py-4 px-6">Universidad de Destino</th>
                    <th className="py-4 px-4 text-center">Correctas</th>
                    <th className="py-4 px-4 text-center">Nota (Escala 20)</th>
                    <th className="py-4 px-6 text-center">Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 font-bold text-sm text-slate-800">
                  {filteredRanking.length > 0 ? (
                    filteredRanking.map((result, index) => {
                      const position = index + 1;
                      
                      // Medals styling for top 3
                      let rankBadge = `${position}°`;
                      if (position === 1) rankBadge = "🥇 1°";
                      if (position === 2) rankBadge = "🥈 2°";
                      if (position === 3) rankBadge = "🥉 3°";

                      const dateFormatted = new Date(result.timestamp).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      });

                      return (
                        <tr 
                          key={result.id} 
                          className={`hover:bg-slate-50 transition-colors
                            ${position === 1 ? 'bg-amber-50/40' : ''}
                            ${position === 2 ? 'bg-slate-50/20' : ''}
                            ${position === 3 ? 'bg-orange-50/20' : ''}
                          `}
                        >
                          <td className="py-4 px-4 text-center border-r-2 border-slate-100">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-block
                              ${position === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' : ''}
                              ${position === 2 ? 'bg-slate-100 text-slate-800 border border-slate-300' : ''}
                              ${position === 3 ? 'bg-orange-100 text-orange-800 border border-orange-300' : ''}
                              ${position > 3 ? 'text-slate-500' : ''}
                            `}>
                              {rankBadge}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-900">
                            <div className="font-extrabold">{result.fullName}</div>
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-semibold">{result.university}</td>
                          <td className="py-4 px-4 text-center text-slate-600">
                            <span className="bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-black text-slate-700">
                              {result.score} / {result.totalQuestions}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center border-l-2 border-r-2 border-slate-100">
                            <span className={`px-3 py-1.5 rounded-xl text-sm font-black inline-block border-2
                              ${result.grade >= 11 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}>
                              {result.grade.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center text-slate-400 font-medium text-xs">
                            {dateFormatted}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 px-6 text-center text-slate-400 font-bold">
                        <p className="text-3xl mb-2">📭</p>
                        <p>No se encontraron resultados de exámenes registrados.</p>
                        {searchTerm && <p className="text-xs text-slate-300 mt-1">Intenta ajustando los términos de búsqueda.</p>}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <button
              onClick={() => {
                // Clear the hash from navigation to exit admin view
                window.location.hash = '';
                setStep('login');
              }}
              className="px-6 py-3 font-black border-3 border-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 hover:shadow-[3px_3px_0_0_rgba(15,23,42,1)] hover:translate-y-[-1px] hover:translate-x-[-1px] transition-all cursor-pointer text-sm"
            >
              ⬅️ Salir de Consola y Volver a Exámenes
            </button>
            
            <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1">
              🔒 Acceso restringido. Usa la ruta <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">/rankind</code> o <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">#rankind</code> para ingresar.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;