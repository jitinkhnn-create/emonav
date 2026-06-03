import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import useSessionHistory from '../hooks/useSessionHistory';
import { buildReportData } from '../services/analyzer';
import ReportChart from '../components/ReportChart';
import WordChangeTracker from '../components/WordChangeTracker';
import SessionCard from '../components/SessionCard';

interface Props {
  user: User;
}

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

export default function ReportPage({ user }: Props) {
  const navigate = useNavigate();
  const { sessions, loading, fetchSessions } = useSessionHistory(user.uid);
  const [period, setPeriod] = useState<Period>(30);

  useEffect(() => {
    fetchSessions(period);
  }, [period]);

  const report = buildReportData(sessions, period);

  const trendArrow = (current: number, reference: number) => {
    if (sessions.length < 2) return null;
    const diff = current - reference;
    if (Math.abs(diff) < 0.3) return null;
    return diff > 0 ? '↑' : '↓';
  };

  const prevHalf = sessions.slice(Math.floor(sessions.length / 2));
  const prevAvg = (key: 'confidence' | 'clarity' | 'emotionalIntensity') => {
    if (prevHalf.length === 0) return report.averageConfidence;
    return prevHalf.reduce((sum, s) => sum + s.scores[key], 0) / prevHalf.length;
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-display text-textPrimary">Your report</h1>
      </header>

      {/* Period selector */}
      <div className="flex gap-2 px-5 pb-4">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              period === p
                ? 'bg-green text-white'
                : 'bg-bgCard border border-borderSubtle text-textMuted hover:text-textSecondary'
            }`}
          >
            Last {p} days
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-5 space-y-8 pb-24">
        {loading ? (
          <div className="space-y-4 pt-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-bgCard" />)}
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <section className="grid grid-cols-3 gap-3">
              {[
                { label: 'Confidence', value: report.averageConfidence, prev: prevAvg('confidence'), color: '#2D8A5E' },
                { label: 'Clarity', value: report.averageClarity, prev: prevAvg('clarity'), color: '#3A7BD5' },
                { label: 'Intensity', value: report.averageEmotionalIntensity, prev: prevAvg('emotionalIntensity'), color: '#D4953A' },
              ].map(({ label, value, prev, color }) => {
                const arrow = trendArrow(value, prev);
                return (
                  <div key={label} className="card p-3 text-center">
                    <p className="text-xl font-medium" style={{ color }}>{value.toFixed(1)}</p>
                    {arrow && (
                      <span className={`text-xs ${arrow === '↑' ? 'text-green' : 'text-coral'}`}>{arrow}</span>
                    )}
                    <p className="text-[10px] text-textMuted mt-1">{label}</p>
                  </div>
                );
              })}
            </section>

            {/* Trend chart */}
            {report.trendsOverTime.length > 0 && (
              <section className="card p-4">
                <p className="text-xs uppercase tracking-widest text-textMuted mb-4">Trends over time</p>
                <ReportChart data={report.trendsOverTime} />
              </section>
            )}

            {/* Word patterns */}
            <section className="card p-4">
              <p className="text-xs uppercase tracking-widest text-textMuted mb-4">How your words are changing</p>
              <WordChangeTracker sessions={sessions} />
            </section>

            {/* Session list */}
            <section className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-textMuted">Sessions ({sessions.length})</p>
              {sessions.length === 0 ? (
                <p className="text-sm text-textMuted">No sessions in this period.</p>
              ) : (
                sessions.map((s) => <SessionCard key={s.id} session={s} />)
              )}
            </section>
          </>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="flex border-t border-borderSubtle fixed bottom-0 left-0 right-0 bg-bg">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex-1 py-4 text-sm text-textMuted hover:text-textSecondary"
        >
          Talk
        </button>
        <button
          type="button"
          className="flex-1 py-4 text-sm font-medium text-green border-t-2 border-green"
        >
          Report
        </button>
      </nav>
    </div>
  );
}
