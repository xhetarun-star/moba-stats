import { Match } from './types';

// These functions now trigger API calls to the shared database
// but also keep a local cache for performance.

export const fetchMatches = async (): Promise<Match[]> => {
    try {
        const res = await fetch('/api/initial-stats');
        if (!res.ok) throw new Error('Failed to fetch');
        return await res.json();
    } catch (err) {
        console.error('Storage fetch error:', err);
        return [];
    }
};

export const saveMatchesToDB = async (matches: Match[]) => {
    try {
        await fetch('/api/initial-stats', {
            method: 'POST',
            body: JSON.stringify({ matches }),
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Storage save error:', err);
    }
};

// Legacy for compatibility during migration
export const getMatchesFromStorage = (): Match[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('moba_stats_matches');
    return stored ? JSON.parse(stored) : [];
};
