import router from "@/router"
import { createResource } from "frappe-ui"
import { createDocumentResource } from "frappe-ui"

export const userResource = createDocumentResource("User", "me", {
  onError(error) {
    if (error && error.exc_type === "AuthenticationError") {
      router.push({ name: "LoginPage" })
    }
  }
})


export const updateUserResource = createResource({
  url: "/api/method/homemain.api.update_user", 
  method: "POST",
  transform: r => r.message,
})