'use client';

import React, { useState } from 'react';
import { HEROES, ROLES, Role, Match, PlayerStats, HERO_ROLES } from '../lib/types';
import { saveMatchesToDB } from '../lib/storage';
import { PlusCircle } from 'lucide-react';

interface MatchFormProps {
    onMatchAdded: (matches: Match[]) => void;
    currentMatches: Match[];
}

const MatchForm: React.FC<MatchFormProps> = ({ onMatchAdded, currentMatches }) => {
    const [userHero, setUserHero] = useState(HEROES[0]);
    const [userRole, setUserRole] = useState<Role>(HERO_ROLES[HEROES[0]]);
    const [userK, setUserK] = useState(0);
    const [userD, setUserD] = useState(0);
    const [userA, setUserA] = useState(0);

    const [mateHero, setMateHero] = useState(HEROES[1]);
    const [mateRole, setMateRole] = useState<Role>(HERO_ROLES[HEROES[1]]);
    const [mateK, setMateK] = useState(0);
    const [mateD, setMateD] = useState(0);
    const [mateA, setMateA] = useState(0);

    const [result, setResult] = useState<'Win' | 'Loss'>('Win');

    const handleUserHeroChange = (hero: string) => {
        setUserHero(hero);
        setUserRole(HERO_ROLES[hero] || 'Attaquant');
    };

    const handleMateHeroChange = (hero: string) => {
        setMateHero(hero);
        setMateRole(HERO_ROLES[hero] || 'Attaquant');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newMatch: Match = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            userStats: { hero: userHero, role: userRole, kills: userK, deaths: userD, assists: userA },
            mateStats: { hero: mateHero, role: mateRole, kills: mateK, deaths: mateD, assists: mateA },
            result
        };

        const updated = [newMatch, ...currentMatches];
        onMatchAdded(updated);

        // Persist to server
        await saveMatchesToDB(updated);

        // Reset scores
        setUserK(0); setUserD(0); setUserA(0);
        setMateK(0); setMateD(0); setMateA(0);
    };

    return (
        <div className="card animate-fade">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <PlusCircle size={24} color="var(--accent-primary)" />
                Nouvelle Partie
            </h2>

            <form onSubmit={handleSubmit}>
                <div style={{ padding: '1rem', border: '1px solid var(--card-border)', borderRadius: '16px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Moi (Xhelo)</h3>
                    <div className="input-group">
                        <label>Héros</label>
                        <select value={userHero} onChange={(e) => handleUserHeroChange(e.target.value)}>
                            {HEROES.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Rôle</label>
                        <select value={userRole} onChange={(e) => setUserRole(e.target.value as Role)}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        <div className="input-group">
                            <label>K</label>
                            <input type="number" value={userK} onChange={(e) => setUserK(parseInt(e.target.value) || 0)} min="0" />
                        </div>
                        <div className="input-group">
                            <label>D</label>
                            <input type="number" value={userD} onChange={(e) => setUserD(parseInt(e.target.value) || 0)} min="0" />
                        </div>
                        <div className="input-group">
                            <label>A</label>
                            <input type="number" value={userA} onChange={(e) => setUserA(parseInt(e.target.value) || 0)} min="0" />
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--card-border)', borderRadius: '16px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-secondary)' }}>Mate (j9)</h3>
                    <div className="input-group">
                        <label>Héros</label>
                        <select value={mateHero} onChange={(e) => handleMateHeroChange(e.target.value)}>
                            {HEROES.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Rôle</label>
                        <select value={mateRole} onChange={(e) => setMateRole(e.target.value as Role)}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        <div className="input-group">
                            <label>K</label>
                            <input type="number" value={mateK} onChange={(e) => setMateK(parseInt(e.target.value) || 0)} min="0" />
                        </div>
                        <div className="input-group">
                            <label>D</label>
                            <input type="number" value={mateD} onChange={(e) => setMateD(parseInt(e.target.value) || 0)} min="0" />
                        </div>
                        <div className="input-group">
                            <label>A</label>
                            <input type="number" value={mateA} onChange={(e) => setMateA(parseInt(e.target.value) || 0)} min="0" />
                        </div>
                    </div>
                </div >

                <div className="input-group">
                    <label>Résultat</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="button"
                            className={`btn ${result === 'Win' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, background: result === 'Win' ? 'var(--win-color)' : 'rgba(0,0,0,0.2)' }}
                            onClick={() => setResult('Win')}
                        >
                            Victoire
                        </button>
                        <button
                            type="button"
                            className={`btn ${result === 'Loss' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, background: result === 'Loss' ? 'var(--loss-color)' : 'rgba(0,0,0,0.2)' }}
                            onClick={() => setResult('Loss')}
                        >
                            Défaite
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    Enregistrer la partie
                </button>
            </form >
        </div >
    );
};

export default MatchForm;
