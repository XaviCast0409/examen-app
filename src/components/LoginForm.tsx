import React, { useState } from 'react';
import { type Student } from '../types';

interface LoginFormProps {
  onStart: (student: Student) => void;
  totalQuestions: number;
}

// Validates full name strictly (minimum 1 first name and 2 last names -> at least 3 words)
const validateFullName = (name: string): boolean => {
  const trimmed = name.trim();
  if (!trimmed) return false;

  // Filter words to ensure they are real words (at least 2 letters, ignoring initials)
  const words = trimmed.split(/\s+/).filter((w) => w.length >= 2);

  return words.length >= 3;
};

export const LoginForm: React.FC<LoginFormProps> = ({ onStart, totalQuestions }) => {
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFullName(val);

    if (val.trim() === '') {
      setNameError(null);
    } else {
      const isValid = validateFullName(val);
      if (!isValid) {
        setNameError(
          'Ingresa tu nombre completo (mínimo 1 nombre y 2 apellidos, Ej: "Juan Carlos Pérez Gómez")'
        );
      } else {
        setNameError(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim() && university.trim()) {
      if (!validateFullName(fullName)) {
        setNameError('Nombre inválido. Debes escribir al menos 1 nombre y 2 apellidos.');
        return;
      }
      setNameError(null);
      onStart({ fullName: fullName.trim(), university: university.trim() });
    }
  };

  const isFormInvalid =
    !!nameError || !fullName.trim() || !university.trim();

  return (
    <form
      onSubmit={handleSubmit}
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
              ${
                nameError
                  ? 'border-rose-400 focus:border-rose-500 text-rose-900 bg-rose-50/50'
                  : 'border-slate-900 focus:border-indigo-600 focus:shadow-[4px_4px_0_0_rgba(79,70,229,1)]'
              }`}
            value={fullName}
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
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-400 font-semibold">
            Escribe la universidad de tu interés.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isFormInvalid}
        className="w-full py-4 text-center bg-indigo-500 text-white font-black border-3 border-slate-900 rounded-xl shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:bg-indigo-600 hover:shadow-[6px_6px_0_0_rgba(15,23,42,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-0 active:translate-x-0 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-lg flex items-center justify-center gap-2"
      >
        ⚡ COMENZAR EXAMEN AHORA
      </button>

      <div className="mt-6 text-center border-t-2 border-dashed border-slate-200 pt-4 flex justify-between items-center text-xs font-bold text-slate-400">
        <span>Total: {totalQuestions} Preguntas</span>
        <span>Escala: 0 a 20 Puntos</span>
      </div>
    </form>
  );
};
