'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Match } from '../../lib/types';
import { fetchMatches } from '../../lib/storage';
import CharacterLab from '../../components/CharacterLab';
import { RefreshCcw, ArrowLeft, Users } from 'lucide-react';

export default function CodexPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = async () => {
        setIsRefreshing(true);
        try {
            const data = await fetchMatches();
            setMatches(data);
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            setIsLoaded(true);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            for (const card of document.querySelectorAll('.card')) {
                const rect = (card as HTMLElement).getBoundingClientRect();
                (card as HTMLElement).style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                (card as HTMLElement).style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    if (!isLoaded) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--dbz-orange)' }}>
            <RefreshCcw className="animate-spin" size={48} />
        </div>
    );

    return (
        <main className="container">
            <header className="card" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                marginBottom: '3rem',
                padding: '1.5rem 2.5rem',
                marginTop: '2rem',
                borderTop: '2px solid var(--dbz-gold)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--dbz-gold), var(--dbz-orange))',
                        padding: '1.2rem',
                        borderRadius: '20px',
                        boxShadow: '0 0 25px rgba(255, 193, 7, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users size={36} color="white" />
                    </div>
                    <div>
                        <h1 className="font-orbitron" style={{
                            fontSize: '2.4rem',
                            lineHeight: 1,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            background: 'linear-gradient(to right, var(--dbz-gold), var(--dbz-orange))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 15px rgba(255, 193, 7, 0.3))'
                        }}>
                            Codex des Personnages
                        </h1>
                        <p className="font-orbitron" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: '0.3rem' }}>
                            Qui maîtrise quoi · {matches.length} combats analysés
                        </p>
                    </div>
                </div>

                <nav style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <button
                        onClick={loadData}
                        disabled={isRefreshing}
                        className="btn"
                        style={{
                            padding: '0.8rem',
                            background: 'rgba(0, 229, 255, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 229, 255, 0.3)',
                            color: 'var(--dbz-blue)'
                        }}
                        title="Recharger les données"
                    >
                        <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <Link
                        href="/"
                        className="btn"
                        style={{
                            background: 'rgba(255, 87, 34, 0.12)',
                            border: '1px solid rgba(255, 87, 34, 0.4)',
                            color: 'var(--dbz-orange)',
                            textDecoration: 'none'
                        }}
                    >
                        <ArrowLeft size={16} /> Dashboard
                    </Link>
                </nav>
            </header>

            <CharacterLab matches={matches} />

            <footer style={{
                marginTop: '5rem',
                padding: '3rem 0',
                textAlign: 'center',
                borderTop: '2px solid var(--card-border)'
            }}>
                <p style={{ color: 'var(--dbz-orange)', fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Xhelo x j9
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Codex complet · toutes saisons, tous personnages.
                </p>
            </footer>
        </main>
    );
}
