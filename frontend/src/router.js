// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import { session } from './data/session'

// Simple route definitions
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./pages/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('./layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('./pages/Dashboard.vue')
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('./pages/Home.vue')
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('./pages/Tasks.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('./pages/UpdateProfile.vue')
      },
      {
        path: 'form/:name',
        name: 'WebForm',
        component: () => import('./pages/WebFormPage.vue'),
        props: true
      },
      {
        path: 'form/:name/list',
        name: 'WebFormList',
        component: () => import('./pages/WebFormListPage.vue'),
        props: true
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./pages/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// Simple auth guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  if (to.name === 'Login' && session.isLoggedIn) {
    next('/dashboard')
  } else if (requiresAuth && !session.isLoggedIn) {
    next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  } else {
    next()
  }
})

export default router
