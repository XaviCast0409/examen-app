import React from 'react';
import { type Question } from '../types';

interface QuizProps {
    question: Question;
    currentIndex: number;
    total: number;
    selectedOption?: number;
    onSelect: (qId: string, oIndex: number) => void;
    onNext: () => void;
    onPrev: () => void;
    onFinish: () => void;
    isFirst: boolean;
    isLast: boolean;
    totalAnswered: number;
}

export const Quiz: React.FC<QuizProps> = ({
    question, currentIndex, total, selectedOption,
    onSelect, onNext, onPrev, onFinish, isFirst, isLast, totalAnswered
}) => {
    const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

    return (
        <div className="w-full max-w-3xl mx-auto bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_rgba(15,23,42,1)] p-6 md:p-8 rounded-2xl transition-all duration-300">
            {/* Header: Progress and indicators */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b-3 border-slate-900">
                <div>
                    <span className="bg-yellow-300 text-slate-900 text-xs font-extrabold uppercase px-3 py-1 border-2 border-slate-900 rounded-full tracking-wider neo-brutalism-shadow-sm">
                        Simulacro en Curso
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2 tracking-tight">
                        Pregunta {currentIndex + 1} <span className="text-slate-400 font-normal">/ {total}</span>
                    </h2>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase">Resueltas</p>
                        <p className="text-lg font-black text-indigo-600">{totalAnswered} <span className="text-slate-400 font-bold text-sm">de {total}</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-3 border-slate-900 bg-indigo-100 flex items-center justify-center font-black text-slate-900 text-sm shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
                        {Math.round((totalAnswered / total) * 100)}%
                    </div>
                </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                    <span>Inicio</span>
                    <span>Progreso del Examen: {progressPercent}%</span>
                    <span>Final</span>
                </div>
                <div className="w-full bg-slate-100 h-5 border-3 border-slate-900 rounded-full overflow-hidden p-0.5 shadow-[inner_2px_2px_0_0_rgba(0,0,0,0.1)]">
                    <div 
                        className="bg-indigo-500 h-full border-r-2 border-slate-900 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Problem Image Container */}
            <div className="mb-8 bg-white border-4 border-slate-900 rounded-2xl p-4 md:p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,0.08)] flex flex-col items-center justify-center min-h-[300px]">
                <span className="self-start mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block animate-pulse-subtle"></span>
                    Gráfico / Enunciado del Problema
                </span>
                
                <div className="w-full overflow-auto flex justify-center py-2 max-h-[380px] rounded-lg">
                    <img
                        src={question.imageUrl}
                        alt={`Problema matemático o pregunta número ${currentIndex + 1}`}
                        className="max-h-[340px] w-auto object-contain hover:scale-102 transition-transform duration-300"
                        loading="eager"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400/f8fafc/0f172a?text=Error+al+cargar+problema+" + (currentIndex + 1);
                        }}
                    />
                </div>
            </div>

            {/* Options Header */}
            <div className="mb-4">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <span className="bg-purple-300 text-slate-900 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-black">?</span>
                    Selecciona tu respuesta:
                </h3>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                {question.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const letter = String.fromCharCode(65 + index);
                    
                    return (
                        <button
                            key={index}
                            onClick={() => onSelect(question.id, index)}
                            className={`p-4 font-bold border-3 border-slate-900 rounded-xl transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer min-h-[72px]
                                ${isSelected
                                    ? 'bg-indigo-500 text-white shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform translate-y-[-2px] translate-x-[-2px]'
                                    : 'bg-white text-slate-800 hover:bg-slate-50 hover:shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-0 active:translate-x-0'
                                }`}
                        >
                            <span className={`w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-base font-black mb-1
                                ${isSelected 
                                    ? 'bg-white text-indigo-600' 
                                    : 'bg-slate-100 text-slate-900'
                                }`}>
                                {letter}
                            </span>
                            
                            {/* If the option string is not just a letter, render it */}
                            {option !== letter && (
                                <span className="text-sm mt-1">{option}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Navigation Bar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t-3 border-slate-900">
                <button
                    onClick={onPrev}
                    disabled={isFirst}
                    className="px-6 py-3 font-black border-3 border-slate-900 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                        bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-0 active:translate-x-0"
                >
                    ← Pregunta Anterior
                </button>

                {isLast ? (
                    <button
                        onClick={onFinish}
                        className="px-8 py-3 bg-emerald-400 text-slate-900 font-black border-3 border-slate-900 rounded-xl shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:bg-emerald-500 hover:shadow-[6px_6px_0_0_rgba(15,23,42,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-0 active:translate-x-0 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        🏆 Finalizar y Ver Puntaje
                    </button>
                ) : (
                    <button
                        onClick={onNext}
                        className="px-8 py-3 bg-indigo-400 text-slate-900 font-black border-3 border-slate-900 rounded-xl shadow-[4px_4px_0_0_rgba(15,23,42,1)] hover:bg-indigo-500 hover:shadow-[6px_6px_0_0_rgba(15,23,42,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-0 active:translate-x-0 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        Siguiente Pregunta →
                    </button>
                )}
            </div>
        </div>
    );
};