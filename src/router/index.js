import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/pages/Home.vue'
import Result from '@/pages/Result.vue'
import About from '@/pages/About.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/home'
        },
        {
            path: '/home',
            name: 'Home',
            component: Home
        },
        {
            path: '/result',
            name: 'Result',
            component: Result
        },
        {
            path: '/about',
            name: 'About',
            component: About
        }
    ]
})

export default router