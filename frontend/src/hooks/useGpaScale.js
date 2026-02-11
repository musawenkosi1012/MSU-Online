import { useState, useCallback } from 'react';

/**
 * Hook to manage GPA display and calculation logic.
 * Standardizes the 4.0 scale conversion across the app.
 */
export const useGpaScale = () => {
    const convertToPoints = useCallback((score) => {
        // Score is 0-100 or 0.0-1.0
        const normalized = score > 1 ? score / 100 : score;

        if (normalized >= 0.90) return 4.0;
        if (normalized >= 0.80) return 3.0;
        if (normalized >= 0.70) return 2.0;
        if (normalized >= 0.60) return 1.0;
        return 0.0;
    }, []);

    const formatGpa = useCallback((gpa) => {
        return Number(gpa).toFixed(2);
    }, []);

    const getGradeLabel = useCallback((score) => {
        const normalized = score > 1 ? score / 100 : score;
        if (normalized >= 0.90) return 'A';
        if (normalized >= 0.80) return 'B';
        if (normalized >= 0.70) return 'C';
        if (normalized >= 0.60) return 'D';
        return 'F';
    }, []);

    return {
        convertToPoints,
        formatGpa,
        getGradeLabel
    };
};
