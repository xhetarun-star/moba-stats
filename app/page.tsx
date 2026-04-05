'use client';

import React, { useState, useEffect } from 'react';
import { Match } from '../lib/types';
import { fetchMatches, saveMatchesToDB } from '../lib/storage';
import MatchForm from '../components/MatchForm';
import MatchList from '../components/MatchList';
import StatsSummary from '../components/StatsSummary';
import AdvancedStats from '../components/AdvancedStats';
import { Sword, LayoutDashboard, RefreshCcw, Zap, Activity } from 'lucide-react';

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState<'all' | 's1' | 's2'>('s2');

  // Fix timezone: utiliser heure locale pour éviter les erreurs autour de minuit
  const SEASON_2_START_LOCAL = new Date('2026-03-18T00:00:00');
  const getSeason = (dateStr: string) => {
      if (!dateStr || !dateStr.includes('-')) return 's1';
      const d = new Date(dateStr);
      return d >= SEASON_2_START_LOCAL ? 's2' : 's1';
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      for (const card of document.querySelectorAll('.card')) {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleMatchUpdate = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
  };

  const handleMatchDelete = async (id: string) => {
    const updated = matches.filter(m => m.id !== id);
    setMatches(updated);
    saveMatchesToDB(updated);
  };

  // Power Level dynamique
  const computePowerLevel = (matchList: Match[], side: 'user' | 'mate') => {
    const total = matchList.length;
    if (total === 0) return 0;
    const wins = matchList.filter(m => m.result === 'Win').length;
    const wr = wins / total;
    let k = 0, d = 0, a = 0;
    matchList.forEach(m => {
      const s = side === 'user' ? m.userStats : m.mateStats;
      k += s.kills; d += s.deaths; a += s.assists;
    });
    const kda = (k + a) / Math.max(1, d);
    return Math.round(wr * kda * total * 10);
  };

  const getPowerLabel = (power: number) => {
    if (power === 0) return { label: 'En entraînement...', color: 'var(--text-secondary)' };
    if (power < 500) return { label: 'Guerrier Z', color: '#4caf50' };
    if (power < 1000) return { label: 'Super Saiyen', color: 'var(--dbz-blue)' };
    if (power < 5000) return { label: 'Super Saiyen 2', color: 'var(--dbz-orange)' };
    return { label: '⚡ OVER 9000 !!', color: 'var(--dbz-gold)' };
  };

  const xheloPower = computePowerLevel(matches, 'user');
  const j9Power = computePowerLevel(matches, 'mate');
  const xheloLabel = getPowerLabel(xheloPower);
  const j9Label = getPowerLabel(j9Power);

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
      {/* Header DBZ Cyberpunk Style */}
      <header className="card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem',
        padding: '1.5rem 2.5rem',
        marginTop: '2rem',
        borderTop: '2px solid var(--dbz-orange)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--dbz-orange), var(--dbz-red))',
            padding: '1.2rem',
            borderRadius: '20px',
            boxShadow: '0 0 25px rgba(255, 87, 34, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={36} color="white" fill="white" />
          </div>
          <div>
            <h1 className="font-orbitron" style={{
              fontSize: '2.8rem',
              lineHeight: 1,
              fontWeight: 900,
              textTransform: 'uppercase',
              background: 'linear-gradient(to right, var(--dbz-orange), var(--dbz-gold))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 15px rgba(255, 87, 34, 0.3))'
            }}>
              Z-STATS
            </h1>
            <p className="font-orbitron" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.3rem' }}>
              NEXUS TRACKER v2.1
            </p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {/* Power Level dynamique Xhelo + j9 */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginRight: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className="font-orbitron" style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>XHELO</span>
              <span className="font-orbitron" style={{ fontSize: '1.3rem', fontWeight: 900, color: xheloLabel.color, textShadow: `0 0 15px ${xheloLabel.color}`, transition: 'all 0.5s' }}>
                {xheloPower.toLocaleString()}
              </span>
              <span className="font-orbitron" style={{ fontSize: '0.55rem', color: xheloLabel.color, letterSpacing: '0.05em', opacity: 0.9 }}>{xheloLabel.label}</span>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--card-border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="font-orbitron" style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>J9</span>
              <span className="font-orbitron" style={{ fontSize: '1.3rem', fontWeight: 900, color: j9Label.color, textShadow: `0 0 15px ${j9Label.color}`, transition: 'all 0.5s' }}>
                {j9Power.toLocaleString()}
              </span>
              <span className="font-orbitron" style={{ fontSize: '0.55rem', color: j9Label.color, letterSpacing: '0.05em', opacity: 0.9 }}>{j9Label.label}</span>
            </div>
          </div>

          <select 
            value={seasonFilter} 
            onChange={(e) => setSeasonFilter(e.target.value as any)}
            className="font-orbitron"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              color: 'var(--dbz-blue)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              padding: '0.7rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              transition: 'all 0.3s'
            }}
          >
            <option value="s2">Saison 2 (Actuelle)</option>
            <option value="s1">Saison 1 (Archive)</option>
            <option value="all">Database Complète</option>
          </select>

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
            title="Sonde Radar"
          >
            <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
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
