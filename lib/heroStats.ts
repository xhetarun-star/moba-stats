import { Match, PlayerStats, HERO_ROLES, Role } from './types';
import { SeasonKey, getSeason } from './season';

export type Side = 'xhelo' | 'j9' | 'nero';

export const SIDES: Side[] = ['xhelo', 'j9', 'nero'];

export const SIDE_LABEL: Record<Side, string> = {
    xhelo: 'XHELO',
    j9: 'J9',
    nero: 'NERO'
};

export const SIDE_COLOR: Record<Side, string> = {
    xhelo: 'var(--dbz-orange)',
    j9: 'var(--dbz-blue)',
    nero: 'var(--dbz-purple)'
};

export const SIDE_HEX: Record<Side, string> = {
    xhelo: '#ff5722',
    j9: '#00e5ff',
    nero: '#a855f7'
};

export const getSideStats = (m: Match, side: Side): PlayerStats | undefined => {
    if (side === 'xhelo') return m.userStats;
    if (side === 'j9') return m.mateStats;
    return m.neroStats;
};

export interface HeroLine {
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    winrate: number;
    kda: number;
    kpg: number;
    dpg: number;
    apg: number;
    mastery: number;
}

export const EMPTY_LINE: HeroLine = {
    games: 0, wins: 0, kills: 0, deaths: 0, assists: 0,
    winrate: 0, kda: 0, kpg: 0, dpg: 0, apg: 0, mastery: 0
};

/**
 * Score de maîtrise sur 100 :
 *  - 60 pts de winrate
 *  - 40 pts de KDA (plafonné à 4.0)
 *  - pondéré par la confiance liée au volume de parties (100% à partir de 10 combats)
 */
export const masteryScore = (winrate: number, kda: number, games: number): number => {
    if (games === 0) return 0;
    const base = (winrate / 100) * 60 + Math.min(kda / 4, 1) * 40;
    const confidence = 0.55 + 0.45 * Math.min(1, games / 10);
    return base * confidence;
};

export const buildLine = (raw: { games: number; wins: number; kills: number; deaths: number; assists: number }): HeroLine => {
    const { games, wins, kills, deaths, assists } = raw;
    if (games === 0) return { ...EMPTY_LINE };
    const winrate = (wins / games) * 100;
    const kda = (kills + assists) / Math.max(1, deaths);
    return {
        games, wins, kills, deaths, assists,
        winrate,
        kda,
        kpg: kills / games,
        dpg: deaths / games,
        apg: assists / games,
        mastery: masteryScore(winrate, kda, games)
    };
};

/** Stats d'un joueur sur un héros (hero = null → tous héros confondus) */
export const computeLine = (matches: Match[], side: Side, hero?: string | null): HeroLine => {
    let games = 0, wins = 0, kills = 0, deaths = 0, assists = 0;
    matches.forEach(m => {
        const s = getSideStats(m, side);
        if (!s) return;
        if (hero && s.hero !== hero) return;
        games++;
        kills += s.kills;
        deaths += s.deaths;
        assists += s.assists;
        if (m.result === 'Win') wins++;
    });
    return buildLine({ games, wins, kills, deaths, assists });
};

/** Stats par saison d'un joueur sur un héros */
export const computeBySeason = (matches: Match[], side: Side, hero?: string | null): Record<SeasonKey, HeroLine> => {
    const acc: Record<string, { games: number; wins: number; kills: number; deaths: number; assists: number }> = {};
    matches.forEach(m => {
        const s = getSideStats(m, side);
        if (!s) return;
        if (hero && s.hero !== hero) return;
        const season = getSeason(m.date);
        if (!acc[season]) acc[season] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
        acc[season].games++;
        acc[season].kills += s.kills;
        acc[season].deaths += s.deaths;
        acc[season].assists += s.assists;
        if (m.result === 'Win') acc[season].wins++;
    });
    return {
        s1: acc.s1 ? buildLine(acc.s1) : { ...EMPTY_LINE },
        s2: acc.s2 ? buildLine(acc.s2) : { ...EMPTY_LINE },
        s3: acc.s3 ? buildLine(acc.s3) : { ...EMPTY_LINE },
        s4: acc.s4 ? buildLine(acc.s4) : { ...EMPTY_LINE }
    };
};

/** Tous les héros réellement présents dans la base + ceux du référentiel */
export const collectHeroes = (matches: Match[]): string[] => {
    const set = new Set<string>(Object.keys(HERO_ROLES));
    matches.forEach(m => {
        set.add(m.userStats.hero);
        set.add(m.mateStats.hero);
        if (m.neroStats) set.add(m.neroStats.hero);
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'));
};

export const heroRole = (matches: Match[], hero: string): Role | 'Inconnu' => {
    if (HERO_ROLES[hero]) return HERO_ROLES[hero];
    for (const m of matches) {
        if (m.userStats.hero === hero) return m.userStats.role;
        if (m.mateStats.hero === hero) return m.mateStats.role;
        if (m.neroStats?.hero === hero) return m.neroStats.role;
    }
    return 'Inconnu';
};
