'use client';

import React, { useState } from 'react';
import { Match } from '../lib/types';
import { Award, Users, Star, TrendingUp, User, Shield, Sword, Heart, Activity, Target, Filter } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface AdvancedStatsProps {
    matches: Match[];
}

const AdvancedStats: React.FC<AdvancedStatsProps> = ({ matches }) => {
    const [strictDuo, setStrictDuo] = useState(false);

    if (matches.length === 0) return null;

    const processHeroStats = (filterFn: (m: Match, side: 'user' | 'mate') => boolean = () => true) => {
        const stats: Record<string, { wins: number; total: number; k: number; d: number; a: number }> = {};

        matches.forEach(m => {
            if (filterFn(m, 'user')) {
                const h = m.userStats.hero;
                if (!stats[h]) stats[h] = { wins: 0, total: 0, k: 0, d: 0, a: 0 };
                stats[h].total++;
                stats[h].k += m.userStats.kills;
                stats[h].d += m.userStats.deaths;
                stats[h].a += m.userStats.assists;
                if (m.result === 'Win') stats[h].wins++;
            }
            if (filterFn(m, 'mate')) {
                const h = m.mateStats.hero;
                if (!stats[h]) stats[h] = { wins: 0, total: 0, k: 0, d: 0, a: 0 };
                stats[h].total++;
                stats[h].k += m.mateStats.kills;
                stats[h].d += m.mateStats.deaths;
                stats[h].a += m.mateStats.assists;
                if (m.result === 'Win') stats[h].wins++;
            }
        });

        return Object.entries(stats).map(([name, s]) => ({
            name,
            winrate: (s.wins / s.total) * 100,
            total: s.total,
            kda: (s.k + s.a) / Math.max(1, s.d),
            details: { k: s.k, d: s.d, a: s.a }
        }));
    };

    const processRoleStats = (side: 'user' | 'mate') => {
        const stats: Record<string, { wins: number; total: number; k: number; d: number; a: number }> = {};
        matches.forEach(m => {
            const p = side === 'user' ? m.userStats : m.mateStats;
            const r = p.role;
            if (!stats[r]) stats[r] = { wins: 0, total: 0, k: 0, d: 0, a: 0 };
            stats[r].total++;
            stats[r].k += p.kills;
            stats[r].d += p.deaths;
            stats[r].a += p.assists;
            if (m.result === 'Win') stats[r].wins++;
        });
        return Object.entries(stats).map(([name, s]) => ({
            name,
            winrate: (s.wins / s.total) * 100,
            total: s.total,
            kda: (s.k + s.a) / Math.max(1, s.d),
            details: { k: s.k, d: s.d, a: s.a }
        })).sort((a, b) => b.winrate - a.winrate);
    };

    // Data Preparation
    const xheloBase = processHeroStats((m, side) => side === 'user');
    const j9Base = processHeroStats((m, side) => side === 'mate');

    const topWR_Xhelo = [...xheloBase].sort((a, b) => b.winrate - a.winrate || b.total - a.total).slice(0, 5);
    const topKDA_Xhelo = [...xheloBase].filter(h => h.total >= 2).sort((a, b) => b.kda - a.kda).slice(0, 5);

    const topWR_J9 = [...j9Base].sort((a, b) => b.winrate - a.winrate || b.total - a.total).slice(0, 5);
    const topKDA_J9 = [...j9Base].filter(h => h.total >= 2).sort((a, b) => b.kda - a.kda).slice(0, 5);

    const rolesXhelo = processRoleStats('user');
    const rolesJ9 = processRoleStats('mate');
    const topGlobal = processHeroStats().filter(h => h.total >= 3).sort((a, b) => b.winrate - a.winrate).slice(0, 5);

    // Duos
    const duoGroup: Record<string, { wins: number; total: number }> = {};
    matches.forEach(m => {
        const key = [m.userStats.hero, m.mateStats.hero].sort().join(' + ');
        if (!duoGroup[key]) duoGroup[key] = { wins: 0, total: 0 };
        duoGroup[key].total++;
        if (m.result === 'Win') duoGroup[key].wins++;
    });

    const topDuos = Object.entries(duoGroup)
        .map(([key, s]) => ({ key, winrate: (s.wins / s.total) * 100, total: s.total }))
        .filter(d => !strictDuo || d.total >= 5)
        .sort((a, b) => b.winrate - a.winrate || b.total - a.total).slice(0, 5);

    // --- Radar Chart Calculation ---
    let uK = 0, uD = 0, uA = 0;
    let mK = 0, mD = 0, mA = 0;
    matches.forEach(m => {
        uK += m.userStats.kills; uD += m.userStats.deaths; uA += m.userStats.assists;
        mK += m.mateStats.kills; mD += m.mateStats.deaths; mA += m.mateStats.assists;
    });

    const userTotalGames = matches.length;
    const maxK = Math.max(uK, mK) || 1;
    const maxA = Math.max(uA, mA) || 1;
    const avgUD = userTotalGames ? uD / userTotalGames : 0;
    const avgMD = userTotalGames ? mD / userTotalGames : 0;
    const maxAvgD = Math.max(avgUD, avgMD) || 1;
    const uKDA = (uK + uA) / Math.max(1, uD);
    const mKDA = (mK + mA) / Math.max(1, mD);
    const maxKDA = Math.max(uKDA, mKDA) || 1;
    const duoWR = userTotalGames > 0 ? (matches.filter(m => m.result === 'Win').length / userTotalGames) * 100 : 0;

    const radarData = [
        { subject: 'EFFICACITÉ', xhelo: duoWR, j9: duoWR, fullMark: 100 },
        { subject: 'AGRESSIVITÉ', xhelo: (uK / maxK) * 100, j9: (mK / maxK) * 100, fullMark: 100 },
        { subject: 'SOUTIEN', xhelo: (uA / maxA) * 100, j9: (mA / maxA) * 100, fullMark: 100 },
        { subject: 'SURVIE', xhelo: Math.max(0, 100 - ((avgUD / maxAvgD) * 100)), j9: Math.max(0, 100 - ((avgMD / maxAvgD) * 100)), fullMark: 100 },
        { subject: 'IMPACT', xhelo: (uKDA / maxKDA) * 100, j9: (mKDA / maxKDA) * 100, fullMark: 100 },
    ];

    const getRoleIcon = (role: string) => {
        if (role.includes('Attaq')) return <Sword size={14} />;
        if (role.includes('Défens')) return <Shield size={14} />;
        return <Heart size={14} />;
    };

    const StatList = ({ data, type }: { data: any[], type: 'wr' | 'kda' | 'duo' | 'role' }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {data.map((item, i) => (
                <motion.div
                    key={item.name || item.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.8rem 1rem',
                        background: i === 0 && type !== 'role' ? 'linear-gradient(90deg, rgba(255, 193, 7, 0.15), transparent)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: i === 0 && type !== 'role' ? '1px solid rgba(255, 193, 7, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.3s ease',
                        boxShadow: i === 0 && type !== 'role' ? 'inset 0 0 15px rgba(255,193,7,0.05)' : 'none'
                    }}
                    className={i === 0 && type !== 'role' ? 'rank-aura-gold' : ''}
                    title={item.details ? `Total: ${item.details.k}K / ${item.details.d}D / ${item.details.a}A` : undefined}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {type !== 'role' && (
                            <span className="font-orbitron" style={{
                                color: i === 0 ? 'var(--dbz-gold)' : 'var(--text-secondary)',
                                fontWeight: 800,
                                fontSize: '0.9rem'
                            }}>
                                #{i + 1}
                            </span>
                        )}
                        {type === 'role' && <span style={{ opacity: 0.8 }}>{getRoleIcon(item.name)}</span>}
                        <span style={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '160px'
                        }}>
                            {item.name || item.key}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {type === 'kda' ? (
                            <>
                                <div className="font-orbitron" style={{
                                    color: i === 0 ? 'var(--dbz-orange)' : 'var(--foreground)',
                                    fontWeight: 900,
                                    fontSize: '1.1rem',
                                    textShadow: i === 0 ? '0 0 10px rgba(255, 87, 34, 0.4)' : 'none'
                                }}>
                                    {item.kda.toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Ratio</div>
                            </>
                        ) : (
                            <>
                                <div className="font-orbitron" style={{
                                    color: i === 0 ? 'var(--dbz-gold)' : 'var(--win-color)',
                                    fontWeight: 900,
                                    fontSize: '1.1rem',
                                    textShadow: i === 0 ? '0 0 10px rgba(255, 193, 7, 0.4)' : 'none'
                                }}>
                                    {item.winrate.toFixed(0)}%
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>{item.total} combat{item.total > 1 ? 's' : ''}</div>
                            </>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <div style={{ marginBottom: '4rem' }}>
            <h2 className="font-orbitron" style={{ fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                <Activity color="var(--dbz-orange)" size={28} />
                Système d'Analyse Avancé
            </h2>
            <div className="font-orbitron" style={{ fontSize: '0.7rem', color: 'var(--dbz-orange)', marginBottom: '2.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8 }}>
                Données Quantiques & Synergies
            </div>

            {/* Xhelo Section */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={20} /> Moi (Xhelo)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div className="card" style={{ borderTop: '2px solid var(--accent-primary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Top Winrate (Héros)</h4>
                        <StatList data={topWR_Xhelo} type="wr" />
                    </div>
                    <div className="card" style={{ borderTop: '2px solid var(--accent-secondary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Top KDA (Héros)</h4>
                        <StatList data={topKDA_Xhelo} type="kda" />
                    </div>
                    <div className="card" style={{ borderTop: '2px solid var(--text-secondary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Performance par Rôle</h4>
                        <StatList data={rolesXhelo} type="role" />
                    </div>
                </div>
            </div>

            {/* j9 Section */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} /> Mate (j9)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div className="card" style={{ borderTop: '2px solid var(--accent-secondary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Top Winrate (Héros)</h4>
                        <StatList data={topWR_J9} type="wr" />
                    </div>
                    <div className="card" style={{ borderTop: '2px solid var(--accent-primary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Top KDA (Héros)</h4>
                        <StatList data={topKDA_J9} type="kda" />
                    </div>
                    <div className="card" style={{ borderTop: '2px solid var(--text-secondary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Performance par Rôle</h4>
                        <StatList data={rolesJ9} type="role" />
                    </div>
                </div>
            </div>

            {/* Global & Synergie Section */}
            <div>
                <h3 className="font-syncopate" style={{ fontSize: '1.2rem', color: '#ffd700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={20} /> Synergie & Global
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    <div className="card" style={{ borderTop: '2px solid #ffd700' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Analyse Vectorielle (Radar)</h4>
                        <div style={{ width: '100%', height: 300, cursor: 'crosshair' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'Orbitron' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'Orbitron' }} />
                                    <Radar name="Xhelo" dataKey="xhelo" stroke="var(--dbz-orange)" fill="var(--dbz-orange)" fillOpacity={0.4} />
                                    <Radar name="j9" dataKey="j9" stroke="var(--dbz-blue)" fill="var(--dbz-blue)" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="card" style={{ borderTop: '2px solid var(--win-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0 }}>Meilleurs Duos</h4>
                            <button
                                onClick={() => setStrictDuo(!strictDuo)}
                                style={{
                                    background: strictDuo ? 'var(--dbz-gold)' : 'rgba(255,255,255,0.05)',
                                    color: strictDuo ? 'black' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Filter size={12} />
                                5+ Combats
                            </button>
                        </div>
                        <StatList data={topDuos} type="duo" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedStats;
