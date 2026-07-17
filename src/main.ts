import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import { useTheme } from '@/composables/useTheme'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import './style.css'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.use(router)
// 在挂载前应用主题，避免首屏闪烁
useTheme().initTheme()
app.mount('#app')
