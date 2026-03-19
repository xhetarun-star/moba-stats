'use client';

import React, { useMemo } from 'react';
import { Match, PlayerStats } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Activity, GitBranch, Zap, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MasteryNexusProps {
    matches: Match[];
    hero: string;
    player: 'xhelo' | 'j9';
    onClose: () => void;
}

const MasteryNexus: React.FC<MasteryNexusProps> = ({ matches, hero, player, onClose }) => {
    const isXhelo = player === 'xhelo';
    const primaryColor = isXhelo ? 'var(--dbz-orange)' : 'var(--dbz-blue)';
    const primaryColorGlow = isXhelo ? 'rgba(255, 87, 34, 0.4)' : 'rgba(0, 229, 255, 0.4)';

    const data = useMemo(() => {
        // 1. Filter matches
        const heroMatches = matches.filter(m => 
            isXhelo ? m.userStats.hero === hero : m.mateStats.hero === hero
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const total = heroMatches.length;
        const wins = heroMatches.filter(m => m.result === 'Win').length;
        const winrate = total > 0 ? (wins / total) * 100 : 0;

        let k = 0, d = 0, a = 0;
        heroMatches.forEach(m => {
            const stats = isXhelo ? m.userStats : m.mateStats;
            k += stats.kills; d += stats.deaths; a += stats.assists;
        });
        const kda = (k + a) / Math.max(1, d);

        // Power Grade
        let grade = 'C';
        let gradeColor = '#94a3b8';
        if (winrate >= 65 && kda >= 3.0) { grade = 'S+'; gradeColor = '#ffd700'; }
        else if (winrate >= 55 && kda >= 2.5) { grade = 'S'; gradeColor = '#ff5722'; }
        else if (winrate >= 50 && kda >= 2.0) { grade = 'A'; gradeColor = '#00e5ff'; }
        else if (winrate >= 45 && kda >= 1.5) { grade = 'B'; gradeColor = '#4caf50'; }

        // Heartbeat data (Last 15)
        const recentMatches = heroMatches.slice(-15);
        const heartbeat = recentMatches.map((m, i) => {
            const stats = isXhelo ? m.userStats : m.mateStats;
            return {
                name: `Game ${i + 1}`,
                impact: ((stats.kills + stats.assists) / Math.max(1, stats.deaths)).toFixed(2),
                result: m.result
            };
        });

        // Synergy Matrix
        const synergyMap: Record<string, { wins: number, total: number }> = {};
        heroMatches.forEach(m => {
            const mateHero = isXhelo ? m.mateStats.hero : m.userStats.hero;
            if (!synergyMap[mateHero]) synergyMap[mateHero] = { wins: 0, total: 0 };
            synergyMap[mateHero].total += 1;
            if (m.result === 'Win') synergyMap[mateHero].wins += 1;
        });

        const topSynergies = Object.entries(synergyMap)
            .map(([h, s]) => ({ hero: h, winrate: (s.wins / s.total) * 100, total: s.total }))
            .sort((a, b) => b.winrate - a.winrate || b.total - a.total)
            .filter(s => s.total >= 1); // Keep all conceptually, take top 3 in render

        // Hologram comparison
        const otherMatches = matches.filter(m => 
            !isXhelo ? m.userStats.hero === hero : m.mateStats.hero === hero
        );
        let comparison = null;
        if (otherMatches.length >= 3 && total >= 3) {
            let ok = 0, od = 0, oa = 0;
            otherMatches.forEach(m => {
                const stats = !isXhelo ? m.userStats : m.mateStats;
                ok += stats.kills; od += stats.deaths; oa += stats.assists;
            });
            const otherKDA = (ok + oa) / Math.max(1, od);
            const otherWR = (otherMatches.filter(m => m.result === 'Win').length / otherMatches.length) * 100;
            
            const kdaDiff = (kda - otherKDA).toFixed(1);
            const wrDiff = (winrate - otherWR).toFixed(0);
            
            comparison = {
                text: `${parseFloat(kdaDiff) >= 0 ? '+' : ''}${kdaDiff} KDA et ${parseInt(wrDiff) >= 0 ? '+' : ''}${wrDiff}% WR comparé à ${isXhelo ? 'j9' : 'Xhelo'} sur ce même héros.`,
                isPositive: parseFloat(kdaDiff) >= 0 && parseInt(wrDiff) >= 0
            };
        }

        return { total, winrate, kda, grade, gradeColor, heartbeat, topSynergies, comparison };
    }, [matches, hero, isXhelo]);

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 50,
                    background: 'rgba(10, 11, 16, 0.85)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}
            >
                <div style={{
                    width: '100%',
                    maxWidth: '800px',
                    height: '100%',
                    background: 'var(--card-bg)',
                    borderLeft: `1px solid ${primaryColorGlow}`,
                    boxShadow: `-10px 0 50px ${primaryColorGlow}`,
                    overflowY: 'auto',
                    padding: '2rem'
                }}>
                    <button onClick={onClose} style={{
                        position: 'absolute', top: '1.5rem', right: '1.5rem',
                        background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                        cursor: 'pointer', padding: '0.5rem'
                    }}>
                        <X size={28} />
                    </button>

                    <h2 className="font-syncopate" style={{ fontSize: '2rem', color: primaryColor, marginBottom: '2rem', textTransform: 'uppercase' }}>
                        Dossier Tactique: {hero}
                    </h2>

                    {/* Power Grade Area */}
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem', borderTop: `2px solid ${data.gradeColor}`, marginBottom: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Perspective: {isXhelo ? 'Xhelo' : 'j9'}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                                <div><span style={{ color: 'var(--win-color)' }}>{data.winrate.toFixed(0)}%</span> WR</div>
                                <div><span style={{ color: primaryColor }}>{data.kda.toFixed(2)}</span> KDA</div>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Total: {data.total} Combats</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <motion.div 
                                initial={{ scale: 0.5, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', bounce: 0.5 }}
                                className="font-orbitron" 
                                style={{ 
                                    fontSize: '4rem', fontWeight: 900, 
                                    color: data.gradeColor, 
                                    textShadow: `0 0 20px ${data.gradeColor}`,
                                    position: 'relative'
                                }}
                            >
                                {data.grade}
                            </motion.div>
                            <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Power Grade</div>
                        </div>
                    </div>

                    {/* Synergy Matrix */}
                    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <h3 className="font-syncopate" style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <GitBranch size={20} color={primaryColor} /> Matrice Synergie Duo
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Quand {isXhelo ? 'Xhelo' : 'j9'} prend {hero}, voici l'efficacité selon le pick de l'équipier :
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {data.topSynergies.slice(0, 3).map((syn, i) => (
                                <div key={syn.hero} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: i === 0 ? `3px solid ${primaryColor}` : '3px solid transparent' }}>
                                    <div style={{ fontWeight: 600 }}>{syn.hero} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>joué par {isXhelo ? 'j9' : 'Xhelo'}</span></div>
                                    <div className="font-orbitron" style={{ color: syn.winrate >= 50 ? 'var(--win-color)' : 'var(--loss-color)', fontWeight: 800 }}>
                                        {syn.winrate.toFixed(0)}% <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({syn.total}M)</span>
                                    </div>
                                </div>
                            ))}
                            {data.topSynergies.length === 0 && <div style={{ opacity: 0.5, fontStyle: 'italic' }}>Aucune donnée de synergie analysable.</div>}
                        </div>
                    </div>

                    {/* Heartbeat Graph */}
                    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <h3 className="font-syncopate" style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Activity size={20} color={primaryColor} /> Électrocardiogramme Impact
                        </h3>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <LineChart data={data.heartbeat}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px' }} />
                                    <Line type="monotone" dataKey="impact" stroke={primaryColor} strokeWidth={3} dot={{ fill: primaryColor, r: 4 }} activeDot={{ r: 8, fill: 'var(--foreground)' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Hologram Comparison */}
                    {data.comparison && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="card" style={{ padding: '1.5rem', background: data.comparison.isPositive ? 'linear-gradient(90deg, rgba(0,230,118,0.1), transparent)' : 'linear-gradient(90deg, rgba(255,23,68,0.1), transparent)', border: `1px solid ${data.comparison.isPositive ? 'rgba(0,230,118,0.3)' : 'rgba(255,23,68,0.3)'}` }}>
                            <h3 className="font-syncopate" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: data.comparison.isPositive ? 'var(--win-color)' : 'var(--loss-color)' }}>
                                <Sparkles size={18} /> Méta-Analyse Holographique
                            </h3>
                            <p style={{ fontSize: '1rem' }}>
                                Vous avez <strong>{data.comparison.text}</strong>
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MasteryNexus;
