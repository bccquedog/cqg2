export function devLog(action: string, details?: unknown) {
  if (typeof window === 'undefined') return;
  const entry = {
    ts: new Date().toISOString(),
    action,
    details,
  };
  try {
    const key = '__cqg_dev_logs__';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    prev.unshift(entry);
    localStorage.setItem(key, JSON.stringify(prev.slice(0, 50)));
  } catch {}
}

export function getDevLogs(limit = 20) {
  if (typeof window === 'undefined') return [] as Array<any>;
  try {
    const key = '__cqg_dev_logs__';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    return prev.slice(0, limit);
  } catch {
    return [] as Array<any>;
  }
}




