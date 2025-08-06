import router from "@/router"
import { createResource } from "frappe-ui"
import { computed, reactive } from "vue"

import { userResource } from "./user"

export function sessionUser() {
  const cookies = new URLSearchParams(document.cookie.split("; ").join("&"))
  let _sessionUser = cookies.get("user_id")
  if (_sessionUser === "Guest") {
    _sessionUser = null
  }
  return _sessionUser
}

export function getCSRFToken() {
  // Try to get from window first (set by Jinja template)
  if (window.csrf_token) {
    return window.csrf_token;
  }
  
  // Fallback to cookie
  const cookies = new URLSearchParams(document.cookie.split("; ").join("&"));
  return cookies.get("csrf_token") || '';
}

// Function to refresh CSRF token
export async function refreshCSRFToken() {
  try {
    const response = await fetch('/api/method/frappe.sessions.get_csrf_token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.message) {
      session.csrfToken = data.message;
      window.csrf_token = data.message; // Update window global too
      return data.message;
    }
  } catch (error) {
    console.warn('Failed to refresh CSRF token:', error);
    // Fallback to existing token
  }
  return session.csrfToken;
}

export const session = reactive({
  csrfToken: getCSRFToken(),
  login: createResource({
    url: "login",
    makeParams({ email, password }) {
      return {
        usr: email,
        pwd: password,
      }
    },
    onSuccess(data) {
      userResource.load({ force: true }) 
      session.user = sessionUser()
      // Refresh CSRF token after login
      refreshCSRFToken()
      session.login.reset()
      router.replace(data.default_route || "/")
    },
  }),
  logout: createResource({
    url: "logout",
    onSuccess() {
      userResource.reset()
      session.user = sessionUser()
      session.csrfToken = '' // Clear CSRF token on logout
      router.replace({ name: "Login" })
    },
  }),
  user: sessionUser(),
  isLoggedIn: computed(() => !!session.user),
})