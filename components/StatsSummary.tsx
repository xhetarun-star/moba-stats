'use client';

import React from 'react';
import { Match } from '../lib/types';
import { Trophy, Target, Users, Zap } from 'lucide-react';

interface StatsSummaryProps {
    matches: Match[];
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ matches }) => {
    const totalGames = matches.length;
    const wins = matches.filter(m => m.result === 'Win').length;
    const winrate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    let tk = 0, td = 0, ta = 0;
    let mk = 0, md = 0, ma = 0;
    matches.forEach(m => {
        tk += m.userStats.kills; td += m.userStats.deaths; ta += m.userStats.assists;
        mk += m.mateStats.kills; md += m.mateStats.deaths; ma += m.mateStats.assists;
    });

    const avgUserKDA = totalGames > 0 ? ((tk + ta) / Math.max(1, td)).toFixed(2) : "0.00";
    const avgMateKDA = totalGames > 0 ? ((mk + ma) / Math.max(1, md)).toFixed(2) : "0.00";

    const winrateDegree = (winrate / 100) * 360;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            {/* Winrate Circular Chart Card */}
            <div className="card animate-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.05), transparent)' }}>
                <div>
                    <div className="font-orbitron" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Core Winrate</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--dbz-gold)' }}>{wins} Victoires</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>sur {totalGames} Sagas</div>
                </div>
                
                <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: `conic-gradient(var(--dbz-gold) ${winrateDegree}deg, rgba(255, 255, 255, 0.1) ${winrateDegree}deg)`,
                        boxShadow: '0 0 20px rgba(255, 193, 7, 0.3)'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        inset: '8px',
                        background: 'var(--card-bg)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                    }}>
                        <span className="font-orbitron" style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--foreground)' }}>
                            {winrate}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Xhelo KDA Card */}
            <div className="card animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.05), transparent)', animationDelay: '0.1s' }}>
                <div style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.2), transparent)', borderRadius: '16px', border: '1px solid rgba(255, 87, 34, 0.3)' }}>
                    <Target color="var(--dbz-orange)" size={32} />
                </div>
                <div>
                    <div className="font-orbitron" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>KDA / Xhelo</div>
                    <div className="font-orbitron" style={{ fontSize: '2.5rem', fontWeight: 900, color: 'transparent', background: 'linear-gradient(to right, var(--dbz-orange), var(--dbz-red))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 15px rgba(255, 87, 34, 0.3)' }}>
                        {avgUserKDA}
                    </div>
                </div>
            </div>

            {/* j9 KDA Card */}
            <div className="card animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05), transparent)', animationDelay: '0.2s' }}>
                <div style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), transparent)', borderRadius: '16px', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                    <Users color="var(--dbz-blue)" size={32} />
                </div>
                <div>
                    <div className="font-orbitron" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>KDA / j9</div>
                    <div className="font-orbitron" style={{ fontSize: '2.5rem', fontWeight: 900, color: 'transparent', background: 'linear-gradient(to right, var(--dbz-blue), var(--dbz-blue-glow))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 15px rgba(0, 229, 255, 0.4)' }}>
                        {avgMateKDA}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsSummary;
