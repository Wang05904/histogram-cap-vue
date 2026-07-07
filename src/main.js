import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// import naive from 'naive-ui'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'


const app = createApp(App)
app.use(createPinia())
// app.use(naive)
app.use(ElementPlus)
app.mount('#app')