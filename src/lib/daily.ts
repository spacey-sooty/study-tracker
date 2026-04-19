import type { CategoryId, DailyQuest, DailyQuestTemplate, DailyState } from "./types";
import { localISODateToday } from "./date";

function hashStringToSeed(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(r: () => number, xs: T[]) {
  return xs[Math.floor(r() * xs.length)]!;
}

function pickDistinct<T>(r: () => number, xs: T[], n: number) {
  const pool = xs.slice();
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const idx = Math.floor(r() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

export function makeEmptyDaily(date = localISODateToday()): DailyState {
  const categorySeconds: Record<CategoryId, number> = {
    body: 0,
    mind: 0,
    craft: 0,
    social: 0,
    spirit: 0,
    wealth: 0
  };

  return {
    date,
    stats: { secondsTotal: 0, categorySeconds, questsEnded: 0 },
    quests: []
  };
}

export function generateDailyQuests(date: string, categoryIds: CategoryId[]): DailyQuest[] {
  const seed = hashStringToSeed(`study-tracker:${date}`);
  const r = mulberry32(seed);

  const timeTargets = [20, 25, 30, 45, 60].map((m) => m * 60);
  const countTargets = [1, 2, 3];

  const [c1, c2] = pickDistinct(r, categoryIds, 2);
  const q1: DailyQuest = {
    id: `cat-${date}-${c1}`,
    kind: "categorySeconds",
    categoryId: c1!,
    targetSeconds: pickOne(r, timeTargets)
  };
  const q2: DailyQuest = {
    id: `cat-${date}-${c2}`,
    kind: "categorySeconds",
    categoryId: c2!,
    targetSeconds: pickOne(r, timeTargets)
  };

  // Rotate the 3rd quest type.
  const thirdKind = r() < 0.5 ? "anySeconds" : "questsEnded";
  const q3: DailyQuest =
    thirdKind === "anySeconds"
      ? {
          id: `any-${date}`,
          kind: "anySeconds",
          targetSeconds: pickOne(r, [45 * 60, 60 * 60, 75 * 60])
        }
      : {
          id: `end-${date}`,
          kind: "questsEnded",
          targetCount: pickOne(r, countTargets)
        };

  return [q1, q2, q3];
}

export function dailyQuestsFromTemplates(date: string, templates: DailyQuestTemplate[]): DailyQuest[] {
  const out: DailyQuest[] = [];
  for (let i = 0; i < templates.length; i++) {
    const t = templates[i]!;
    if (t.kind === "anySeconds") {
      out.push({
        id: `any-${date}-${i}`,
        kind: "anySeconds",
        targetSeconds: Math.max(0, Math.floor(t.targetMinutes * 60))
      });
    } else if (t.kind === "categorySeconds") {
      out.push({
        id: `cat-${date}-${t.categoryId}-${i}`,
        kind: "categorySeconds",
        categoryId: t.categoryId,
        targetSeconds: Math.max(0, Math.floor(t.targetMinutes * 60))
      });
    } else {
      out.push({
        id: `end-${date}-${i}`,
        kind: "questsEnded",
        targetCount: Math.max(0, Math.floor(t.targetCount))
      });
    }
  }
  return out;
}

export function ensureDailyQuests(
  daily: DailyState,
  categoryIds: CategoryId[],
  templates?: DailyQuestTemplate[]
) {
  if (!daily.quests.length) {
    const usableTemplates = (templates ?? []).filter(Boolean);
    daily.quests =
      usableTemplates.length > 0
        ? dailyQuestsFromTemplates(daily.date, usableTemplates)
        : generateDailyQuests(daily.date, categoryIds);
  }
}

export function dailyQuestProgress(daily: DailyState, q: DailyQuest) {
  if (q.kind === "anySeconds") {
    return Math.min(1, daily.stats.secondsTotal / q.targetSeconds);
  }
  if (q.kind === "categorySeconds") {
    return Math.min(1, daily.stats.categorySeconds[q.categoryId] / q.targetSeconds);
  }
  return Math.min(1, daily.stats.questsEnded / q.targetCount);
}

export function dailyQuestIsComplete(daily: DailyState, q: DailyQuest) {
  return dailyQuestProgress(daily, q) >= 1;
}

export function dailyQuestTitle(q: DailyQuest, catNameById: Record<CategoryId, string>) {
  if (q.kind === "anySeconds") return `Study for ${Math.round(q.targetSeconds / 60)} min total`;
  if (q.kind === "categorySeconds")
    return `${catNameById[q.categoryId]} for ${Math.round(q.targetSeconds / 60)} min`;
  return `Finish ${q.targetCount} quest${q.targetCount === 1 ? "" : "s"}`;
}
