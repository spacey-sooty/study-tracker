import type { AppSettings, AppStateV1, AppStateV2, AppStateV3, Category, CategoryId, DailyQuestTemplate } from "./types";
import { localISODateToday } from "./date";
import { generateDailyQuests, makeEmptyDaily } from "./daily";

const STORAGE_KEY = "study-tracker.state";
const LEGACY_STORAGE_KEY = "kaelie.state";

const DEFAULT_CATEGORIES: Record<CategoryId, Omit<Category, "totalSeconds">> = {
  body: { id: "body", name: "Modern History", accent: "#8b5a2b" }, // brown
  mind: { id: "mind", name: "Methods", accent: "#e53935" }, // red
  craft: { id: "craft", name: "Specialist", accent: "#fb8c00" }, // orange
  social: { id: "social", name: "Literature", accent: "#fdd835" }, // yellow
  spirit: { id: "spirit", name: "Chemistry", accent: "#43a047" }, // green
  wealth: { id: "wealth", name: "Physics", accent: "#1e88e5" } // blue
};

function coerceTemplates(v: unknown): DailyQuestTemplate[] {
  if (!Array.isArray(v)) return defaultSettings().dailyQuestTemplates;
  const out: DailyQuestTemplate[] = [];
  for (const t of v) {
    if (!t || typeof t !== "object") continue;
    const kind = (t as any).kind;
    if (kind === "anySeconds" && typeof (t as any).targetMinutes === "number") {
      out.push({ kind, targetMinutes: (t as any).targetMinutes });
    } else if (
      kind === "categorySeconds" &&
      typeof (t as any).targetMinutes === "number" &&
      typeof (t as any).categoryId === "string"
    ) {
      out.push({ kind, categoryId: (t as any).categoryId as CategoryId, targetMinutes: (t as any).targetMinutes });
    } else if (kind === "questsEnded" && typeof (t as any).targetCount === "number") {
      out.push({ kind, targetCount: (t as any).targetCount });
    }
    if (out.length >= 6) break;
  }
  return out.length ? out : defaultSettings().dailyQuestTemplates;
}

export function makeInitialState(): AppStateV1 {
  const categories = Object.fromEntries(
    Object.entries(DEFAULT_CATEGORIES).map(([id, c]) => [
      id,
      { ...c, totalSeconds: 0 }
    ])
  ) as AppStateV1["categories"];

  return { v: 1, categories, activeQuest: null };
}

export function makeInitialStateV2(): AppStateV2 {
  const v1 = makeInitialState();
  const date = localISODateToday();
  const daily = makeEmptyDaily(date);
  daily.quests = generateDailyQuests(date, Object.keys(v1.categories) as CategoryId[]);
  return {
    v: 2,
    categories: v1.categories,
    activeQuest: null,
    daily,
    streak: { current: 0, best: 0, lastActiveDate: null },
    stats: { questsEndedTotal: 0 }
  };
}

export function defaultSettings(): AppSettings {
  const templates: DailyQuestTemplate[] = [
    { kind: "categorySeconds", categoryId: "body", targetMinutes: 30 },
    { kind: "categorySeconds", categoryId: "mind", targetMinutes: 30 },
    { kind: "anySeconds", targetMinutes: 60 }
  ];
  return { dailyQuestTemplates: templates };
}

export function makeInitialStateV3(): AppStateV3 {
  const v2 = makeInitialStateV2();
  return { ...v2, v: 3, settings: defaultSettings() };
}

function migrateToV2(parsed: AppStateV1): AppStateV2 {
  const next = makeInitialStateV2();
  next.categories = parsed.categories;
  next.activeQuest = parsed.activeQuest;
  return next;
}

function migrateV2ToV3(parsed: AppStateV2): AppStateV3 {
  const next = makeInitialStateV3();
  next.categories = parsed.categories;
  next.activeQuest = parsed.activeQuest;
  next.daily = parsed.daily;
  next.streak = parsed.streak;
  next.stats = parsed.stats;
  return next;
}

export function loadState(): AppStateV3 {
  const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return makeInitialStateV3();

  try {
    const parsed = JSON.parse(raw) as any;
    if (!parsed || (parsed.v !== 1 && parsed.v !== 2 && parsed.v !== 3)) return makeInitialStateV3();

    // Repair/merge in case categories were added/renamed in code.
    const base: AppStateV3 =
      parsed.v === 1
        ? migrateV2ToV3(migrateToV2(parsed as AppStateV1))
        : parsed.v === 2
          ? migrateV2ToV3(parsed as AppStateV2)
          : (parsed as AppStateV3);
    const next = makeInitialStateV3();

    for (const id of Object.keys(next.categories) as CategoryId[]) {
      const existing = base.categories?.[id];
      if (existing) {
        if (typeof existing.totalSeconds === "number") {
          next.categories[id].totalSeconds = Math.max(0, existing.totalSeconds);
        }
        // Always take current code's name/accent, but keep totals.
      }
    }

    if (base.activeQuest) {
      const aq = base.activeQuest;
      if (
        typeof aq.startedAtMs === "number" &&
        typeof aq.categoryId === "string" &&
        (aq.categoryId as CategoryId) in next.categories
      ) {
        next.activeQuest = { categoryId: aq.categoryId as CategoryId, startedAtMs: aq.startedAtMs };
      }
    }

    // v2/v3 fields (best-effort)
    if (base.stats && typeof base.stats.questsEndedTotal === "number") {
      next.stats.questsEndedTotal = Math.max(0, Math.floor(base.stats.questsEndedTotal));
    }
    if (base.streak) {
      next.streak.current = Math.max(0, Math.floor(base.streak.current ?? 0));
      next.streak.best = Math.max(next.streak.current, Math.floor(base.streak.best ?? 0));
      next.streak.lastActiveDate =
        typeof base.streak.lastActiveDate === "string" ? base.streak.lastActiveDate : null;
    }
    if (base.daily && typeof base.daily.date === "string" && base.daily.stats) {
      next.daily = base.daily;
    }
    if (base.settings && Array.isArray(base.settings.dailyQuestTemplates)) {
      next.settings.dailyQuestTemplates = coerceTemplates(base.settings.dailyQuestTemplates);
    }

    // Ensure daily is for today and has quests.
    const today = localISODateToday();
    if (!next.daily || next.daily.date !== today) {
      next.daily = makeEmptyDaily(today);
    }
    if (!next.daily.quests || !Array.isArray(next.daily.quests) || next.daily.quests.length === 0) {
      next.daily.quests = generateDailyQuests(today, Object.keys(next.categories) as CategoryId[]);
    }

    return next;
  } catch {
    return makeInitialStateV3();
  }
}

export function saveState(state: AppStateV3) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
