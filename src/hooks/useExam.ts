import { useState, useCallback } from 'react';
import { type Question } from '../types';

export const useExam = (questions: Question[]) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});

    const handleSelectOption = useCallback((questionId: string, optionIndex: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    }, []);

    const nextQuestion = useCallback(() => {
        if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
    }, [currentIndex, questions.length]);

    const prevQuestion = useCallback(() => {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
    }, [currentIndex]);

    const calculateScore = useCallback(() => {
        let score = 0;
        questions.forEach((q) => {
            if (answers[q.id] === q.correctOptionIndex) score += 1;
        });
        return score;
    }, [answers, questions]);

    return {
        currentQuestion: questions[currentIndex],
        currentIndex,
        isFirst: currentIndex === 0,
        isLast: currentIndex === questions.length - 1,
        answers,
        handleSelectOption,
        nextQuestion,
        prevQuestion,
        calculateScore,
    };
};