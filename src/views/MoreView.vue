<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/router'
import { useToast } from '@/composables/useToast'
import { useSettingsStore, type ThemeMode } from '@/stores/settingsStore'
import { useEventStore } from '@/stores/eventStore'
import { useTheme } from '@/composables/useTheme'
import PageNav from '@/components/PageNav.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const toast = useToast()
const settings = useSettingsStore()
const store = useEventStore()
const { setMode } = useTheme()

interface MenuItem {
  key: string
  icon: string
  label: string
  sub?: string
  tint: string
  bg: string
  to?: string
  disabled?: boolean
  hint?: string
}

/* 快捷操作：详细记录入口（摊平，不再三级跳转） */
const quickActions: MenuItem[] = [
  { key: 'smoke', icon: 'i-ph-cigarette', label: '抽烟 · 详细', sub: '诱因 / 备注', tint: '#FF3B30', bg: 'rgba(255,59,48,0.12)', to: ROUTES.SMOKE },
  { key: 'exercise', icon: 'i-ph-person-simple-run', label: '运动 · 详细', sub: '时长 / 感受', tint: '#34C759', bg: 'rgba(52,199,89,0.12)', to: ROUTES.EXERCISE },
  { key: 'mood', icon: 'i-ph-smiley', label: '心情 · 详细', sub: '此刻 / 场景', tint: '#007AFF', bg: 'rgba(0,122,255,0.12)', to: ROUTES.MOOD },
  { key: 'sexual', icon: 'i-ph-heart', label: '性 · 详细', sub: '正常 / 冲动', tint: '#FF2D55', bg: 'rgba(255,45,85,0.12)', to: ROUTES.SEXUAL },
  { key: 'sleep', icon: 'i-ph-moon', label: '睡眠 · 详细', sub: '入睡 / 起床', tint: '#5856D6', bg: 'rgba(88,86,214,0.12)', to: ROUTES.SLEEP },
  { key: 'weight', icon: 'i-ph-scales', label: '体重 · 详细', sub: 'kg / 斤', tint: '#8E8E93', bg: 'rgba(142,142,147,0.12)', to: ROUTES.WEIGHT },
]

const dataItems: MenuItem[] = [
  { key: 'reminder', icon: 'i-ph-bell', label: '提醒', sub: '本地定时', tint: '#FF9500', bg: 'rgba(255,149,0,0.12)', to: ROUTES.REMINDERS },
  { key: 'export', icon: 'i-ph-export', label: '导出与备份', tint: '#007AFF', bg: 'rgba(0,122,255,0.12)', to: ROUTES.EXPORT },
  // { key: 'checkin', icon: 'i-ph-calendar-check', label: '每日打卡', tint: '#FF9500', bg: 'rgba(255,149,0,0.12)', to: ROUTES.CHECKIN },
  { key: 'recovery', icon: 'i-ph-activity', label: '恢复概览', tint: '#34C759', bg: 'rgba(52,199,89,0.12)', to: ROUTES.RECOVERY },
  { key: 'about', icon: 'i-ph-info', label: '关于 Reset', tint: '#FF2D55', bg: 'rgba(255,45,85,0.12)', to: ROUTES.ABOUT },
]

const dangerItems: MenuItem[] = [
  { key: 'clear', icon: 'i-ph-trash', label: '清空历史记录', sub: '不可恢复', tint: '#FF3B30', bg: 'rgba(255,59,48,0.12)', to: '' },
]

const comingSoon: MenuItem[] = [
  { key: 'learning', icon: 'i-ph-book-open', label: '学习', tint: '#FF9500', bg: 'rgba(255,149,0,0.12)', disabled: true, hint: '即将上线' },
]

const themeModes: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
  { key: 'auto', label: '自动' },
]

function open(item: MenuItem) {
  if (item.disabled) return
  if (item.key === 'clear') {
    clearConfirmOpen.value = true
    return
  }
  if (!item.to) return
  router.push(item.to)
}

function onTheme(m: ThemeMode) {
  setMode(m)
}

function adjustDuration(delta: number) {
  const next = settings.defaultDuration + delta
  if (next >= 5 && next <= 180) settings.setDefaultDuration(next)
}

function adjustSmoke(delta: number) {
  const next = settings.dailySmokeGoal + delta
  if (next >= 1 && next <= 50) settings.setDailySmokeGoal(next)
}

/* ===== 清空历史记录（模态确认，不可恢复） ===== */
const clearConfirmOpen = ref(false)
function clearHistory() {
  store.clearAll()
  toast.show('已清空全部历史记录')
}

