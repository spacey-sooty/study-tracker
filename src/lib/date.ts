export function localISODateFromMs(ms: number) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function localISODateToday() {
  return localISODateFromMs(Date.now());
}

export function localISODateYesterday(fromDate: string) {
  // fromDate: YYYY-MM-DD in local time
  const [y, m, d] = fromDate.split("-").map((x) => Number(x));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() - 1);
  return localISODateFromMs(dt.getTime());
}

