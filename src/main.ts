import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ErrorReporter } from './utils/security'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (error, instance, info) => {
    ErrorReporter.reportError(error, { instance, info })
}

// 全局未捕获错误处理
window.addEventListener('error', (event) => {
    ErrorReporter.reportError(event.error, { type: 'unhandled_error' })
})

window.addEventListener('unhandledrejection', (event) => {
    ErrorReporter.reportError(event.reason, { type: 'unhandled_promise_rejection' })
})

app.use(createPinia())
app.use(router)

app.mount('#app')
