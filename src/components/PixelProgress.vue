<script setup lang="ts">
type Props = {
  value: number; // 0..1
  accent?: string;
};

const props = withDefaults(defineProps<Props>(), {
  accent: "#50b7ff"
});
</script>

<template>
  <div class="px-prog" role="progressbar" :aria-valuenow="Math.round(props.value * 100)">
    <div class="px-prog__fill" :style="{ width: `${Math.max(0, Math.min(1, props.value)) * 100}%`, background: props.accent }" />
    <div class="px-prog__gloss" />
  </div>
</template>

<style scoped>
.px-prog {
  position: relative;
  height: 14px;
  background: rgba(0, 0, 0, 0.55);
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08) inset;
  overflow: hidden;
}

.px-prog__fill {
  height: 100%;
  width: 0%;
  image-rendering: pixelated;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.12) inset;
}

.px-prog__gloss {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 0 8px,
    rgba(255, 255, 255, 0.02) 8px 16px
  );
  mix-blend-mode: overlay;
  opacity: 0.55;
}
</style>

