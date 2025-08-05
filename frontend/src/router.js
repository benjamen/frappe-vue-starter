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
const WebForm = () => import('./pages/WebFormPage.vue')
const WebFormList = () => import('./pages/WebFormListPage.vue')
const NotFound = () => import('./pages/NotFound.vue') // Add 404 page

const routes = [
  {
    path: '/account/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'home', name: 'Home', component: Home },
      { path: 'dashboard', name: 'Dashboard', component: Dashboard },
      { path: 'settings', name: 'Settings', component: Settings },
      { path: 'tasks', name: 'Tasks', component: Tasks },
      {
        path: 'form/:name',
        name: 'WebFormPage',
        component: WebForm,
        props: true,
        meta: { title: 'Form' }
      },
      {
        path: 'form/:name/list',
        name: 'WebFormListPage',
        component: WebFormList,
        props: true,
        meta: { title: 'Form List' }
      },
      {
        path: 'list/:doctype',
        name: 'GenericList',
        component: Generic,
        props: true,
        meta: { title: 'List' }
      },
    ],
  },
  // Catch-all 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory('/frontend'),
  routes,
})

router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  try {
    // If going to login and already logged in, redirect to dashboard
    if (to.name === 'Login' && session.isLoggedIn) {
      next({ name: 'Dashboard' })
      return
    }

    // If route requires auth and user is not logged in, redirect to login
    if (requiresAuth && !session.isLoggedIn) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath } // Save intended destination
      })
      return
    }

    next()
  } catch (error) {
    console.error('Router navigation error:', error)
    next({ name: 'Login' })
  }
})

// Optional: Set page titles
router.afterEach((to) => {
  const title = to.meta?.title || to.name || 'MyApp'
  document.title = `${title} - MyApp`
})

export default router
