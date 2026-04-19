import { computed, shallowRef } from "vue";
import type { AppStateV1, CategoryId } from "./types";
import { loadState, saveState } from "./storage";

const stateRef = shallowRef<AppStateV1>(loadState());

function commit(next: AppStateV1) {
  stateRef.value = next;
  saveState(next);
}

function cloneState(s: AppStateV1): AppStateV1 {
  // State is tiny and JSON-safe; keep cloning simple.
  return JSON.parse(JSON.stringify(s)) as AppStateV1;
}

export function useAppState() {
  const state = computed(() => stateRef.value);

  function startQuest(categoryId: CategoryId) {
    const current = stateRef.value;
    if (current.activeQuest) return;
    const next = cloneState(current);
    next.activeQuest = { categoryId, startedAtMs: Date.now() };
    commit(next);
  }

  function endQuest(endedAtMs = Date.now()) {
    const current = stateRef.value;
    if (!current.activeQuest) return { addedSeconds: 0 };

    const { startedAtMs, categoryId } = current.activeQuest;
    const addedSeconds = Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000));

    const next = cloneState(current);
    next.activeQuest = null;
    next.categories[categoryId].totalSeconds += addedSeconds;
    commit(next);
    return { addedSeconds };
  }

  function clearAllProgress() {
    const next = cloneState(stateRef.value);
    for (const id of Object.keys(next.categories) as CategoryId[]) {
      next.categories[id].totalSeconds = 0;
    }
    next.activeQuest = null;
    commit(next);
  }

  return { state, startQuest, endQuest, clearAllProgress };
}

