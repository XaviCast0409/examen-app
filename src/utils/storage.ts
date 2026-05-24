import { type ExamResult } from '../types';

/**
 * Reads results from LocalStorage safely with fallback.
 */
export const getResultsFromLocalStorage = (): ExamResult[] => {
  try {
    const resultsJson = localStorage.getItem('simulacro_results');
    return resultsJson ? JSON.parse(resultsJson) : [];
  } catch (e) {
    console.error('Error reading from localStorage', e);
    return [];
  }
};

/**
 * Saves a single exam result to LocalStorage, preventing duplicate entries within 5 seconds.
 */
export const saveResultToLocalStorage = (result: ExamResult) => {
  try {
    const existingResults = getResultsFromLocalStorage();

    // Prevent duplicate entries of the exact same submission in quick succession (5 seconds)
    const isDuplicate = existingResults.some(
      (r) =>
        r.fullName.toLowerCase() === result.fullName.toLowerCase() &&
        r.university.toLowerCase() === result.university.toLowerCase() &&
        Math.abs(r.timestamp - result.timestamp) < 5000
    );

    if (!isDuplicate) {
      existingResults.push(result);
      localStorage.setItem('simulacro_results', JSON.stringify(existingResults));
    }
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
};
