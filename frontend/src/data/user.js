import router from "@/router"
import { createResource, createDocumentResource } from "frappe-ui"
import { session } from "./session"

// Initialize userResource first
export const userResource = createDocumentResource({
  doctype: "User",
  name: null,
  auto: false,
  onError(error) {
    console.error('User resource error:', error)
    if (error?.status === 401) {
      safeRedirectToLogin()
    }
  }
})

// Helper for safe redirects
function safeRedirectToLogin() {
  if (router.currentRoute.value.name !== 'LoginPage') {
    router.push({ name: "Login" }).catch(() => { })
  }
}

// Current user detection
export const currentUserResource = createResource({
  url: "frappe.auth.get_logged_user",
  auto: false,
  onSuccess(data) {
    if (data) {
      userResource.name = data
      userResource.load().catch(console.error)
    }
  },
  onError: safeRedirectToLogin
})

// Session detection
export const sessionInfoResource = createResource({
  url: "frappe.sessions.get",
  auto: false,
  onSuccess(data) {
    if (data?.user && data.user !== 'Guest') {
      userResource.name = data.user
      userResource.load().catch(console.error)
    } else {
      safeRedirectToLogin()
    }
  },
  onError: safeRedirectToLogin
})

// Main user initialization
export async function getCurrentUser() {
  try {

    if (!userResource || typeof userResource !== 'object') {
      throw new Error('User resource not initialized');
    }
    // Try session first
    if (session.user && session.user !== 'Guest') {
      userResource.name = session.user
      await userResource.load()
      return true
    }

    // Fallback to API
    await currentUserResource.fetch()
    return !!currentUserResource.data
  } catch (error) {
    console.error('User initialization failed:', error)
    safeRedirectToLogin()
    return false
  }
}

// Update functionality
export const updateUserResource = createResource({
  url: "/api/method/homemain.api.update_user",
  method: "POST",
  onSuccess() {
    userResource.reload().catch(console.error)
  },
  onError(error) {
    console.error('Update failed:', error)
    if (error?.status === 401) {
      safeRedirectToLogin()
    }
  }
})
