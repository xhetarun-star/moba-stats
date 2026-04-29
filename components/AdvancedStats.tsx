'use client';

import React, { useState } from 'react';
import { Match } from '../lib/types';
import { Award, Users, Star, TrendingUp, User, Shield, Sword, Heart, Activity, Target, Filter } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import MasteryNexus from './MasteryNexus';

interface AdvancedStatsProps {
    matches: Match[];
}

const AdvancedStats: React.FC<AdvancedStatsProps> = ({ matches }) => {
    const [strictDuo, setStrictDuo] = useState(false);
    const [strictHero, setStrictHero] = useState(false);
    const [selectedNexus, setSelectedNexus] = useState<{hero: string, player: 'xhelo' | 'j9'} | null>(null);

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
            wins: s.wins,
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

    const topXheloWR = [...xheloBase].filter(h => !strictHero ? h.total >= 2 : h.wins >= 5).sort((a, b) => b.winrate - a.winrate || b.total - a.total).slice(0, 5);
    const topXheloKDA = [...xheloBase].filter(h => !strictHero ? h.total >= 2 : h.wins >= 5).sort((a, b) => b.kda - a.kda).slice(0, 5);

    const topJ9WR = [...j9Base].filter(h => !strictHero ? h.total >= 2 : h.wins >= 5).sort((a, b) => b.winrate - a.winrate || b.total - a.total).slice(0, 5);
    const topJ9KDA = [...j9Base].filter(h => !strictHero ? h.total >= 2 : h.wins >= 5).sort((a, b) => b.kda - a.kda).slice(0, 5);

    const xheloRole = processRoleStats('user');
    const j9Role = processRoleStats('mate');
    const topGlobal = processHeroStats().filter(h => !strictHero ? h.total >= 3 : h.wins >= 5).sort((a, b) => b.winrate - a.winrate).slice(0, 5);

    // Duos
    const duoGroup: Record<string, { wins: number; total: number }> = {};
    matches.forEach(m => {
        const key = [m.userStats.hero, m.mateStats.hero].sort().join(' + ');
        if (!duoGroup[key]) duoGroup[key] = { wins: 0, total: 0 };
        duoGroup[key].total++;
        if (m.result === 'Win') duoGroup[key].wins++;
    });

    const topDuos = Object.entries(duoGroup)
        .map(([key, s]) => ({ key, winrate: (s.wins / s.total) * 100, total: s.total, wins: s.wins }))
        .filter(d => !strictDuo || d.wins >= 5)
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

    const uKillShare = (uK / Math.max(1, uK + mK)) * 100;
    const mKillShare = (mK / Math.max(1, uK + mK)) * 100;

    const radarData = [
        { subject: 'RÉPARTITION KI', xhelo: uKillShare, j9: mKillShare, fullMark: 100, desc: 'Part des éliminations au sein du duo' },
        { subject: 'FORCE FRAPPE', xhelo: (uK / maxK) * 100, j9: (mK / maxK) * 100, fullMark: 100, desc: 'Volume brut d\'éliminations' },
        { subject: 'SYNERGIE', xhelo: (uA / maxA) * 100, j9: (mA / maxA) * 100, fullMark: 100, desc: 'Capacité à assister le partenaire' },
        { subject: 'RÉSILIENCE', xhelo: Math.max(0, 100 - ((avgUD / maxAvgD) * 100)), j9: Math.max(0, 100 - ((avgMD / maxAvgD) * 100)), fullMark: 100, desc: 'Capacité à rester en vie' },
        { subject: 'POTENTIEL Z', xhelo: (uKDA / maxKDA) * 100, j9: (mKDA / maxKDA) * 100, fullMark: 100, desc: 'Efficacité globale (Ratio KDA)' },
    ];

    const CustomRadarTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{ 
                    background: 'rgba(10, 10, 15, 0.95)', 
                    border: '1px solid var(--dbz-gold)', 
                    padding: '1rem', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)',
                    minWidth: '220px'
                }}>
                    <div style={{ color: 'var(--dbz-gold)', fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'Orbitron' }}>
                        {data.subject}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', marginBottom: '0.8rem', fontStyle: 'italic', lineHeight: 1.3 }}>
                        {data.desc}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid rgba(255,215,0,0.1)', paddingTop: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--dbz-orange)', fontWeight: 700, fontSize: '0.75rem' }}>XHELO:</span>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{data.xhelo.toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--dbz-blue)', fontWeight: 700, fontSize: '0.75rem' }}>J9:</span>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{data.j9.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const getSynergyVerdict = () => {
        const xScore = radarData.reduce((acc, d) => acc + d.xhelo, 0);
        const jScore = radarData.reduce((acc, d) => acc + d.j9, 0);
        const diff = Math.abs(xScore - jScore);
        
        if (diff < 30) return { text: "OSMOSE TOTALE", sub: "Vos styles se complètent parfaitement", color: 'var(--dbz-gold)' };
        if (xScore > jScore) return { text: "XHELO EN POINTE", sub: "j9 assure la couverture tactique", color: 'var(--dbz-orange)' };
        return { text: "J9 EN PILIER", sub: "Xhelo multiplie les assauts", color: 'var(--dbz-blue)' };
    };

    const verdict = getSynergyVerdict();

    const getRoleIcon = (role: string) => {
        if (role.includes('Attaq')) return <Sword size={14} />;
        if (role.includes('Défens')) return <Shield size={14} />;
        return <Heart size={14} />;
    };

    const StatList = ({ data, type, player }: { data: any[], type: 'wr' | 'kda' | 'duo' | 'role', player?: 'xhelo' | 'j9' }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {data.map((item, i) => (
                <motion.div
                    key={item.name || item.key}
                    onClick={() => player && type !== 'role' && setSelectedNexus({ hero: item.name || item.key, player })}
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
                        boxShadow: i === 0 && type !== 'role' ? 'inset 0 0 15px rgba(255,193,7,0.05)' : 'none',
                        cursor: player && type !== 'role' ? 'pointer' : 'default'
                    }}
                    whileHover={player && type !== 'role' ? { scale: 1.02, x: 5, background: 'rgba(255,255,255,0.08)' } : {}}
                    className={i === 0 && type !== 'role' ? 'rank-aura-gold' : ''}
                    title={item.details ? `Total: ${item.details.k}K / ${item.details.d}D / ${item.details.a}A` : 'Cliquez pour ouvrir le dossier tactique'}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h2 className="font-orbitron" style={{ fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                    <Activity color="var(--dbz-orange)" size={28} />
                    Système d'Analyse Avancé
                </h2>
                <button
                    onClick={() => setStrictHero(!strictHero)}
                    style={{
                        background: strictHero ? 'var(--dbz-gold)' : 'rgba(255,255,255,0.05)',
                        color: strictHero ? 'black' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        fontFamily: 'Orbitron',
                        boxShadow: strictHero ? '0 0 15px rgba(255, 193, 7, 0.3)' : 'none'
                    }}
                >
                    <Filter size={14} />
                    Héros: 5+ Wins
                </button>
            </div>
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
                        <StatList data={topXheloWR} type="wr" player="xhelo" />
                    </div>
                    <div className="card" style={{ borderTop: '2px solid var(--accent-secondary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Top KDA (Héros)</h4>
                        <StatList data={topXheloKDA} type="kda" player="xhelo" />
                    </div>
                    <div className="card" style={{ borderTop: '2px solid var(--text-secondary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Performance par Rôle</h4>
                        <StatList data={xheloRole} type="role" player="xhelo" />
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
                        <StatList data={topJ9WR} type="wr" player="j9" />
                    </div>
                    <div className="card" style={{ borderTop: '2px solid var(--accent-primary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Top KDA (Héros)</h4>
                        <StatList data={topJ9KDA} type="kda" player="j9" />
                    </div>
                    <div className="card" style={{ borderTop: '2px solid var(--text-secondary)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Performance par Rôle</h4>
                        <StatList data={j9Role} type="role" player="j9" />
                    </div>
                </div>
            </div>

            {/* Global & Synergie Section */}
            <div>
                <h3 className="font-syncopate" style={{ fontSize: '1.2rem', color: '#ffd700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={20} /> Synergie & Global
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    <div className="card" style={{ borderTop: '2px solid #ffd700', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: 'rgba(255,215,0,0.1)', borderBottomLeftRadius: '12px', fontSize: '0.6rem', fontWeight: 900, color: 'var(--dbz-gold)', letterSpacing: '0.1em' }}>SCOUTER MATRIX v4.0</div>
                        
                        <h4 className="font-orbitron" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.8, color: 'var(--dbz-gold)' }}>Analyse du Duo</h4>
                        
                        <div style={{ width: '100%', height: 280, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                    <PolarAngleAxis 
                                        dataKey="subject" 
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700 }}
                                    />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Tooltip content={<CustomRadarTooltip />} />
                                    <Radar name="Xhelo" dataKey="xhelo" stroke="var(--dbz-orange)" fill="var(--dbz-orange)" fillOpacity={0.3} dot={{ r: 3, fill: 'var(--dbz-orange)' }} />
                                    <Radar name="j9" dataKey="j9" stroke="var(--dbz-blue)" fill="var(--dbz-blue)" fillOpacity={0.3} dot={{ r: 3, fill: 'var(--dbz-blue)' }} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        formatter={(value) => <span className="font-orbitron" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800 }}>{value.toUpperCase()}</span>}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ 
                            marginTop: '1.5rem', 
                            padding: '1rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '12px', 
                            border: `1px solid ${verdict.color}33`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '0.2rem'
                        }}>
                            <div className="font-orbitron" style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>VERDICT DE SYNERGIE</div>
                            <div className="font-orbitron" style={{ fontSize: '1rem', fontWeight: 900, color: verdict.color, textShadow: `0 0 10px ${verdict.color}66` }}>{verdict.text}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{verdict.sub}</div>
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
                                5+ Victoires
                            </button>
                        </div>
                        <StatList data={topDuos} type="duo" />
                    </div>
                </div>
            </div>

            {selectedNexus && (
                <MasteryNexus
                    matches={matches}
                    hero={selectedNexus.hero}
                    player={selectedNexus.player}
                    onClose={() => setSelectedNexus(null)}
                />
            )}
        </div>
    );
};

export default AdvancedStats;
