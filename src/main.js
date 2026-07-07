import { createApp } from 'vue'
import './style.css'
import AppOld from './App.vue'

// import naive from 'naive-ui'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import { createPinia } from 'pinia'

import router from './router/index.js'

const app = createApp(AppOld)

app.use(createPinia())

app.use(router)

// app.use(naive)

app.use(ElementPlus)

app.mount('#app')