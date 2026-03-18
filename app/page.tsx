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
  const [seasonFilter, setSeasonFilter] = useState<'all' | 's1' | 's2'>('s2');

  const SEASON_2_START = new Date('2026-03-18T00:00:00.000Z');
  const getSeason = (dateStr: string) => {
      if (!dateStr || !dateStr.includes('-')) return 's1';
      const d = new Date(dateStr);
      return d >= SEASON_2_START ? 's2' : 's1';
  };

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

  const handleMatchDelete = async (id: string) => {
    const updated = matches.filter(m => m.id !== id);
    setMatches(updated);
    // Since page.tsx imports fetchMatches, it needs saveMatchesToDB.
    import('../lib/storage').then(({ saveMatchesToDB }) => {
      saveMatchesToDB(updated);
    });
  };

  const filteredMatches = matches.filter(m => {
    if (seasonFilter === 'all') return true;
    return getSeason(m.date) === seasonFilter;
  });

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
          <select 
            value={seasonFilter} 
            onChange={(e) => setSeasonFilter(e.target.value as any)}
            style={{
              background: '#0f172a',
              color: 'var(--dbz-gold)',
              border: '1px solid var(--dbz-gold)',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: 800,
              textTransform: 'uppercase',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            <option value="s2">Saison 2 (Nouvelle)</option>
            <option value="s1">Saison 1 (Ancienne)</option>
            <option value="all">Global</option>
          </select>

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
      <StatsSummary matches={filteredMatches} />

      {/* Advanced Insights */}
      <AdvancedStats matches={filteredMatches} />

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
              {filteredMatches.length} COMBATS
            </span>
          </div>
          <MatchList matches={filteredMatches} onMatchDeleted={handleMatchDelete} />
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
