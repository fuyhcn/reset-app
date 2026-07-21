<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { computeRecovery } from '@/composables/useRecovery'
import PageNav from '@/components/PageNav.vue'
import ShareCardSheet from '@/components/ShareCardSheet.vue'

const store = useEventStore()
const result = computed(() => computeRecovery(store.events, 7))
const score = computed(() => result.value.score)
const parts = computed(() => result.value.parts)
const shareOpen = ref(false)

const R = 52
const C = 2 * Math.PI * R
const dashOffset = computed(() => C * (1 - score.value / 100))

const insight = computed(() => {
  const s = score.value
  if (s >= 80) return '这一周你稳住了，了不起。'
  if (s >= 60) return '你正在一点点变好，继续。'
  if (s >= 40) return '动起来、早点睡，都会让数字往上走。'
  return '今天的记录，就是改变的开始。'
})

const band = computed(() => {
  const s = score.value
  if (s >= 80) return '状态很稳'
  if (s >= 60) return '正在恢复'
  if (s >= 40) return '慢慢来'
  return '刚刚开始'
})
</script>

<template>
  <div class="page">
    <PageNav title="恢复" :show-back="true" />

    <div class="body">
      <div class="ring-card">
        <svg class="ring" viewBox="0 0 120 120">
          <circle class="ring-bg" cx="60" cy="60" :r="R" />
          <circle
            class="ring-fg"
            cx="60" cy="60" :r="R"
            :stroke-dasharray="C"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="ring-center">
          <div class="ring-score">{{ score }}</div>
          <div class="ring-label">恢复指数</div>
        </div>
      </div>

      <div class="status-line">
        <i class="i-ph-plant" />
        <span>{{ band }}</span>
      </div>

      <div class="parts">
        <div v-for="p in parts" :key="p.key" class="part">
          <div class="part-head">
            <span class="part-label">{{ p.label }}</span>
            <span class="part-detail">{{ p.detail }}</span>
          </div>
          <div class="bar">
            <div class="bar-fill" :style="{ width: `${Math.round(p.ratio * 100)}%`, background: p.color }" />
          </div>
        </div>
      </div>

      <div class="note">
        恢复指数基于近 7 天：吸烟克制 30% · 运动达标 25% · 睡眠充足 25% · 掌控力 20%。<br />
        它是一个给自己看的参考信号，不是考核、不是排名。
      </div>

      <div class="insight">
        <i class="i-ph-lightbulb" />
        <p>{{ insight }}</p>
      </div>

      <button class="share-btn" type="button" @click="shareOpen = true">
        <i class="i-ph-share-network" />
        <span>生成分享卡片</span>
      </button>
    </div>

    <ShareCardSheet v-model="shareOpen" :score="score" :parts="parts" :band="band" />
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 8px 20px calc(var(--safe-bottom) + 24px); }

.ring-card {
  position: relative; width: 200px; height: 200px; margin: 24px auto 8px;
  display: flex; align-items: center; justify-content: center;
}
.ring { width: 200px; height: 200px; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--sep); stroke-width: 10; }
.ring-fg {
  fill: none; stroke: var(--green); stroke-width: 10; stroke-linecap: round;
  transition: stroke-dashoffset 0.6s var(--spring);
}
.ring-center { position: absolute; text-align: center; }
.ring-score { font-size: 56px; font-weight: 800; color: var(--text); line-height: 1; letter-spacing: -2px; }
.ring-label { font-size: 14px; color: var(--text2); margin-top: 6px; }

.status-line {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 18px; font-weight: 700; color: var(--text); margin: 12px 0 28px;
}
.status-line i { font-size: 20px; color: var(--green); }

.parts { display: flex; flex-direction: column; gap: 18px; }
.part-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.part-label { font-size: 15px; font-weight: 600; color: var(--text); }
.part-detail { font-size: 12px; color: var(--text2); }
.bar { height: 10px; border-radius: 6px; background: var(--sep); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s var(--spring); }

.note {
  margin-top: 24px; padding: 14px 16px; border-radius: 14px;
  background: var(--bg); font-size: 12px; color: var(--text2); line-height: 1.6;
}

.insight {
  margin-top: 16px; padding: 16px 18px; border-radius: 16px;
  background: rgba(52, 199, 89, 0.08); display: flex; gap: 10px; align-items: flex-start;
}
.insight i { font-size: 18px; color: var(--green); margin-top: 2px; flex-shrink: 0; }
.insight p { margin: 0; font-size: 15px; color: var(--text); line-height: 1.5; }

.share-btn {
  margin-top: 24px; width: 100%; height: 54px; border-radius: 16px; border: none;
  background: var(--green); color: #fff; font-size: 16px; font-weight: 600; font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
  transition: transform 0.2s var(--spring);
}
.share-btn:active { transform: scale(0.97); }
.share-btn i { font-size: 20px; }
</style>
