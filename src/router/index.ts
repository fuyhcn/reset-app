/**
 * Reset 路由表
 *
 * 约定：
 * - 所有路径集中在 ROUTES 常量中，禁止在业务代码里硬编码字符串路径。
 * - 根入口 showBack=false；子页面统一使用 <PageNav :title :show-back="true" />。
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

/** 统一路径常量 */
export const ROUTES = {
  TODAY: '/',
  SMOKE: '/smoke',
  EXERCISE: '/exercise',
  MOOD: '/mood',
  SEXUAL: '/sexual',
  SLEEP: '/sleep',
  WEIGHT: '/weight',
  REMINDERS: '/reminders',
  MORE: '/more',
  RECOVERY: '/recovery',
  EXPORT: '/export',
  ABOUT: '/about',
  CHECKIN: '/checkin',
} as const

const routes: RouteRecordRaw[] = [
  {
    path: ROUTES.TODAY,
    name: 'today',
    component: () => import('@/views/TodayView.vue'),
    meta: { title: 'Reset', showBack: false },
  },
  {
    path: ROUTES.SMOKE,
    name: 'smoke',
    component: () => import('@/views/SmokeView.vue'),
    meta: { title: '抽烟记录', showBack: true },
  },
  {
    path: ROUTES.EXERCISE,
    name: 'exercise',
    component: () => import('@/views/ExerciseView.vue'),
    meta: { title: '运动记录', showBack: true },
  },
  {
    path: ROUTES.MOOD,
    name: 'mood',
    component: () => import('@/views/MoodView.vue'),
    meta: { title: '心情记录', showBack: true },
  },
  {
    path: ROUTES.SEXUAL,
    name: 'sexual',
    component: () => import('@/views/SexualView.vue'),
    meta: { title: '自控', showBack: true },
  },
  {
    path: ROUTES.SLEEP,
    name: 'sleep',
    component: () => import('@/views/SleepView.vue'),
    meta: { title: '睡眠记录', showBack: true },
  },
  {
    path: ROUTES.WEIGHT,
    name: 'weight',
    component: () => import('@/views/WeightView.vue'),
    meta: { title: '体重记录', showBack: true },
  },
  {
    path: ROUTES.REMINDERS,
    name: 'reminders',
    component: () => import('@/views/RemindersView.vue'),
    meta: { title: '提醒', showBack: true },
  },
  {
    path: ROUTES.MORE,
    name: 'more',
    component: () => import('@/views/MoreView.vue'),
    meta: { title: '更多', showBack: true },
  },
  {
    path: ROUTES.RECOVERY,
    name: 'recovery',
    component: () => import('@/views/RecoveryView.vue'),
    meta: { title: '恢复', showBack: true },
  },
  {
    path: ROUTES.EXPORT,
    name: 'export',
    component: () => import('@/views/ExportView.vue'),
    meta: { title: '导出数据', showBack: true },
  },
  {
    path: ROUTES.ABOUT,
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: '关于', showBack: true },
  },
  // {
  //   path: ROUTES.CHECKIN,
  //   name: 'checkin',
  //   component: () => import('@/views/CheckinView.vue'),
  //   meta: { title: '每日打卡', showBack: true },
  // },
  // 兜底：未知路径统一回到首页
  { path: '/:pathMatch(.*)*', redirect: ROUTES.TODAY },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

/** 路由切换后同步文档标题 */
router.afterEach((to) => {
  const title = (to.meta.title as string) || 'Reset'
  document.title = title
})

export default router
