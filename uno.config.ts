import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    // 🔑 dark:'class' — 由 <html> 上的 .dark 类驱动 dark: 变体（主题切换核心修正）
    presetUno({ dark: 'class' }),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  theme: {
    colors: {
      reset: {
        green: '#34C759',
        gray: '#8E8E93',
        orange: '#FF9500',
        red: '#FF3B30',
        pink: '#FF2D55',
        blue: '#007AFF',
        indigo: '#5856D6',
      },
      calm: {
        50: '#f8faf9',
        100: '#eef3f0',
        500: '#5b8a72',
        600: '#4a7260',
        900: '#1a2e25',
      },
      warm: {
        50: '#fdfbf7',
        500: '#c4956a',
      },
    },
    borderRadius: {
      gentle: '12px',
    },
    fontSize: {
      body: ['1rem', { lineHeight: '1.7' }],
    },
  },
  shortcuts: {
    'btn-primary': 'px-5 py-2.5 bg-calm-500 text-white rounded-gentle font-medium transition-all hover:bg-calm-600 active:scale-[0.98] focus-visible:ring-2 ring-calm-500/50 outline-none',
    'card-base': 'bg-calm-50 dark:bg-calm-900/30 p-6 rounded-gentle shadow-sm border border-calm-100 dark:border-calm-800/50',
    'input-base': 'w-full px-4 py-3 bg-white dark:bg-calm-900/50 border border-calm-100 dark:border-calm-800 rounded-gentle focus:border-calm-500 focus:ring-2 focus:ring-calm-500/20 outline-none transition-all placeholder:text-calm-500/50',
  },
  safelist: [
    // 动态图标：酒色财气 + 时间线 + 运动
    'i-ph-wine',
    'i-ph-heart-straight',
    'i-ph-coins',
    'i-ph-warning',
    'i-ph-cigarette',
    'i-ph-flame',
    'i-ph-person-simple-run',
    'i-ph-person-simple-walk',
    'i-ph-bicycle',
    'i-ph-barbell',
    'i-ph-racquet',
    'i-ph-drop',
    'i-ph-moon',
    'i-ph-sun',
    'i-ph-smiley',
    'i-ph-heart',
    'i-ph-scales',
    'i-ph-x',
    'i-ph-trash',
    // 提醒模块动态图标
    'i-ph-bell',
    'i-ph-bell-ringing',
    'i-ph-plus',
  ],
})
