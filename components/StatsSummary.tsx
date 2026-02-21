'use client';

import React from 'react';
import { Match } from '../lib/types';
import { Trophy, Target, Users } from 'lucide-react';

interface StatsSummaryProps {
    matches: Match[];
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ matches }) => {
    const totalGames = matches.length;
    const wins = matches.filter(m => m.result === 'Win').length;
    const winrate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;


    const avgUserKDA = totalGames > 0
        ? (matches.reduce((acc, m) => acc + (m.userStats.kills + m.userStats.assists) / Math.max(1, m.userStats.deaths), 0) / totalGames).toFixed(2)
        : "0.00";

    const avgMateKDA = totalGames > 0
        ? (matches.reduce((acc, m) => acc + (m.mateStats.kills + m.mateStats.assists) / Math.max(1, m.mateStats.deaths), 0) / totalGames).toFixed(2)
        : "0.00";

    return (
        <div className="stats-grid">
            <div className="card animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)' }}>
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '16px' }}>
                    <Trophy color="var(--win-color)" size={32} />
                </div>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Winrate</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{winrate}%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--win-color)' }}>{wins} Victories / {totalGames} Total</div>
                </div>
            </div>

            <div className="card animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), transparent)', animationDelay: '0.1s' }}>
                <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.2)', borderRadius: '16px' }}>
                    <Target color="var(--accent-primary)" size={32} />
                </div>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>KDA Moyen (Xhelo)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{avgUserKDA}</div>
                </div>
            </div>

            <div className="card animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.1), transparent)', animationDelay: '0.2s' }}>
                <div style={{ padding: '1rem', background: 'rgba(129, 140, 248, 0.2)', borderRadius: '16px' }}>
                    <Users color="var(--accent-secondary)" size={32} />
                </div>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>KDA Moyen (j9)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{avgMateKDA}</div>
                </div>
            </div>
        </div>
    );
};

export default StatsSummary;
