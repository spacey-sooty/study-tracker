<script setup lang="ts">
type Props = {
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  disabled: false
});
</script>

<template>
  <button class="px-btn" :class="`is-${props.variant}`" :disabled="props.disabled">
    <slot />
  </button>
</template>

<style scoped>
.px-btn {
  --btn-bg: var(--panel);
  --btn-fg: var(--text);
  --btn-shadow: rgba(0, 0, 0, 0.45);

  appearance: none;
  border: 0;
  color: var(--btn-fg);
  background: var(--btn-bg);
  padding: 12px 14px;
  font: inherit;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  user-select: none;

  /* pixel-ish border */
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.8),
    0 0 0 4px rgba(255, 255, 255, 0.12),
    0 6px 0 0 var(--btn-shadow);

  transform: translateY(0);
  transition: transform 120ms steps(2, end), box-shadow 120ms steps(2, end),
    filter 120ms steps(2, end);
}

.px-btn:hover:not(:disabled) {
  filter: brightness(1.08) contrast(1.05);
}

.px-btn:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08),
    0 2px 0 0 var(--btn-shadow);
}

.px-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.px-btn.is-primary {
  --btn-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.12)),
    var(--panel);
}

.px-btn.is-ghost {
  --btn-bg: transparent;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.18),
    0 0 0 4px rgba(0, 0, 0, 0.65),
    0 6px 0 0 var(--btn-shadow);
}

.px-btn.is-danger {
  --btn-bg: linear-gradient(180deg, rgba(255, 90, 90, 0.2), rgba(0, 0, 0, 0.15)),
    rgba(255, 80, 110, 0.22);
}
</style>

