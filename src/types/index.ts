export interface Question {
    id: string;
    imageUrl: string;
    options: string[];
    correctOptionIndex: number;
}

export interface Student {
    fullName: string;
    university: string;
}

export interface ExamResult extends Student {
    id: string;
    score: number; // número de aciertos (e.g., 25 de 30)
    grade: number; // nota en escala vigesimal (0 a 20, e.g., 16.67)
    totalQuestions: number;
    timestamp: number;
}