<template>
  <div class="app-shell">
    <slot />
  </div>
</template>

<style scoped>
.app-shell {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  background: var(--bg);
  color: var(--text);
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  position: relative;
  /* clip 裁掉路由切换时的横向溢出，但不建立滚动容器，保证子页面 sticky 顶栏正常固定 */
  overflow-x: clip;
}
</style>
