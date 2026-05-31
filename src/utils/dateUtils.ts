import type { Session } from '../types';

export function groupByMonth(sessions: Session[]) {
  const monthMap = new Map<string, Session[]>();
  sessions.forEach((session) => {
    const key = session.date.slice(0, 7);
    const list = monthMap.get(key) ?? [];
    list.push(session);
    monthMap.set(key, list);
  });

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, sessions]) => ({
      key,
      label: new Date(`${key}-01`).toLocaleString('en-US', { month: 'short' }),
      sessions
    }));
}
