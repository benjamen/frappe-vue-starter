// src/data/session.js
import { createResource } from "frappe-ui"
import { reactive, computed } from "vue"

// Simple cookie helper
function getCookie(name) {
  const cookies = new URLSearchParams(document.cookie.split("; ").join("&"))
  return cookies.get(name)
}

// Get current user from cookie
function getCurrentUserFromCookie() {
  const user = getCookie("user_id")
  return user && user !== "Guest" ? user : null
}

// Session state - keep it simple
export const session = reactive({
  user: getCurrentUserFromCookie(),
  isLoggedIn: computed(() => !!session.user),
  
  // Login resource
  login: createResource({
    url: "login", 
    makeParams({ email, password }) {
      return {
        usr: email,
        pwd: password,
      }
    },
    onSuccess(data) {
      // Update user from cookie after login
      session.user = getCurrentUserFromCookie()
      
      // Navigate to intended route or dashboard
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
      window.location.href = redirect
    },
    onError(error) {
      console.error('Login failed:', error)
    }
  }),

  // Logout resource  
  logout: createResource({
    url: "logout",
    onSuccess() {
      session.user = null
      window.location.href = '/login'
    },
    onError() {
      // Force logout even if API fails
      session.user = null
      window.location.href = '/login'
    }
  }),

  // Simple user profile resource
  userProfile: createResource({
    url: "frappe.auth.get_logged_user",
    auto: false,
    onSuccess(userData) {
      // Store basic user info if needed
      session.userInfo = userData
    }
  })
})

// Auto-load user profile if logged in
if (session.isLoggedIn) {
  session.userProfile.fetch()
}