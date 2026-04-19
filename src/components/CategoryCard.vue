<script setup lang="ts">
import PixelButton from "./PixelButton.vue";
import PixelProgress from "./PixelProgress.vue";
import { formatShort } from "../lib/time";

type Props = {
  name: string;
  accent: string;
  totalSeconds: number;
  disabled?: boolean;
};

const props = withDefaults(defineProps<Props>(), { disabled: false });
const emit = defineEmits<{ start: [] }>();

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
</script>

<template>
  <section class="card" :style="{ '--accent': props.accent }">
    <header class="card__hd">
      <div class="badge" aria-hidden="true"></div>
      <div class="title">
        <div class="name">{{ props.name }}</div>
        <div class="sub">
          Level <span class="lvl">{{ levelFromSeconds(props.totalSeconds) }}</span>
          <span class="dot">•</span>
          {{ formatShort(remainingToNextHour(props.totalSeconds)) }} to next
        </div>
      </div>
    </header>

    <PixelProgress :value="progressFromSeconds(props.totalSeconds)" :accent="props.accent" />

    <div class="card__ft">
      <PixelButton :disabled="props.disabled" @click="emit('start')">Start quest</PixelButton>
    </div>
  </section>
</template>

<style scoped>
.card {
  --accent: #50b7ff;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.16)),
    var(--panel);
  padding: 14px;
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08),
    0 18px 60px rgba(0, 0, 0, 0.38);
}

.card__hd {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.badge {
  width: 18px;
  height: 18px;
  background: var(--accent);
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.12) inset;
}

.name {
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sub {
  margin-top: 3px;
  font-size: 12px;
  opacity: 0.86;
}

.lvl {
  color: var(--accent);
}

.dot {
  margin: 0 6px;
  opacity: 0.6;
}

.card__ft {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
