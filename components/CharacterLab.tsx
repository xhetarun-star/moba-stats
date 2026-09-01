'use client';

import React, { useMemo, useState } from 'react';
import { Match, Role } from '../lib/types';
import { SeasonFilter, SeasonKey, SEASONS, SEASON_LABELS, SEASON_SHORT, getSeason } from '../lib/season';
import {
    Side, SIDES, SIDE_LABEL, SIDE_COLOR, SIDE_HEX,
    HeroLine, EMPTY_LINE, computeLine, computeBySeason, collectHeroes, heroRole
} from '../lib/heroStats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Search, Crown, Filter, X, Users, Sword, Shield, Heart, Trophy, Calendar, BarChart3, Sparkles } from 'lucide-react';
import MasteryNexus from './MasteryNexus';

interface Props {
    matches: Match[];
}

interface HeroRow {
    hero: string;
    role: Role | 'Inconnu';
    total: number;
    lines: Record<Side, HeroLine>;
    master: Side | null;
    contested: boolean;
}

const ROLE_ICON = (role: string) => {
    if (role.startsWith('Attaq')) return <Sword size={13} />;
    if (role.startsWith('Défens')) return <Shield size={13} />;
    if (role.startsWith('Sout')) return <Heart size={13} />;
    return <Users size={13} />;
};

const ROLE_BADGE = (role: string) => {
    if (role.startsWith('Attaq')) return 'badge badge-attacker';
    if (role.startsWith('Défens')) return 'badge badge-defender';
    return 'badge badge-support';
};

const pct = (n: number) => `${n.toFixed(0)}%`;

interface ChartTooltipProps {
    active?: boolean;
    payload?: { payload: Record<string, number> }[];
    label?: string;
    sides?: Side[];
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label, sides = [] }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: 'rgba(10,10,15,0.95)', border: '1px solid var(--dbz-gold)', borderRadius: '12px',
            padding: '0.9rem 1.1rem', backdropFilter: 'blur(10px)', minWidth: '210px'
        }}>
            <div className="font-orbitron" style={{ color: 'var(--dbz-gold)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.6rem' }}>{label}</div>
            {sides.map(side => (
                <div key={side} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: SIDE_COLOR[side], fontWeight: 800 }}>{SIDE_LABEL[side]}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {d[`${side}_games`] === 0
                            ? 'jamais joué'
                            : `${pct(d[`${side}_wr`])} WR · ${d[`${side}_kda`].toFixed(2)} KDA · ${d[`${side}_games`]}G`}
                    </span>
                </div>
            ))}
        </div>
    );
};

