<template>
  <div class="app">
    <div class="crt" aria-hidden="true"></div>
    <router-view />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  position: relative;
}

.crt {
  pointer-events: none;
  position: fixed;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.12) 0 1px,
      rgba(0, 0, 0, 0) 1px 3px
    ),
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.08), transparent 55%);
  mix-blend-mode: overlay;
  opacity: 0.55;
}
</style>

