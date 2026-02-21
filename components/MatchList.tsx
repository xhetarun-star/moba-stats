'use client';

import React from 'react';
import { Match } from '../lib/types';
import { Trash2, Users, Calendar, Trophy } from 'lucide-react';
import { saveMatchesToDB } from '../lib/storage';

interface MatchListProps {
    matches: Match[];
    onMatchDeleted: (matches: Match[]) => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, onMatchDeleted }) => {
    const handleDelete = async (id: string) => {
        if (confirm('Supprimer cette partie ?')) {
            const updated = matches.filter(m => m.id !== id);
            onMatchDeleted(updated);
            // Persist to server
            await saveMatchesToDB(updated);
        }
    };

    if (matches.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>Aucune partie enregistrée.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {matches.map(match => (
                <div key={match.id} className="card animate-fade" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: match.result === 'Win' ? 'var(--win-color)' : 'var(--loss-color)',
                                boxShadow: `0 0 10px ${match.result === 'Win' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                            }} />
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: match.result === 'Win' ? 'var(--win-color)' : 'var(--loss-color)' }}>
                                {match.result === 'Win' ? 'VICTOIRE' : 'DÉFAITE'}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                {match.date.includes('-') ? new Date(match.date).toLocaleDateString() : match.date}
                            </span>
                        </div>
                        <button
                            onClick={() => handleDelete(match.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>
                        {/* User Side */}
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{match.userStats.hero}</div>
                            <span className={`badge badge-${match.userStats.role.toLowerCase() === 'soutien' ? 'support' : match.userStats.role.toLowerCase() === 'attaquant' ? 'attacker' : 'defender'}`}>
                                {match.userStats.role}
                            </span>
                            <div style={{ marginTop: '0.5rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {match.userStats.kills} / {match.userStats.deaths} / {match.userStats.assists}
                            </div>
                        </div>

                        <div style={{ color: 'var(--card-border)' }}>
                            <Users size={24} />
                        </div>

                        {/* Mate Side */}
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{match.mateStats.hero}</div>
                            <span className={`badge badge-${match.mateStats.role.toLowerCase() === 'soutien' ? 'support' : match.mateStats.role.toLowerCase() === 'attaquant' ? 'attacker' : 'defender'}`}>
                                {match.mateStats.role}
                            </span>
                            <div style={{ marginTop: '0.5rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                                {match.mateStats.kills} / {match.mateStats.deaths} / {match.mateStats.assists}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MatchList;
