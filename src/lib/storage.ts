import type { AppStateV1, Category, CategoryId } from "./types";

const STORAGE_KEY = "kaelie.state";

const DEFAULT_CATEGORIES: Record<CategoryId, Omit<Category, "totalSeconds">> = {
  body: { id: "body", name: "Modern History", accent: "#8b5a2b" }, // brown
  mind: { id: "mind", name: "Methods", accent: "#e53935" }, // red
  craft: { id: "craft", name: "Specialist", accent: "#fb8c00" }, // orange
  social: { id: "social", name: "Literature", accent: "#fdd835" }, // yellow
  spirit: { id: "spirit", name: "Chemistry", accent: "#43a047" }, // green
  wealth: { id: "wealth", name: "Physics", accent: "#1e88e5" } // blue
};

export function makeInitialState(): AppStateV1 {
  const categories = Object.fromEntries(
    Object.entries(DEFAULT_CATEGORIES).map(([id, c]) => [
      id,
      { ...c, totalSeconds: 0 }
    ])
  ) as AppStateV1["categories"];

  return { v: 1, categories, activeQuest: null };
}

export function loadState(): AppStateV1 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return makeInitialState();

  try {
    const parsed = JSON.parse(raw) as Partial<AppStateV1> | null;
    if (!parsed || parsed.v !== 1) return makeInitialState();

    // Repair/merge in case categories were added/renamed in code.
    const next = makeInitialState();
    for (const id of Object.keys(next.categories) as CategoryId[]) {
      const existing = parsed.categories?.[id];
      if (existing && typeof existing.totalSeconds === "number") {
        next.categories[id].totalSeconds = Math.max(0, existing.totalSeconds);
      }
    }

    if (
      parsed.activeQuest &&
      typeof parsed.activeQuest.startedAtMs === "number" &&
      typeof parsed.activeQuest.categoryId === "string" &&
      (parsed.activeQuest.categoryId as CategoryId) in next.categories
    ) {
      next.activeQuest = {
        categoryId: parsed.activeQuest.categoryId as CategoryId,
        startedAtMs: parsed.activeQuest.startedAtMs
      };
    }

    return next;
  } catch {
    return makeInitialState();
  }
}

export function saveState(state: AppStateV1) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
