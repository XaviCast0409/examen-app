import React from 'react';
import { type ExamResult } from '../types';

interface IndividualResultProps {
  result: ExamResult;
  googleScriptUrl: string;
  onReset: () => void;
}

export const IndividualResult: React.FC<IndividualResultProps> = ({
  result,
  googleScriptUrl,
  onReset,
}) => {
  return (
    <div className="w-full max-w-xl bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0_0_rgba(15,23,42,1)] rounded-3xl text-center">
      <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-4 py-1.5 border-2 border-emerald-950 rounded-full tracking-wider inline-block mb-4">
        ¡Examen Completado Exitosamente!
      </span>

      <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">
        Tu Calificación
      </h2>
      <p className="text-slate-500 font-bold text-lg mb-6">{result.fullName}</p>

      {/* Main Grade Circle */}
      <div className="w-48 h-48 rounded-full border-4 border-slate-900 bg-indigo-50 mx-auto flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(15,23,42,1)] mb-6 animate-pulse-subtle">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
          Nota Final
        </span>
        <span className="text-5xl font-black text-indigo-600 my-1">
          {result.grade.toFixed(2)}
        </span>
        <span className="text-xs font-bold text-slate-400">sobre 20.00</span>
      </div>

      {/* Quick Stat Badges */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 p-4 border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
          <p className="text-xs font-black text-slate-400 uppercase">Correctas</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {result.score}{' '}
            <span className="text-sm text-slate-400 font-bold">
              / {result.totalQuestions}
            </span>
          </p>
        </div>

        <div className="bg-slate-50 p-4 border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
          <p className="text-xs font-black text-slate-400 uppercase">Postulación</p>
          <p
            className="text-sm font-black text-indigo-600 truncate mt-2 px-1"
            title={result.university}
          >
            {result.university}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded-xl text-amber-900 text-sm font-bold flex items-center gap-2 justify-center neo-brutalism-shadow-sm">
          <span>{googleScriptUrl.trim() ? '☁️' : '💾'}</span>
          {googleScriptUrl.trim()
            ? '¡Puntaje enviado a la base de datos en la nube y guardado localmente!'
            : 'Su puntaje ha sido registrado en la base de datos de esta máquina.'}
        </div>

        <button
          onClick={onReset}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black border-3 border-slate-900 rounded-xl shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-0 active:translate-x-0 transition-all cursor-pointer"
        >
          🔄 REGISTRAR NUEVO ALUMNO
        </button>
      </div>
    </div>
  );
};
