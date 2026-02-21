'use client';

import React from 'react';
import { Match } from '../lib/types';
import { Award, Users, Star, TrendingUp, User, Shield, Sword, Heart, Activity, Target } from 'lucide-react';

interface AdvancedStatsProps {
    matches: Match[];
}

const AdvancedStats: React.FC<AdvancedStatsProps> = ({ matches }) => {
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
        .sort((a, b) => b.winrate - a.winrate || b.total - a.total).slice(0, 5);

    const getRoleIcon = (role: string) => {
        if (role.includes('Attaq')) return <Sword size={14} />;
        if (role.includes('Défens')) return <Shield size={14} />;
        return <Heart size={14} />;
    };

    const StatList = ({ data, type }: { data: any[], type: 'wr' | 'kda' | 'duo' | 'role' }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {data.map((item, i) => (
                <div
                    key={item.name || item.key}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.7rem 1rem',
                        background: i === 0 && type !== 'role' ? 'rgba(194, 156, 66, 0.05)' : 'rgba(255,255,255,0.01)',
                        borderRadius: '10px',
                        border: i === 0 && type !== 'role' ? '1px solid var(--dbz-gold)' : '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.2s ease'
                    }}
                    title={item.details ? `Total: ${item.details.k}K / ${item.details.d}D / ${item.details.a}A` : undefined}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {type !== 'role' && (
                            <span style={{
                                color: i === 0 ? 'var(--dbz-gold)' : 'var(--text-secondary)',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                fontFamily: 'Orbitron, sans-serif'
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
                                <div style={{
                                    color: i === 0 ? 'var(--dbz-gold)' : 'var(--foreground)',
                                    fontFamily: 'Orbitron, sans-serif',
                                    fontWeight: 800,
                                    fontSize: '0.9rem'
                                }}>
                                    {item.kda.toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Ratio</div>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    color: i === 0 ? 'var(--dbz-gold)' : 'var(--win-color)',
                                    fontFamily: 'Orbitron, sans-serif',
                                    fontWeight: 800,
                                    fontSize: '0.9rem'
                                }}>
                                    {item.winrate.toFixed(0)}%
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>{item.total} combat{item.total > 1 ? 's' : ''}</div>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Activity color="var(--accent-primary)" size={24} />
                Tableau de Bord Stratégique
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2rem', fontStyle: 'italic', opacity: 0.7 }}>
                Formule KDA : (Kills + Assists) / Morts (minimum 1 mort pour éviter la division par zéro)
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
                <h3 style={{ fontSize: '1.2rem', color: '#ffd700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={20} /> Synergie & Global
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div className="card" style={{ borderTop: '2px solid #ffd700' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Héros les plus Forts (Global)</h4>
                        <StatList data={topGlobal} type="wr" />
                    </div>
                    <div className="card" style={{ borderTop: '2px solid var(--win-color)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Meilleurs Duos</h4>
                        <StatList data={topDuos} type="duo" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedStats;
