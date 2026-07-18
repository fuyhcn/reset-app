<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import BaseToast from '@/components/BaseToast.vue'
import ReminderAlert from '@/components/ReminderAlert.vue'
import { useReminderScheduler } from '@/composables/useReminderScheduler'

// 启动本地提醒调度器（前台轮询，到点触发）
useReminderScheduler().start()

const router = useRouter()
const direction = ref<'forward' | 'backward'>('forward')

// 维护历史栈，用于判断前进 / 后退
const historyStack = ref<string[]>([router.currentRoute.value.path])

router.beforeEach((to, from, next) => {
  const toPath = to.path
  const fromPath = from.path
  if (toPath === fromPath) {
    next()
    return
  }
  const idx = historyStack.value.lastIndexOf(toPath)
  if (idx !== -1 && idx < historyStack.value.length - 1) {
    // 回到栈中更早的页面 → 后退
    direction.value = 'backward'
    historyStack.value = historyStack.value.slice(0, idx + 1)
  } else {
    // 新页面或同级跳转 → 前进
    direction.value = 'forward'
    historyStack.value.push(toPath)
  }
  next()
})

const transitionName = computed(() =>
  direction.value === 'forward' ? 'slide-forward' : 'slide-backward'
)
</script>

<template>
  <AppShell>
    <router-view v-slot="{ Component }">
      <transition :name="transitionName">
        <keep-alive>
          <component :is="Component" class="page-view" />
        </keep-alive>
      </transition>
    </router-view>
    <!-- 全局轻提示（支持 5s 撤销） -->
    <BaseToast />
    <!-- 本地提醒弹层（无服务器，应用内定时提醒） -->
    <ReminderAlert />
  </AppShell>
</template>

<style>
.page-view {
  background: var(--bg);
  min-height: 100dvh;
}

/* 页面切换：iOS 风格方向感知整页侧滑
 * 前进：新页从右进入，旧页向左退出
 * 后退：新页从左进入，旧页向右退出
 */
.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-backward-enter-active,
.slide-backward-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100dvh;
  will-change: transform, opacity;
  transition: transform 0.35s var(--spring), opacity 0.35s ease;
}
.slide-forward-enter-active,
.slide-backward-enter-active {
  z-index: 2;
}
.slide-forward-leave-active,
.slide-backward-leave-active {
  z-index: 1;
}

/* 前进 */
.slide-forward-enter-from {
  transform: translateX(100%);
  opacity: 1;
}
.slide-forward-leave-to {
  transform: translateX(-28%);
  opacity: 0.55;
}

/* 后退 */
.slide-backward-enter-from {
  transform: translateX(-28%);
  opacity: 0.55;
}
.slide-backward-leave-to {
  transform: translateX(100%);
  opacity: 0.55;
}

/* 离开页加暗色蒙版，减少残影/拖影 */
.slide-forward-leave-active::after,
.slide-backward-leave-active::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.12);
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}
.slide-forward-leave-to::after,
.slide-backward-leave-to::after {
  opacity: 1;
}
</style>
