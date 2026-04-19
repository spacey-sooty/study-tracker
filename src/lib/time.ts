export function clampNonNegativeInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function formatHMS(totalSeconds: number) {
  const s = clampNonNegativeInt(totalSeconds);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return [hh, mm, ss].map((x) => String(x).padStart(2, "0")).join(":");
}

export function formatShort(totalSeconds: number) {
  const s = clampNonNegativeInt(totalSeconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}m ${ss}s`;
}