/* ===== PWA 安装 ===== */
const deferredPrompt = ref<any>(null)
const canInstall = ref(false)
function onBeforeInstall(e: Event) {
  e.preventDefault()
  deferredPrompt.value = e
  canInstall.value = true
}
async function install() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  await deferredPrompt.value.userChoice
  deferredPrompt.value = null
  canInstall.value = false
  toast.show('已添加到主屏幕')
}
onMounted(() => window.addEventListener('beforeinstallprompt', onBeforeInstall))
onUnmounted(() => window.removeEventListener('beforeinstallprompt', onBeforeInstall))
</script>

<template>
  <div class="page">
    <PageNav title="更多" :show-back="true" />

    <div class="body">
      <div class="group-label">详细记录</div>
      <div class="menu-grid">
        <button
          v-for="item in quickActions"
          :key="item.key"
          class="menu-btn"
          type="button"
          @click="open(item)"
        >
          <div class="menu-icon" :style="{ background: item.bg }">
            <i :class="item.icon" :style="{ color: item.tint }" />
          </div>
          <div class="menu-text">
            <div class="menu-label">{{ item.label }}</div>
            <div class="menu-sub">{{ item.sub }}</div>
          </div>
          <i class="i-ph-caret-right menu-arrow" />
        </button>
      </div>

      <div class="group-label">数据与设置</div>
      <div class="card">
        <!-- 外观：行内切换 -->
        <div class="row">
          <div class="row-label">
            <i class="i-ph-palette row-icon" />
            <span>外观</span>
          </div>
          <div class="seg">
            <button
              v-for="m in themeModes"
              :key="m.key"
              class="seg-btn"
              :class="{ active: settings.themeMode === m.key }"
              type="button"
              @click="onTheme(m.key)"
            >{{ m.label }}</button>
          </div>
        </div>
        <div class="row-divider" />
        <!-- 默认运动时长：行内步进 -->
        <div class="row">
          <div class="row-label">
            <i class="i-ph-timer row-icon" />
            <span>默认运动时长</span>
          </div>
          <div class="stepper">
            <button class="step-btn" type="button" @click="adjustDuration(-5)"><i class="i-ph-minus" /></button>
            <span class="step-num">{{ settings.defaultDuration }}<small>分</small></span>
            <button class="step-btn" type="button" @click="adjustDuration(5)"><i class="i-ph-plus" /></button>
          </div>
        </div>
        <div class="row-divider" />
        <!-- 每日抽烟目标：行内步进 -->
        <div class="row">
          <div class="row-label">
            <i class="i-ph-cigarette row-icon" style="color: #FF3B30" />
            <span>每日抽烟目标</span>
          </div>
          <div class="stepper">
            <button class="step-btn" type="button" @click="adjustSmoke(-1)"><i class="i-ph-minus" /></button>
            <span class="step-num">{{ settings.dailySmokeGoal }}<small>支</small></span>
            <button class="step-btn" type="button" @click="adjustSmoke(1)"><i class="i-ph-plus" /></button>
          </div>
        </div>
      </div>

      <div class="menu-grid" style="margin-top: 12px">
        <button
          v-for="item in dataItems"
          :key="item.key"
          class="menu-btn"
          type="button"
          @click="open(item)"
        >
          <div class="menu-icon" :style="{ background: item.bg }">
            <i :class="item.icon" :style="{ color: item.tint }" />
          </div>
          <span class="menu-label">{{ item.label }}</span>
          <i class="i-ph-caret-right menu-arrow" />
        </button>
      </div>

      <div class="menu-grid" style="margin-top: 12px">
        <button
          v-for="item in dangerItems"
          :key="item.key"
          class="menu-btn menu-btn--danger"
          type="button"
          @click="open(item)"
        >
          <div class="menu-icon" :style="{ background: item.bg }">
            <i :class="item.icon" :style="{ color: item.tint }" />
          </div>
          <div class="menu-text">
            <div class="menu-label">{{ item.label }}</div>
            <div class="menu-sub">{{ item.sub }}</div>
          </div>
          <i class="i-ph-caret-right menu-arrow" />
        </button>
      </div>

      <div class="group-label">即将上线</div>
      <div class="menu-grid">
        <button
          v-for="item in comingSoon"
          :key="item.key"
          class="menu-btn menu-btn--disabled"
          type="button"
          disabled
        >
          <div class="menu-icon" :style="{ background: item.bg }">
            <i :class="item.icon" :style="{ color: item.tint }" />
          </div>
          <span class="menu-label">{{ item.label }}</span>
          <span class="menu-hint">{{ item.hint }}</span>
        </button>
      </div>

      <div v-if="canInstall" class="install-card">
        <div class="install-text">
          <i class="i-ph-device-mobile" />
          <div>
            <div class="install-title">安装到主屏幕</div>
            <div class="install-sub">像原生 App 一样随时打开</div>
          </div>
        </div>
        <button class="install-btn" type="button" @click="install">安装</button>
      </div>

      <div class="about-foot">
        <div class="app-mark">🌱</div>
        <div class="app-name">Reset · 正是修行时</div>
        <div class="app-ver">酒色财气接从良</div>
      </div>
    </div>

    <!-- 清空历史记录确认模态（不可恢复） -->
    <ConfirmDialog
      v-model="clearConfirmOpen"
      title="清空历史记录"
      message="将删除全部修行记录（抽烟、运动、体重等），此操作不可恢复。确定继续吗？"
      confirm-text="清空"
      danger
      @confirm="clearHistory"
    />
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 12px 20px calc(var(--safe-bottom) + 24px); }

