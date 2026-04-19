<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import CategoryCard from "../components/CategoryCard.vue";
import DailyQuestCard from "../components/DailyQuestCard.vue";
import DailyQuestConfig from "../components/DailyQuestConfig.vue";
import PixelButton from "../components/PixelButton.vue";
import { useAppState } from "../lib/useAppState";
import { formatHMS } from "../lib/time";
import type { DailyQuestTemplate } from "../lib/types";
import { defaultSettings } from "../lib/storage";

const router = useRouter();
const { state, startQuest, endQuest, setDailyQuestTemplates, clearAllProgress } = useAppState();

const nowMs = ref(Date.now());
let t: number | undefined;
onMounted(() => {
  t = window.setInterval(() => (nowMs.value = Date.now()), 250);
});
onUnmounted(() => {
  if (t) window.clearInterval(t);
});

const active = computed(() => state.value.activeQuest);
const activeCategory = computed(() => {
  if (!active.value) return null;
  return state.value.categories[active.value.categoryId];
});
const activeElapsedSeconds = computed(() => {
  if (!active.value) return 0;
  return Math.max(0, Math.floor((nowMs.value - active.value.startedAtMs) / 1000));
});

const catNameById = computed(() => {
  return Object.fromEntries(
    Object.values(state.value.categories).map((c) => [c.id, c.name])
  ) as Record<keyof typeof state.value.categories, string>;
});

const showConfig = ref(false);
const templatesDraft = ref<DailyQuestTemplate[]>([]);
watch(
  () => state.value.settings.dailyQuestTemplates,
  (t) => {
    templatesDraft.value = JSON.parse(JSON.stringify(t)) as DailyQuestTemplate[];
  },
  { immediate: true, deep: true }
);

function onStart(id: keyof typeof state.value.categories) {
  startQuest(id);
  router.push("/quest");
}

function onResume() {
  router.push("/quest");
}

function onEndFromHome() {
  endQuest();
}

function onSaveTemplates() {
  setDailyQuestTemplates(templatesDraft.value);
}

function onResetTemplates() {
  templatesDraft.value = JSON.parse(
    JSON.stringify(defaultSettings().dailyQuestTemplates)
  ) as DailyQuestTemplate[];
  setDailyQuestTemplates(templatesDraft.value);
}

function onUpdateTemplates(t: DailyQuestTemplate[]) {
  templatesDraft.value = t;
}
</script>

<template>
  <div class="wrap">
    <header class="hero">
      <div class="hero__title">Study Tracker</div>
      <div class="hero__sub">Six paths. One timer. Level up by doing.</div>
    </header>

    <section class="meta">
      <div class="meta__box">
        <div class="meta__k">Streak</div>
        <div class="meta__v">
          {{ state.streak.current }} day<span v-if="state.streak.current !== 1">s</span>
          <span class="meta__hint">best {{ state.streak.best }}</span>
        </div>
      </div>
      <div class="meta__box">
        <div class="meta__k">Today</div>
        <div class="meta__v">
          {{ Math.round(state.daily.stats.secondsTotal / 60) }} min
          <span class="meta__hint">{{ state.daily.stats.questsEnded }} quests</span>
        </div>
      </div>
    </section>

    <section class="dailies">
      <div class="dailies__hd">
        <div class="dailies__title">Daily quests</div>
        <div class="dailies__date">{{ state.daily.date }}</div>
      </div>
      <div class="dailies__grid">
        <DailyQuestCard
          v-for="q in state.daily.quests"
          :key="q.id"
          :quest="q"
          :daily-seconds-total="state.daily.stats.secondsTotal"
          :daily-category-seconds="state.daily.stats.categorySeconds"
          :daily-quests-ended="state.daily.stats.questsEnded"
          :cat-name-by-id="catNameById"
          accent="#ba55ff"
        />
      </div>

      <div class="dailies__cfg">
        <PixelButton variant="ghost" @click="showConfig = !showConfig">
          {{ showConfig ? "Hide settings" : "Configure dailies" }}
        </PixelButton>
      </div>

      <div v-if="showConfig" class="dailies__panel">
        <div class="dailies__note">
          These templates generate your daily quests each day (local time). Hit Save to apply.
        </div>
        <DailyQuestConfig
          :templates="templatesDraft"
          :categories="Object.values(state.categories)"
          @update:templates="onUpdateTemplates"
        />
        <div class="dailies__actions">
          <PixelButton @click="onSaveTemplates">Save</PixelButton>
          <PixelButton variant="ghost" @click="onResetTemplates">Reset defaults</PixelButton>
        </div>
      </div>
    </section>

    <section v-if="active && activeCategory" class="active">
      <div class="active__left">
        <div class="active__label">Active quest</div>
        <div class="active__name">
          <span class="pip" :style="{ background: activeCategory.accent }" aria-hidden="true"></span>
          {{ activeCategory.name }}
        </div>
        <div class="active__timer">{{ formatHMS(activeElapsedSeconds) }}</div>
      </div>
      <div class="active__right">
        <PixelButton @click="onResume">Resume</PixelButton>
        <PixelButton variant="danger" @click="onEndFromHome">End</PixelButton>
      </div>
    </section>

    <main class="grid">
      <CategoryCard
        v-for="c in Object.values(state.categories)"
        :key="c.id"
        :name="c.name"
        :accent="c.accent"
        :total-seconds="c.totalSeconds"
        :disabled="!!active"
        @start="onStart(c.id)"
      />
    </main>

    <footer class="foot">
      <PixelButton variant="ghost" @click="clearAllProgress">Reset progress</PixelButton>
    </footer>
  </div>
</template>

<style scoped>
.wrap {
  max-width: 980px;
  margin: 0 auto;
  padding: 18px 16px 28px;
}

.hero {
  padding: 18px 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.22));
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08),
    0 16px 70px rgba(0, 0, 0, 0.36);
}

.hero__title {
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.hero__sub {
  margin-top: 6px;
  opacity: 0.85;
}

.meta {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.meta__box {
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.22);
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08);
}

.meta__k {
  font-size: 12px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.meta__v {
  margin-top: 6px;
  font-size: 16px;
  letter-spacing: 0.06em;
}

.meta__hint {
  margin-left: 10px;
  opacity: 0.65;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dailies {
  margin-top: 14px;
  padding: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.18));
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08);
}

.dailies__hd {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
  margin-bottom: 10px;
}

.dailies__title {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  opacity: 0.88;
}

.dailies__date {
  opacity: 0.65;
  font-size: 12px;
  letter-spacing: 0.1em;
}

.dailies__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.dailies__cfg {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.dailies__panel {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px dashed rgba(255, 255, 255, 0.18);
}

.dailies__note {
  opacity: 0.78;
  margin-bottom: 10px;
}

.dailies__actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.active {
  margin-top: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: rgba(0, 0, 0, 0.28);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.14),
    0 0 0 4px rgba(0, 0, 0, 0.7);
}

.active__label {
  font-size: 12px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.active__name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  font-size: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pip {
  width: 12px;
  height: 12px;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.85);
}

.active__timer {
  margin-top: 6px;
  font-size: 20px;
  letter-spacing: 0.12em;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.8);
}

.active__right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.foot {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .meta {
    grid-template-columns: 1fr;
  }
  .dailies__grid {
    grid-template-columns: 1fr;
  }
  .grid {
    grid-template-columns: 1fr;
  }
  .active {
    flex-direction: column;
    align-items: stretch;
  }
  .active__right {
    justify-content: stretch;
  }
  .active__right :deep(.px-btn) {
    width: 100%;
  }
}
</style>