const CharacterLab: React.FC<Props> = ({ matches }) => {
    const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('all');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
    const [selected, setSelected] = useState<string[]>([]);
    const [minGames, setMinGames] = useState(1);
    const [onlyPlayed, setOnlyPlayed] = useState(true);
    const [chartMetric, setChartMetric] = useState<'winrate' | 'kda' | 'games'>('winrate');
    const [sortKey, setSortKey] = useState<'total' | 'name' | 'xhelo' | 'j9' | 'nero' | 'gap'>('total');
    const [nexus, setNexus] = useState<{ hero: string; player: Side } | null>(null);

    const scoped = useMemo(
        () => (seasonFilter === 'all' ? matches : matches.filter(m => getSeason(m.date) === seasonFilter)),
        [matches, seasonFilter]
    );

    const hasNero = useMemo(() => scoped.some(m => m.neroStats), [scoped]);
    const activeSides: Side[] = useMemo(() => (hasNero ? SIDES : (['xhelo', 'j9'] as Side[])), [hasNero]);

    const heroes = useMemo(() => collectHeroes(matches), [matches]);

    const rows: HeroRow[] = useMemo(() => {
        return heroes.map(hero => {
            const lines = {
                xhelo: computeLine(scoped, 'xhelo', hero),
                j9: computeLine(scoped, 'j9', hero),
                nero: computeLine(scoped, 'nero', hero)
            } as Record<Side, HeroLine>;

            const eligible = activeSides.filter(s => lines[s].games >= Math.max(1, minGames));
            let master: Side | null = null;
            let contested = false;
            if (eligible.length > 0) {
                const sorted = [...eligible].sort((a, b) => lines[b].mastery - lines[a].mastery);
                master = sorted[0];
                contested = sorted.length > 1 && Math.abs(lines[sorted[0]].mastery - lines[sorted[1]].mastery) < 3;
            }

            return {
                hero,
                role: heroRole(matches, hero),
                total: activeSides.reduce((acc, s) => acc + lines[s].games, 0),
                lines,
                master,
                contested
            };
        });
    }, [heroes, scoped, matches, minGames, activeSides]);

    const rowByHero = useMemo(() => {
        const map: Record<string, HeroRow> = {};
        rows.forEach(r => { map[r.hero] = r; });
        return map;
    }, [rows]);

    const visibleRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = rows.filter(r => {
            if (onlyPlayed && r.total === 0) return false;
            if (roleFilter !== 'all' && r.role !== roleFilter) return false;
            if (q && !r.hero.toLowerCase().includes(q)) return false;
            return true;
        });
        const sorters: Record<string, (a: HeroRow, b: HeroRow) => number> = {
            total: (a, b) => b.total - a.total || a.hero.localeCompare(b.hero, 'fr'),
            name: (a, b) => a.hero.localeCompare(b.hero, 'fr'),
            xhelo: (a, b) => b.lines.xhelo.mastery - a.lines.xhelo.mastery,
            j9: (a, b) => b.lines.j9.mastery - a.lines.j9.mastery,
            nero: (a, b) => b.lines.nero.mastery - a.lines.nero.mastery,
            gap: (a, b) =>
                Math.abs(b.lines.xhelo.mastery - b.lines.j9.mastery) -
                Math.abs(a.lines.xhelo.mastery - a.lines.j9.mastery)
        };
        return [...filtered].sort(sorters[sortKey]);
    }, [rows, search, roleFilter, onlyPlayed, sortKey]);

    const toggleHero = (hero: string) =>
        setSelected(prev => (prev.includes(hero) ? prev.filter(h => h !== hero) : [...prev, hero]));

    const selectTopPlayed = () =>
        setSelected([...rows].sort((a, b) => b.total - a.total).slice(0, 10).map(r => r.hero));

    // --- Agrégats de la sélection ---
    const selectionRows = useMemo(
        () => selected.map(h => rowByHero[h]).filter(Boolean),
        [selected, rowByHero]
    );

    const selectionTotals = useMemo(() => {
        const totals: Record<Side, HeroLine> = { xhelo: { ...EMPTY_LINE }, j9: { ...EMPTY_LINE }, nero: { ...EMPTY_LINE } };
        if (selected.length === 0) return totals;
        SIDES.forEach(side => {
            const sub = scoped.filter(m => {
                const s = side === 'xhelo' ? m.userStats : side === 'j9' ? m.mateStats : m.neroStats;
                return !!s && selected.includes(s.hero);
            });
            totals[side] = computeLine(sub, side);
        });
        return totals;
    }, [scoped, selected]);

    const masterCount = useMemo(() => {
        const counts: Record<string, number> = { xhelo: 0, j9: 0, nero: 0 };
        selectionRows.forEach(r => { if (r.master) counts[r.master]++; });
        return counts;
    }, [selectionRows]);

    // --- Données du graphique ---
    const chartData = useMemo(() => {
        const metricOf = (line: HeroLine) =>
            chartMetric === 'winrate' ? line.winrate : chartMetric === 'kda' ? line.kda : line.games;

        if (selectionRows.length === 1) {
            const hero = selectionRows[0].hero;
            return SEASONS.map(season => {
                const seasonMatches = matches.filter(m => getSeason(m.date) === season);
                const entry: Record<string, string | number> = { label: SEASON_LABELS[season] };
                SIDES.forEach(side => {
                    const line = computeLine(seasonMatches, side, hero);
                    entry[side] = Number(metricOf(line).toFixed(2));
                    entry[`${side}_games`] = line.games;
                    entry[`${side}_wr`] = line.winrate;
                    entry[`${side}_kda`] = line.kda;
                });
                return entry;
            }).filter(e => SIDES.some(s => (e[`${s}_games`] as number) > 0));
        }
        return selectionRows.map(r => {
            const entry: Record<string, string | number> = { label: r.hero.length > 14 ? `${r.hero.slice(0, 13)}…` : r.hero };
            SIDES.forEach(side => {
                entry[side] = Number(metricOf(r.lines[side]).toFixed(2));
                entry[`${side}_games`] = r.lines[side].games;
                entry[`${side}_wr`] = r.lines[side].winrate;
                entry[`${side}_kda`] = r.lines[side].kda;
            });
            return entry;
        });
    }, [selectionRows, chartMetric, matches]);

    const MasterBadge = ({ row, compact }: { row: HeroRow; compact?: boolean }) => {
        if (!row.master) return <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>—</span>;
        const color = SIDE_COLOR[row.master];
        return (
            <span className="font-orbitron" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                color, fontWeight: 900, fontSize: compact ? '0.7rem' : '0.8rem',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}`,
                borderRadius: '8px', padding: '0.2rem 0.55rem', whiteSpace: 'nowrap'
            }}>
                <Crown size={12} /> {SIDE_LABEL[row.master]}{row.contested ? ' (serré)' : ''}
            </span>
        );
    };

    const SideCell = ({ line, side, best }: { line: HeroLine; side: Side; best: boolean }) => {
        if (line.games === 0) return <span style={{ color: 'var(--text-secondary)', opacity: 0.5, fontSize: '0.75rem' }}>—</span>;
        return (
            <div style={{ lineHeight: 1.25 }}>
                <span className="font-orbitron" style={{
                    fontWeight: 900, fontSize: '0.9rem',
                    color: best ? SIDE_COLOR[side] : 'var(--foreground)',
                    textShadow: best ? `0 0 10px ${SIDE_HEX[side]}55` : 'none'
                }}>
                    {pct(line.winrate)}
                </span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    {line.kda.toFixed(2)} KDA · {line.games}G
                </div>
            </div>
        );
    };

    const controlBtn = (active: boolean): React.CSSProperties => ({
        background: active ? 'linear-gradient(135deg, var(--dbz-orange), var(--dbz-gold))' : 'rgba(255,255,255,0.05)',
        color: active ? '#000' : 'var(--text-secondary)',
        border: active ? '1px solid var(--dbz-gold)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', padding: '0.45rem 0.85rem', fontSize: '0.72rem', fontWeight: 800,
        cursor: 'pointer', fontFamily: 'Orbitron', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        transition: 'all 0.2s'
    });

    return (
        <div>
            {/* ---------- CONTRÔLES ---------- */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 280px' }}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Chercher un personnage..."
                            style={{
                                flex: 1, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', padding: '0.7rem 1rem', color: 'var(--foreground)',
                                outline: 'none', fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <select
                        value={seasonFilter}
                        onChange={e => setSeasonFilter(e.target.value as SeasonFilter)}
                        className="font-orbitron"
                        style={{
                            background: 'rgba(0,0,0,0.4)', color: 'var(--dbz-blue)', border: '1px solid rgba(0,229,255,0.3)',
                            padding: '0.6rem 1rem', borderRadius: '12px', fontWeight: 800, textTransform: 'uppercase',
                            outline: 'none', cursor: 'pointer', fontSize: '0.75rem'
                        }}
                    >
                        <option value="all">Toutes saisons</option>
                        {SEASONS.map(s => <option key={s} value={s}>{SEASON_LABELS[s]}</option>)}
                    </select>

                    <select
                        value={minGames}
                        onChange={e => setMinGames(Number(e.target.value))}
                        className="font-orbitron"
                        style={{
                            background: 'rgba(0,0,0,0.4)', color: 'var(--dbz-gold)', border: '1px solid rgba(255,193,7,0.3)',
                            padding: '0.6rem 1rem', borderRadius: '12px', fontWeight: 800, textTransform: 'uppercase',
                            outline: 'none', cursor: 'pointer', fontSize: '0.75rem'
                        }}
                        title="Nombre minimum de combats pour être éligible au titre de maître"
                    >
                        <option value={1}>Maîtrise dès 1 combat</option>
                        <option value={3}>Maîtrise dès 3 combats</option>
                        <option value={5}>Maîtrise dès 5 combats</option>
                        <option value={10}>Maîtrise dès 10 combats</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.1rem', alignItems: 'center' }}>
                    <button style={controlBtn(roleFilter === 'all')} onClick={() => setRoleFilter('all')}>
                        <Users size={13} /> Tous rôles
                    </button>
                    {(['Attaquant', 'Défenseur', 'Soutien'] as Role[]).map(r => (
                        <button key={r} style={controlBtn(roleFilter === r)} onClick={() => setRoleFilter(r)}>
                            {ROLE_ICON(r)} {r}
                        </button>
                    ))}
                    <div style={{ width: '1px', height: '24px', background: 'var(--card-border)', margin: '0 0.3rem' }} />
                    <button style={controlBtn(onlyPlayed)} onClick={() => setOnlyPlayed(!onlyPlayed)}>
                        <Filter size={13} /> {onlyPlayed ? 'Joués uniquement' : 'Roster complet'}
                    </button>
                    <button style={controlBtn(false)} onClick={selectTopPlayed}>
                        <Trophy size={13} /> Top 10 joués
                    </button>
                    <button style={controlBtn(false)} onClick={() => setSelected(visibleRows.map(r => r.hero))}>
                        Tout sélectionner
                    </button>
                    {selected.length > 0 && (
                        <button style={controlBtn(false)} onClick={() => setSelected([])}>
                            <X size={13} /> Effacer ({selected.length})
                        </button>
                    )}
                </div>
            </div>

            {/* ---------- SÉLECTEUR DE PERSONNAGES ---------- */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 className="font-orbitron" style={{ fontSize: '0.95rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <Sparkles size={18} color="var(--dbz-gold)" />
                    Choisis tes personnages
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>
                        ({visibleRows.length} affichés · {selected.length} sélectionnés)
                    </span>
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {visibleRows.map(r => {
                        const isSel = selected.includes(r.hero);
                        const color = r.master ? SIDE_COLOR[r.master] : 'var(--text-secondary)';
                        return (
                            <button
                                key={r.hero}
                                onClick={() => toggleHero(r.hero)}
                                style={{
                                    background: isSel ? 'rgba(255,193,7,0.12)' : 'rgba(255,255,255,0.03)',
                                    border: isSel ? '1px solid var(--dbz-gold)' : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px', padding: '0.5rem 0.8rem', cursor: 'pointer',
                                    color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.2s'
                                }}
                                title={`${r.total} combats · maître : ${r.master ? SIDE_LABEL[r.master] : 'non déterminé'}`}
                            >
                                <span style={{ color, display: 'flex' }}>{ROLE_ICON(r.role)}</span>
                                {r.hero}
                                <span className="font-orbitron" style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{r.total}</span>
                            </button>
                        );
                    })}
                    {visibleRows.length === 0 && (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                            Aucun personnage ne correspond à ces filtres.
                        </div>
                    )}
                </div>
            </div>

            {/* ---------- ANALYSE DE LA SÉLECTION ---------- */}
            {selectionRows.length > 0 ? (
                <>
                    {/* Verdict global */}
                    <div className="card" style={{ marginBottom: '2rem', borderTop: '2px solid var(--dbz-gold)' }}>
                        <h3 className="font-orbitron" style={{ fontSize: '1rem', textTransform: 'uppercase', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <Trophy size={20} color="var(--dbz-gold)" />
                            Verdict sur {selectionRows.length} personnage{selectionRows.length > 1 ? 's' : ''}
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                · {seasonFilter === 'all' ? 'toutes saisons' : SEASON_LABELS[seasonFilter as SeasonKey]}
                            </span>
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                            {activeSides.map(side => {
                                const line = selectionTotals[side];
                                return (
                                    <div key={side} style={{
                                        padding: '1.2rem', borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${SIDE_HEX[side]}55`
                                    }}>
                                        <div className="font-orbitron" style={{ color: SIDE_COLOR[side], fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                                            {SIDE_LABEL[side]}
                                        </div>
                                        <div className="font-orbitron" style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
                                            {line.games > 0 ? pct(line.winrate) : '—'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {line.kda.toFixed(2)} KDA · {line.games} combats · {line.wins} victoires
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                                            {line.kpg.toFixed(1)} K / {line.dpg.toFixed(1)} D / {line.apg.toFixed(1)} A par combat
                                        </div>
                                        <div style={{
                                            marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.06)',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', color: SIDE_COLOR[side], fontWeight: 800, fontSize: '0.8rem'
                                        }}>
                                            <Crown size={14} /> Meilleur sur {masterCount[side]} / {selectionRows.length} personnages
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Graphique */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.25rem' }}>
                            <h3 className="font-orbitron" style={{ fontSize: '1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <BarChart3 size={20} color="var(--dbz-blue)" />
                                {selectionRows.length === 1 ? `${selectionRows[0].hero} saison par saison` : 'Comparatif de la sélection'}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button style={controlBtn(chartMetric === 'winrate')} onClick={() => setChartMetric('winrate')}>Winrate</button>
                                <button style={controlBtn(chartMetric === 'kda')} onClick={() => setChartMetric('kda')}>KDA</button>
                                <button style={controlBtn(chartMetric === 'games')} onClick={() => setChartMetric('games')}>Combats</button>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: Math.max(300, Math.min(560, chartData.length * 46)) }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                        interval={0}
                                        angle={chartData.length > 6 ? -30 : 0}
                                        textAnchor={chartData.length > 6 ? 'end' : 'middle'}
                                        height={chartData.length > 6 ? 80 : 30}
                                    />
                                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                    <Tooltip content={<ChartTooltip sides={activeSides} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                    {activeSides.map(side => (
                                        <Bar key={side} dataKey={side} name={SIDE_LABEL[side]} fill={SIDE_HEX[side]} radius={[6, 6, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.8rem', fontStyle: 'italic' }}>
                            {selectionRows.length === 1
                                ? 'Ce graphique montre toute la chronologie du personnage, saison par saison (indépendamment du filtre saison).'
                                : 'Sélectionne un seul personnage pour obtenir sa chronologie saison par saison.'}
                        </p>
                    </div>

                    {/* Fiches duel par personnage */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {selectionRows.map((row, idx) => {
                            const bySeason: Record<Side, Record<SeasonKey, HeroLine>> = {
                                xhelo: computeBySeason(matches, 'xhelo', row.hero),
                                j9: computeBySeason(matches, 'j9', row.hero),
                                nero: computeBySeason(matches, 'nero', row.hero)
                            };
                            return (
                                <motion.div
                                    key={row.hero}
                                    className="card"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                                    style={{ borderTop: `2px solid ${row.master ? SIDE_COLOR[row.master] : 'var(--card-border)'}` }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div className="font-orbitron" style={{ fontSize: '1.1rem', fontWeight: 900 }}>{row.hero}</div>
                                            <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span className={ROLE_BADGE(row.role)}>{row.role}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{row.total} combats</span>
                                            </div>
                                        </div>
                                        <MasterBadge row={row} />
                                    </div>

                                    {activeSides.map(side => {
                                        const line = row.lines[side];
                                        const seasons = bySeason[side];
                                        const playedSeasons = SEASONS.filter(s => seasons[s].games > 0);
                                        const bestSeason = playedSeasons.length
                                            ? playedSeasons.reduce((best, s) => (seasons[s].mastery > seasons[best].mastery ? s : best), playedSeasons[0])
                                            : null;
                                        return (
                                            <div
                                                key={side}
                                                onClick={() => line.games > 0 && setNexus({ hero: row.hero, player: side })}
                                                style={{
                                                    padding: '0.8rem 1rem', marginBottom: '0.6rem', borderRadius: '12px',
                                                    background: row.master === side ? `${SIDE_HEX[side]}14` : 'rgba(255,255,255,0.03)',
                                                    border: row.master === side ? `1px solid ${SIDE_COLOR[side]}` : '1px solid rgba(255,255,255,0.06)',
                                                    cursor: line.games > 0 ? 'pointer' : 'default'
                                                }}
                                                title={line.games > 0 ? 'Ouvrir le dossier tactique' : 'Jamais joué sur cette période'}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span className="font-orbitron" style={{ color: SIDE_COLOR[side], fontWeight: 900, fontSize: '0.8rem' }}>
                                                        {SIDE_LABEL[side]}
                                                    </span>
                                                    {line.games === 0 ? (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>jamais joué</span>
                                                    ) : (
                                                        <span style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
                                                            <span className="font-orbitron" style={{ fontWeight: 900, color: line.winrate >= 50 ? 'var(--win-color)' : 'var(--loss-color)' }}>
                                                                {pct(line.winrate)}
                                                            </span>
                                                            <span style={{ fontSize: '0.78rem' }}>{line.kda.toFixed(2)} KDA</span>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{line.games}G</span>
                                                        </span>
                                                    )}
                                                </div>
                                                {line.games > 0 && (
                                                    <>
                                                        <div style={{ marginTop: '0.5rem', height: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                                            <div style={{ width: `${Math.min(100, line.mastery)}%`, height: '100%', background: SIDE_HEX[side] }} />
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                                            <span>Maîtrise {line.mastery.toFixed(0)}/100</span>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                <Calendar size={11} />
                                                                {bestSeason
                                                                    ? `Meilleure : ${SEASON_SHORT[bestSeason]} (${pct(seasons[bestSeason].winrate)} · ${seasons[bestSeason].games}G)`
                                                                    : '—'}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Matrice saisons */}
                                    <div style={{ marginTop: '0.9rem', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                                            <thead>
                                                <tr style={{ color: 'var(--text-secondary)' }}>
                                                    <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem', fontWeight: 700 }}>Saison</th>
                                                    {activeSides.map(s => (
                                                        <th key={s} style={{ textAlign: 'right', padding: '0.3rem 0.4rem', color: SIDE_COLOR[s], fontWeight: 800 }}>
                                                            {SIDE_LABEL[s]}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {SEASONS.filter(s => activeSides.some(side => bySeason[side][s].games > 0)).map(s => (
                                                    <tr key={s} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '0.35rem 0.4rem', fontWeight: 700 }}>{SEASON_LABELS[s]}</td>
                                                        {activeSides.map(side => {
                                                            const l = bySeason[side][s];
                                                            return (
                                                                <td key={side} style={{ padding: '0.35rem 0.4rem', textAlign: 'right', color: l.games === 0 ? 'var(--text-secondary)' : 'var(--foreground)' }}>
                                                                    {l.games === 0 ? '—' : `${pct(l.winrate)} · ${l.kda.toFixed(1)} · ${l.games}G`}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                    <Sparkles size={28} color="var(--dbz-gold)" style={{ marginBottom: '0.8rem' }} />
                    <p style={{ fontSize: '0.95rem' }}>
                        Sélectionne un ou plusieurs personnages ci-dessus pour lancer la comparaison Xhelo / j9{hasNero ? ' / Nero' : ''}.
                    </p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
                        En attendant, la base complète est affichée juste en dessous.
                    </p>
                </div>
            )}

            {/* ---------- TABLEAU COMPLET ---------- */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.25rem' }}>
                    <h3 className="font-orbitron" style={{ fontSize: '1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Users size={20} color="var(--dbz-orange)" />
                        Base complète · {visibleRows.length} personnages
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button style={controlBtn(sortKey === 'total')} onClick={() => setSortKey('total')}>Plus joués</button>
                        <button style={controlBtn(sortKey === 'name')} onClick={() => setSortKey('name')}>A→Z</button>
                        <button style={controlBtn(sortKey === 'xhelo')} onClick={() => setSortKey('xhelo')}>Maîtrise Xhelo</button>
                        <button style={controlBtn(sortKey === 'j9')} onClick={() => setSortKey('j9')}>Maîtrise j9</button>
                        {hasNero && <button style={controlBtn(sortKey === 'nero')} onClick={() => setSortKey('nero')}>Maîtrise Nero</button>}
                        <button style={controlBtn(sortKey === 'gap')} onClick={() => setSortKey('gap')}>Plus gros écart</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                <th style={{ textAlign: 'left', padding: '0.6rem 0.5rem' }}>Personnage</th>
                                <th style={{ textAlign: 'left', padding: '0.6rem 0.5rem' }}>Rôle</th>
                                <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Combats</th>
                                {activeSides.map(s => (
                                    <th key={s} style={{ textAlign: 'right', padding: '0.6rem 0.5rem', color: SIDE_COLOR[s] }}>{SIDE_LABEL[s]}</th>
                                ))}
                                <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Maître</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleRows.map(row => {
                                const isSel = selected.includes(row.hero);
                                return (
                                    <tr
                                        key={row.hero}
                                        onClick={() => toggleHero(row.hero)}
                                        style={{
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                            background: isSel ? 'rgba(255,193,7,0.07)' : 'transparent',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
                                            {isSel && <span style={{ color: 'var(--dbz-gold)', marginRight: '0.4rem' }}>✦</span>}
                                            {row.hero}
                                        </td>
                                        <td style={{ padding: '0.65rem 0.5rem' }}>
                                            <span className={ROLE_BADGE(row.role)}>{row.role}</span>
                                        </td>
                                        <td className="font-orbitron" style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontSize: '0.85rem' }}>{row.total}</td>
                                        {activeSides.map(s => (
                                            <td key={s} style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                                                <SideCell line={row.lines[s]} side={s} best={row.master === s} />
                                            </td>
                                        ))}
                                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                                            <MasterBadge row={row} compact />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1rem', fontStyle: 'italic' }}>
                    Clique sur une ligne pour ajouter ou retirer le personnage de la comparaison. Score de maîtrise = 60% winrate + 40% KDA (plafonné à 4.0), pondéré par le volume de combats.
                </p>
            </div>

            {nexus && (
                <MasteryNexus
                    matches={scoped}
                    hero={nexus.hero}
                    player={nexus.player}
                    onClose={() => setNexus(null)}
                />
            )}
        </div>
    );
};

export default CharacterLab;
