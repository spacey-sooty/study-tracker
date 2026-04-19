<script setup lang="ts">
import type { CategoryId, DailyQuest } from "../lib/types";
import PixelProgress from "./PixelProgress.vue";
import { dailyQuestProgress, dailyQuestTitle } from "../lib/daily";

type Props = {
  quest: DailyQuest;
  dailySecondsTotal: number;
  dailyCategorySeconds: Record<CategoryId, number>;
  dailyQuestsEnded: number;
  catNameById: Record<CategoryId, string>;
  accent?: string;
};

const props = withDefaults(defineProps<Props>(), {
  accent: "#ffffff"
});

function progress() {
  // Build a minimal DailyState-like object for the helper.
  return dailyQuestProgress(
    {
      date: "x",
      quests: [],
      stats: {
        secondsTotal: props.dailySecondsTotal,
        categorySeconds: props.dailyCategorySeconds,
        questsEnded: props.dailyQuestsEnded
      }
    },
    props.quest
  );
}
</script>

<template>
  <div class="dq" :class="{ done: !!quest.completedAtMs }">
    <div class="dq__top">
      <div class="dq__title">{{ dailyQuestTitle(quest, props.catNameById) }}</div>
      <div class="dq__tag">{{ quest.completedAtMs ? "Cleared" : "Daily" }}</div>
    </div>
    <PixelProgress :value="progress()" :accent="props.accent" />
  </div>
</template>

<style scoped>
.dq {
  padding: 12px;
  background: rgba(0, 0, 0, 0.22);
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08);
}

.dq.done {
  opacity: 0.82;
  filter: saturate(0.9);
}

.dq__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
  margin-bottom: 8px;
}

.dq__title {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 12px;
}

.dq__tag {
  font-size: 11px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>

