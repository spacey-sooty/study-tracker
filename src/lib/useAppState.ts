import { computed, shallowRef } from "vue";
import type { AppStateV3, CategoryId, DailyQuest, DailyQuestTemplate } from "./types";
import { loadState, saveState } from "./storage";
import { localISODateToday, localISODateYesterday } from "./date";
import {
  dailyQuestIsComplete,
  dailyQuestsFromTemplates,
  ensureDailyQuests,
  generateDailyQuests,
  makeEmptyDaily
} from "./daily";

const stateRef = shallowRef<AppStateV3>(loadState());

function commit(next: AppStateV3) {
  stateRef.value = next;
  saveState(next);
}

function cloneState(s: AppStateV3): AppStateV3 {
  // State is tiny and JSON-safe; keep cloning simple.
  return JSON.parse(JSON.stringify(s)) as AppStateV3;
}

function rollDailyIfNeeded(s: AppStateV3, nowMs: number) {
  const today = localISODateToday();
  if (!s.daily || s.daily.date !== today) {
    s.daily = makeEmptyDaily(today);
    const templates = s.settings?.dailyQuestTemplates ?? [];
    s.daily.quests =
      templates.length > 0
        ? dailyQuestsFromTemplates(today, templates)
        : generateDailyQuests(today, Object.keys(s.categories) as CategoryId[]);
  } else {
    ensureDailyQuests(s.daily, Object.keys(s.categories) as CategoryId[], s.settings?.dailyQuestTemplates);
  }
}

function markQuestCompletions(s: AppStateV3, nowMs: number) {
  for (const q of s.daily.quests) {
    if (!q.completedAtMs && dailyQuestIsComplete(s.daily, q)) {
      (q as DailyQuest).completedAtMs = nowMs;
    }
  }
}

function sanitizeTemplates(templates: DailyQuestTemplate[], categoryIds: CategoryId[]) {
  const out: DailyQuestTemplate[] = [];
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(n)));

  for (const t of templates) {
    if (!t) continue;
    if (t.kind === "anySeconds") {
      out.push({ kind: "anySeconds", targetMinutes: clamp(t.targetMinutes, 5, 240) });
    } else if (t.kind === "categorySeconds") {
      const cat = t.categoryId;
      if (!categoryIds.includes(cat)) continue;
      out.push({
        kind: "categorySeconds",
        categoryId: cat,
        targetMinutes: clamp(t.targetMinutes, 5, 240)
      });
    } else if (t.kind === "questsEnded") {
      out.push({ kind: "questsEnded", targetCount: clamp(t.targetCount, 1, 20) });
    }
    if (out.length >= 6) break;
  }

  return out;
}

export function useAppState() {
  const state = computed(() => stateRef.value);

  function startQuest(categoryId: CategoryId) {
    const current = stateRef.value;
    if (current.activeQuest) return;
    const next = cloneState(current);
    rollDailyIfNeeded(next, Date.now());
    next.activeQuest = { categoryId, startedAtMs: Date.now() };
    commit(next);
  }

  function endQuest(endedAtMs = Date.now()) {
    const current = stateRef.value;
    if (!current.activeQuest) return { addedSeconds: 0 };

    const { startedAtMs, categoryId } = current.activeQuest;
    const addedSeconds = Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000));

    const next = cloneState(current);
    rollDailyIfNeeded(next, endedAtMs);
    next.activeQuest = null;
    next.categories[categoryId].totalSeconds += addedSeconds;

    // Daily stats.
    next.daily.stats.secondsTotal += addedSeconds;
    next.daily.stats.categorySeconds[categoryId] += addedSeconds;
    next.daily.stats.questsEnded += 1;

    // Lifetime stats.
    next.stats.questsEndedTotal += 1;

    // Streaks: count a day if you ended at least one quest that day.
    const today = next.daily.date;
    const last = next.streak.lastActiveDate;
    if (last !== today) {
      if (last && localISODateYesterday(today) === last) {
        next.streak.current += 1;
      } else {
        next.streak.current = 1;
      }
      next.streak.best = Math.max(next.streak.best, next.streak.current);
      next.streak.lastActiveDate = today;
    }

    markQuestCompletions(next, endedAtMs);
    commit(next);
    return { addedSeconds };
  }

  function setDailyQuestTemplates(templates: DailyQuestTemplate[]) {
    const current = stateRef.value;
    const next = cloneState(current);
    const categoryIds = Object.keys(next.categories) as CategoryId[];
    next.settings.dailyQuestTemplates = sanitizeTemplates(templates, categoryIds);

    // Apply immediately for today's quests.
    rollDailyIfNeeded(next, Date.now());
    next.daily.quests =
      next.settings.dailyQuestTemplates.length > 0
        ? dailyQuestsFromTemplates(next.daily.date, next.settings.dailyQuestTemplates)
        : generateDailyQuests(next.daily.date, categoryIds);
    markQuestCompletions(next, Date.now());
    commit(next);
  }

  function clearAllProgress() {
    const next = cloneState(stateRef.value);
    for (const id of Object.keys(next.categories) as CategoryId[]) {
      next.categories[id].totalSeconds = 0;
    }
    next.activeQuest = null;
    next.daily = makeEmptyDaily(localISODateToday());
    next.daily.quests =
      next.settings.dailyQuestTemplates.length > 0
        ? dailyQuestsFromTemplates(next.daily.date, next.settings.dailyQuestTemplates)
        : generateDailyQuests(next.daily.date, Object.keys(next.categories) as CategoryId[]);
    next.streak = { current: 0, best: 0, lastActiveDate: null };
    next.stats = { questsEndedTotal: 0 };
    commit(next);
  }

  return { state, startQuest, endQuest, setDailyQuestTemplates, clearAllProgress };
}
