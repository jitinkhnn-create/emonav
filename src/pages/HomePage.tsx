import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import type { Session } from '../types';
import SessionCard from '../components/SessionCard';

interface Props {
  user: User;
  sessions: Session[];
  loading: boolean;
  onSignOut: () => void;
}

export default function HomePage({ user, sessions, loading, onSignOut }: Props) {
  const navigate = useNavigate();
  const firstName = user.displayName?.split(' ')[0] || 'there';

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <p className="text-xs text-textMuted uppercase tracking-widest">Hi, {firstName}</p>
        </div>
        <button type="button" onClick={onSignOut} className="flex items-center gap-2 text-xs text-textMuted hover:text-textSecondary">
          {user.photoURL && (
            <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
          )}
          <span>Sign out</span>
        </button>
      </header>

      {/* Main — start button */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8">
        {/* Big talk button */}
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/session')}
            className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-green shadow-lg shadow-green/20 transition-all hover:bg-greenLight active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-white">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h-3v2h8v-2h-3v-2.06A9 9 0 0 0 21 12v-2h-2Z" />
            </svg>
          </button>
          <p className="text-sm text-textMuted">Start talking</p>
        </div>
      </main>

      {/* Sessions list */}
      <section className="px-5 pb-8 space-y-4">
        <p className="text-xs uppercase tracking-widest text-textMuted">Your sessions</p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-bgCard animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-textMuted py-4">Your first session will appear here.</p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </section>

      {/* Bottom nav */}
      <nav className="flex border-t border-borderSubtle">
        <button
          type="button"
          className="flex-1 py-4 text-sm font-medium text-green border-t-2 border-green"
        >
          Talk
        </button>
        <button
          type="button"
          onClick={() => navigate('/report')}
          className="flex-1 py-4 text-sm text-textMuted hover:text-textSecondary"
        >
          Report
        </button>
      </nav>
    </div>
  );
}
