'use client';

import React, { useState, useEffect } from 'react';
import { Match } from '../lib/types';
import { fetchMatches } from '../lib/storage';
import MatchForm from '../components/MatchForm';
import MatchList from '../components/MatchList';
import StatsSummary from '../components/StatsSummary';
import AdvancedStats from '../components/AdvancedStats';
import { Sword, LayoutDashboard, RefreshCcw } from 'lucide-react';

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
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMatchUpdate = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
  };

  if (!isLoaded) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--accent-primary)' }}>
      <RefreshCcw className="animate-spin" size={48} />
    </div>
  );

  return (
    <main className="container">
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem',
        padding: '1.5rem 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            padding: '0.75rem',
            borderRadius: '16px',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
          }}>
            <Sword size={32} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', lineHeight: 1 }}>DuoNexus</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>MOBA Stats Tracer (DB Mode)</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="btn"
            style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}
            title="Rafraîchir les données"
          >
            <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify(matches, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `moba-stats-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="btn"
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)' }}
          >
            Exporter JSON
          </button>
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
            <h2 style={{ fontSize: '1.25rem' }}>Parties Récentes</h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{matches.length} matches</span>
          </div>
          <MatchList matches={matches} onMatchDeleted={handleMatchUpdate} />
        </section>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '5rem', padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--card-border)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Plateforme de stats MOBA pour Xhelo & j9. Partagé par Vercel KV.
        </p>
      </footer>
    </main>
  );
}
