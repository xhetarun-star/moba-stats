'use client';

import React, { useState, useEffect } from 'react';
import { Match } from '../lib/types';
import { fetchMatches } from '../lib/storage';
import MatchForm from '../components/MatchForm';
import MatchList from '../components/MatchList';
import StatsSummary from '../components/StatsSummary';
import AdvancedStats from '../components/AdvancedStats';
import { Sword, LayoutDashboard, RefreshCcw, Zap } from 'lucide-react';

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchMatches();
      setMatches(data);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMatchUpdate = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
  };

  if (!isLoaded) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--dbz-orange)' }}>
      <RefreshCcw className="animate-spin" size={48} />
    </div>
  );

  return (
    <main className="container">
      {/* Header DBZ Style */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem',
        padding: '2rem 0',
        borderBottom: '2px solid var(--dbz-orange)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--dbz-orange), var(--dbz-red))',
            padding: '1rem',
            borderRadius: '20px',
            boxShadow: '0 0 25px rgba(248, 90, 33, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={36} color="white" fill="white" />
          </div>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: 'var(--dbz-orange)',
              textShadow: '2px 2px 0px var(--dbz-blue)'
            }}>
              Z-STATS
            </h1>
            <p style={{ color: 'var(--dbz-yellow)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Duo Performance Tracker
            </p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="btn"
            style={{
              padding: '0.75rem',
              background: 'var(--dbz-blue)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white'
            }}
            title="Rafraîchir les données"
          >
            <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <a href="#" style={{
            color: 'var(--dbz-yellow)',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            fontSize: '1rem',
            textTransform: 'uppercase'
          }}>
            <LayoutDashboard size={20} />
            Kais Pad
          </a>
        </nav>
      </header>

      {/* Hero Stats */}
      <StatsSummary matches={matches} />

      {/* Advanced Insights */}
      <AdvancedStats matches={matches} />

      {/* Main Grid */}
      <div className="main-content">
        {/* Left Column: Form */}
        <aside>
          <MatchForm onMatchAdded={handleMatchUpdate} currentMatches={matches} />
        </aside>

        {/* Right Column: List */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--dbz-orange)' }}>
              Sagas Récentes
            </h2>
            <span style={{
              background: 'var(--dbz-blue)',
              padding: '0.4rem 0.8rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              {matches.length} COMBATS
            </span>
          </div>
          <MatchList matches={matches} onMatchDeleted={handleMatchUpdate} />
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '6rem',
        padding: '3rem 0',
        textAlign: 'center',
        borderTop: '2px solid var(--card-border)',
        background: 'linear-gradient(to bottom, transparent, rgba(248, 90, 33, 0.05))'
      }}>
        <p style={{ color: 'var(--dbz-orange)', fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Xhelo x j9
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Propulsé par le Ki de Vercel & Upstash. 2026.
        </p>
      </footer>
    </main>
  );
}