.group-label {
  font-size: 13px; font-weight: 600; color: var(--text2);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin: 20px 4px 12px;
}

.menu-grid { display: flex; flex-direction: column; gap: 10px; }
.menu-btn {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px;
  border-radius: 16px; border: 1px solid var(--sep); background: var(--card);
  cursor: pointer; text-align: left; transition: all 0.2s var(--spring);
}
.menu-btn:active { transform: scale(0.98); }
.menu-btn--disabled { opacity: 0.55; cursor: default; }
.menu-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.menu-text { flex: 1; min-width: 0; }
.menu-label { font-size: 16px; font-weight: 600; color: var(--text); }
.menu-sub { font-size: 12px; color: var(--text2); margin-top: 2px; }
.menu-arrow { font-size: 18px; color: var(--text3); }
.menu-hint {
  font-size: 11px; font-weight: 500; color: var(--text3);
  background: rgba(142, 142, 147, 0.1); padding: 3px 8px; border-radius: 8px;
}

.menu-btn--danger {
  border-color: rgba(255, 59, 48, 0.18);
  background: rgba(255, 59, 48, 0.04);
}
.menu-btn--danger .menu-label { color: var(--red); }

/* 行内设置卡片 */
.card {
  border-radius: 16px; background: var(--card);
  border: 1px solid var(--sep); box-shadow: var(--shadow);
  padding: 4px 16px;
}
.row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 0;
}
.row-label { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--text); }
.row-icon { font-size: 20px; color: var(--green); }
.row-divider { height: 0.5px; background: var(--sep); }

.seg { display: flex; background: var(--bg); border-radius: 12px; padding: 3px; gap: 3px; }
.seg-btn {
  padding: 8px 14px; border: none; border-radius: 9px; background: transparent;
  font-size: 14px; font-weight: 600; color: var(--text2); cursor: pointer; font-family: inherit;
  transition: all 0.2s var(--spring);
}
.seg-btn.active { background: var(--green); color: #fff; }

.stepper { display: flex; align-items: center; gap: 12px; }
.step-btn {
  width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--sep);
  background: transparent; display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--text); cursor: pointer; transition: all 0.15s ease;
}
.step-btn:active { background: var(--green); border-color: var(--green); color: #fff; }
.step-num { font-size: 18px; font-weight: 700; color: var(--text); min-width: 56px; text-align: center; }
.step-num small { font-size: 12px; font-weight: 500; color: var(--text2); margin-left: 2px; }

.install-card {
  margin-top: 24px; padding: 16px; border-radius: 16px;
  background: rgba(52, 199, 89, 0.08); border: 1px solid rgba(52, 199, 89, 0.2);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.install-text { display: flex; align-items: center; gap: 12px; }
.install-text > i { font-size: 26px; color: var(--green); }
.install-title { font-size: 15px; font-weight: 600; color: var(--text); }
.install-sub { font-size: 12px; color: var(--text2); margin-top: 2px; }
.install-btn {
  padding: 8px 18px; border-radius: 20px; border: none;
  background: var(--green); color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: inherit; white-space: nowrap;
}
.install-btn:active { opacity: 0.85; }

.about-foot { text-align: center; margin-top: 36px; }
.app-mark { font-size: 30px; }
.app-name { font-size: 15px; font-weight: 700; color: var(--text); margin-top: 8px; }
.app-ver { font-size: 12px; color: var(--text2); margin-top: 4px; }
</style>
