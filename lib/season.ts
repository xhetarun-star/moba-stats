export type SeasonKey = 's1' | 's2' | 's3' | 's4';
export type SeasonFilter = 'all' | SeasonKey;

// Heure locale pour éviter les décalages autour de minuit
export const SEASON_2_START = new Date('2026-03-18T00:00:00');
export const SEASON_3_START = new Date('2026-05-10T00:00:00');
export const SEASON_4_START = new Date('2026-07-01T00:00:00');

export const SEASONS: SeasonKey[] = ['s1', 's2', 's3', 's4'];

export const SEASON_LABELS: Record<SeasonKey, string> = {
    s1: 'Saison 1',
    s2: 'Saison 2',
    s3: 'Saison 3',
    s4: 'Saison 4'
};

export const SEASON_SHORT: Record<SeasonKey, string> = {
    s1: 'S1',
    s2: 'S2',
    s3: 'S3',
    s4: 'S4'
};

export const getSeason = (dateStr: string): SeasonKey => {
    // Les imports historiques sont au format JJ/MM/AAAA : ils appartiennent à la Saison 1
    if (!dateStr || !dateStr.includes('-')) return 's1';
    const d = new Date(dateStr);
    if (d >= SEASON_4_START) return 's4';
    if (d >= SEASON_3_START) return 's3';
    if (d >= SEASON_2_START) return 's2';
    return 's1';
};
