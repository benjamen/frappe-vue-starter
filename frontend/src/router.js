// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import { session } from './data/session'

// lazy‑load pages
const Home = () => import('./pages/Home.vue')
const Login = () => import('./pages/Login.vue')
const Dashboard = () => import('./pages/Dashboard.vue')
const Settings = () => import('./pages/Settings.vue')
const AdminLayout = () => import('./layouts/AdminLayout.vue')
const Tasks = () => import('./pages/Tasks.vue')
const Generic = () => import('./pages/GenericDocList.vue')


const routes = [
  {
    path: '/account/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'home', name: 'Home', component: Home },
      { path: 'dashboard', name: 'Dashboard', component: Dashboard },
      { path: 'settings', name: 'Settings', component: Settings },
      { path: 'tasks', name: 'Tasks', component: Tasks },
      { path: 'list/:doctype', name: 'GenericList', component: Generic, props: true },
    ],
  },
]

const router = createRouter({
  history: createWebHistory('/frontend'),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !session.isLoggedIn) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && session.isLoggedIn) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
