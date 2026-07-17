<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import BaseToast from '@/components/BaseToast.vue'
import ReminderAlert from '@/components/ReminderAlert.vue'
import { useReminderScheduler } from '@/composables/useReminderScheduler'

// 启动本地提醒调度器（前台轮询，到点触发）
useReminderScheduler().start()
</script>

<template>
  <AppShell>
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <keep-alive>
          <component :is="Component" />
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
/* 页面切换：淡入 + 轻微上移，配合 keep-alive 缓存，丝滑不卡 */
.page-enter-active {
  transition: opacity 0.24s var(--spring), transform 0.24s var(--spring);
}
.page-leave-active {
  transition: opacity 0.16s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
}
</style>
