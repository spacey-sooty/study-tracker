<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import PixelButton from "../components/PixelButton.vue";
import PixelProgress from "../components/PixelProgress.vue";
import { useAppState } from "../lib/useAppState";
import { formatHMS, formatShort } from "../lib/time";

const router = useRouter();
const { state, endQuest } = useAppState();

const nowMs = ref(Date.now());
let t: number | undefined;
onMounted(() => {
  t = window.setInterval(() => (nowMs.value = Date.now()), 250);
});
onUnmounted(() => {
  if (t) window.clearInterval(t);
});

const active = computed(() => state.value.activeQuest);
const category = computed(() => {
  if (!active.value) return null;
  return state.value.categories[active.value.categoryId];
});

watchEffect(() => {
  if (!active.value) router.replace("/");
});

const elapsedSeconds = computed(() => {
  if (!active.value) return 0;
  return Math.max(0, Math.floor((nowMs.value - active.value.startedAtMs) / 1000));
});

function levelFromSeconds(s: number) {
  return Math.floor(Math.max(0, s) / 3600);
}
function progressFromSeconds(s: number) {
  const safe = Math.max(0, s);
  return (safe % 3600) / 3600;
}
function remainingToNextHour(s: number) {
  const safe = Math.max(0, s);
  const r = safe % 3600;
  return r === 0 ? 3600 : 3600 - r;
}

const totalAfter = computed(() => {
  if (!category.value) return 0;
  return category.value.totalSeconds + elapsedSeconds.value;
});

function onEnd() {
  endQuest();
  router.replace("/");
}
</script>

<template>
  <div class="wrap" v-if="active && category">
    <header class="top">
      <div class="top__left">
        <div class="label">Quest in progress</div>
        <div class="name">
          <span class="pip" :style="{ background: category.accent }" aria-hidden="true"></span>
          {{ category.name }}
        </div>
      </div>
      <div class="top__right">
        <PixelButton variant="danger" @click="onEnd">End quest</PixelButton>
      </div>
    </header>

    <section class="timer">
      <div class="timer__face">
        <div class="timer__time">{{ formatHMS(elapsedSeconds) }}</div>
        <div class="timer__sub">Keep going. Every minute counts.</div>
      </div>
    </section>

    <section class="panel">
      <div class="row">
        <div class="k">Current level</div>
        <div class="v">
          {{ levelFromSeconds(category.totalSeconds) }}
          <span class="hint">(after: {{ levelFromSeconds(totalAfter) }})</span>
        </div>
      </div>

      <div class="row">
        <div class="k">Progress to next</div>
        <div class="v">
          {{ formatShort(remainingToNextHour(category.totalSeconds)) }}
          <span class="hint">(after: {{ formatShort(remainingToNextHour(totalAfter)) }})</span>
        </div>
      </div>

      <PixelProgress :accent="category.accent" :value="progressFromSeconds(totalAfter)" />
    </section>
  </div>
</template>

<style scoped>
.wrap {
  max-width: 820px;
  margin: 0 auto;
  padding: 18px 16px 28px;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.2));
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08);
}

.label {
  font-size: 12px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.pip {
  width: 12px;
  height: 12px;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.85);
}

.timer {
  margin-top: 14px;
}

.timer__face {
  padding: 18px 14px;
  background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.08), transparent 45%),
    rgba(0, 0, 0, 0.25);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.14),
    0 0 0 4px rgba(0, 0, 0, 0.7),
    0 18px 80px rgba(0, 0, 0, 0.4);
}

.timer__time {
  font-size: 34px;
  letter-spacing: 0.14em;
  text-shadow:
    0 2px 0 rgba(0, 0, 0, 0.85),
    0 0 18px rgba(80, 183, 255, 0.25);
}

.timer__sub {
  margin-top: 10px;
  opacity: 0.85;
}

.panel {
  margin-top: 14px;
  padding: 14px;
  background: var(--panel);
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08);
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
}

.k {
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
}

.v {
  text-align: right;
}

.hint {
  opacity: 0.65;
  margin-left: 8px;
  font-size: 12px;
}

@media (max-width: 720px) {
  .top {
    flex-direction: column;
    align-items: stretch;
  }
  .top__right :deep(.px-btn) {
    width: 100%;
  }
  .row {
    flex-direction: column;
  }
  .v {
    text-align: left;
  }
}
</style>
