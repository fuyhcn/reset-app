<script setup lang="ts">
import PageNav from '@/components/PageNav.vue'

const points = [
  { icon: 'i-ph-lock-simple', text: '本地优先：所有记录仅保存在你的设备，不上传任何服务器。' },
  { icon: 'i-ph-heart', text: '不评价你：记录欲望比结果更重要，没有火苗、等级或排行榜。' },
  { icon: 'i-ph-arrows-clockwise', text: '事件流：每一次操作都是一条事件，可随时查看与删除。' },
  { icon: 'i-ph-plant', text: '慢慢变好：恢复是长期的，今天的一小步都算数。' },
]
</script>

<template>
  <div class="page">
    <PageNav title="关于" :show-back="true" />

    <div class="body">
      <div class="hero">
        <div class="mark">🌱</div>
        <div class="name">Reset · 正是修行时</div>
        <div class="slogan">继续恢复，慢慢变好</div>
      </div>

      <div class="card">
        <div v-for="(p, i) in points" :key="i" class="point" :class="{ 'point-line': i < points.length - 1 }">
          <i :class="p.icon" class="point-icon" />
          <p class="point-text">{{ p.text }}</p>
        </div>
      </div>

      <div class="version">Version 1.0.0 · PWA</div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 12px 20px calc(var(--safe-bottom) + 24px); }

.hero { text-align: center; padding: 28px 0 20px; }
.mark { font-size: 48px; }
.name { font-size: 20px; font-weight: 700; color: var(--text); margin-top: 12px; }
.slogan { font-size: 14px; color: var(--text2); margin-top: 6px; }

.card { background: var(--card); border-radius: 18px; padding: 8px 18px; box-shadow: var(--shadow); }
.point { display: flex; gap: 12px; align-items: flex-start; padding: 16px 0; }
.point-line { border-bottom: 0.5px solid var(--sep); }
.point-icon { font-size: 20px; color: var(--green); margin-top: 2px; flex-shrink: 0; }
.point-text { margin: 0; font-size: 14px; color: var(--text); line-height: 1.5; }

.version { text-align: center; font-size: 12px; color: var(--text2); margin-top: 24px; }
</style>
