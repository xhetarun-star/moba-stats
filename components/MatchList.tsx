'use client';

import React from 'react';
import { Match } from '../lib/types';
import { Trash2, Users, Calendar, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchListProps {
    matches: Match[];
    onMatchDeleted: (id: string) => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, onMatchDeleted }) => {
    const handleDelete = async (id: string) => {
        if (confirm('Supprimer cette partie ?')) {
            onMatchDeleted(id);
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
            <AnimatePresence>
                {matches.map((match, i) => (
                    <motion.div 
                        key={match.id} 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, height: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="card" 
                        style={{ 
                            padding: '1.25rem',
                            background: match.result === 'Win' ? 'linear-gradient(90deg, rgba(0, 230, 118, 0.05), transparent)' : 'linear-gradient(90deg, rgba(255, 23, 68, 0.05), transparent)',
                            borderLeft: match.result === 'Win' ? '4px solid var(--win-color)' : '4px solid var(--loss-color)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: match.result === 'Win' ? 'var(--win-color)' : 'var(--loss-color)',
                                    boxShadow: `0 0 10px ${match.result === 'Win' ? 'rgba(0, 230, 118, 0.5)' : 'rgba(255, 23, 68, 0.5)'}`
                                }} />
                                <span className="font-orbitron" style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: match.result === 'Win' ? 'var(--win-color)' : 'var(--loss-color)' }}>
                                    {match.result === 'Win' ? 'VICTOIRE' : 'DÉFAITE'}
                                </span>

                                <span className="font-orbitron" style={{ 
                                    background: match.neroStats ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 229, 255, 0.15)', 
                                    color: match.neroStats ? 'var(--dbz-purple)' : 'var(--dbz-blue)', 
                                    border: match.neroStats ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(0, 229, 255, 0.3)',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '8px',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.05em'
                                }}>
                                    {match.neroStats ? 'TRIO' : 'DUO'}
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

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: match.neroStats ? '1fr 1fr 1fr' : '1fr auto 1fr', 
                            alignItems: 'center', 
                            gap: '1rem'
                        }}>
                            {/* User Side (Xhelo) */}
                            <div style={{ textAlign: match.neroStats ? 'center' : 'right' }}>
                                {match.neroStats && <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Xhelo</div>}
                                <div className="font-orbitron" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>{match.userStats.hero}</div>
                                <span className={`badge badge-${match.userStats.role.toLowerCase() === 'soutien' ? 'support' : match.userStats.role.toLowerCase() === 'attaquant' ? 'attacker' : 'defender'}`} style={{ display: 'inline-block', marginTop: '0.2rem' }}>
                                    {match.userStats.role}
                                </span>
                                <div className="font-orbitron" style={{ marginTop: '0.5rem', fontSize: '1.4rem', fontWeight: 900, color: 'transparent', background: 'linear-gradient(to right, var(--dbz-orange), var(--dbz-red))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {match.userStats.kills} / {match.userStats.deaths} / {match.userStats.assists}
                                </div>
                            </div>

                            {match.neroStats ? (
                                /* Center Side for Trio (j9) */
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>j9</div>
                                    <div className="font-orbitron" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>{match.mateStats.hero}</div>
                                    <span className={`badge badge-${match.mateStats.role.toLowerCase() === 'soutien' ? 'support' : match.mateStats.role.toLowerCase() === 'attaquant' ? 'attacker' : 'defender'}`} style={{ display: 'inline-block', marginTop: '0.2rem' }}>
                                        {match.mateStats.role}
                                    </span>
                                    <div className="font-orbitron" style={{ marginTop: '0.5rem', fontSize: '1.4rem', fontWeight: 900, color: 'transparent', background: 'linear-gradient(to right, var(--dbz-blue), var(--dbz-blue-glow))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {match.mateStats.kills} / {match.mateStats.deaths} / {match.mateStats.assists}
                                    </div>
                                </div>
                            ) : (
                                /* Divider Icon for Duo */
                                <div style={{ color: 'var(--card-border)' }}>
                                    <Users size={24} />
                                </div>
                            )}

                            {match.neroStats ? (
                                /* Right Side for Trio (Nero) */
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Nero</div>
                                    <div className="font-orbitron" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>{match.neroStats.hero}</div>
                                    <span className={`badge badge-${match.neroStats.role.toLowerCase() === 'soutien' ? 'support' : match.neroStats.role.toLowerCase() === 'attaquant' ? 'attacker' : 'defender'}`} style={{ display: 'inline-block', marginTop: '0.2rem' }}>
                                        {match.neroStats.role}
                                    </span>
                                    <div className="font-orbitron" style={{ marginTop: '0.5rem', fontSize: '1.4rem', fontWeight: 900, color: 'transparent', background: 'linear-gradient(to right, var(--dbz-purple), var(--dbz-purple-glow))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {match.neroStats.kills} / {match.neroStats.deaths} / {match.neroStats.assists}
                                    </div>
                                </div>
                            ) : (
                                /* Right Side for Duo (j9) */
                                <div style={{ textAlign: 'left' }}>
                                    <div className="font-orbitron" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>{match.mateStats.hero}</div>
                                    <span className={`badge badge-${match.mateStats.role.toLowerCase() === 'soutien' ? 'support' : match.mateStats.role.toLowerCase() === 'attaquant' ? 'attacker' : 'defender'}`} style={{ display: 'inline-block', marginTop: '0.2rem' }}>
                                        {match.mateStats.role}
                                    </span>
                                    <div className="font-orbitron" style={{ marginTop: '0.5rem', fontSize: '1.4rem', fontWeight: 900, color: 'transparent', background: 'linear-gradient(to right, var(--dbz-blue), var(--dbz-blue-glow))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {match.mateStats.kills} / {match.mateStats.deaths} / {match.mateStats.assists}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default MatchList;
