import { Trophy, Medal, Star, Shield } from 'lucide-react';

/**
 * Returns badge details based on mastery percentage (0-100)
 */
export const getMasteryBadge = (mastery) => {
    if (mastery >= 90) return {
        label: 'Master',
        color: '#10B981', // Emerald
        bg: '#ECFDF5',
        icon: Trophy,
        description: 'Elite competence and deep understanding'
    };
    if (mastery >= 60) return {
        label: 'Scholar',
        color: '#4F46E5', // Indigo
        bg: '#EEF2FF',
        icon: Medal,
        description: 'Advanced knowledge and consistent performance'
    };
    if (mastery >= 30) return {
        label: 'Apprentice',
        color: '#F97316', // Orange
        bg: '#FFF7ED',
        icon: Star,
        description: 'Building foundational skills'
    };
    return {
        label: 'Novice',
        color: '#64748B', // Slate
        bg: '#F8FAFC',
        icon: Shield,
        description: 'Beginning the learning journey'
    };
};
