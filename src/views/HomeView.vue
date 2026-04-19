<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import CategoryCard from "../components/CategoryCard.vue";
import PixelButton from "../components/PixelButton.vue";
import { useAppState } from "../lib/useAppState";
import { formatHMS } from "../lib/time";

const router = useRouter();
const { state, startQuest, endQuest, clearAllProgress } = useAppState();

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
</script>

<template>
  <div class="wrap">
    <header class="hero">
      <div class="hero__title">Study Tracker</div>
      <div class="hero__sub">Six paths. One timer. Level up by doing.</div>
    </header>

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

