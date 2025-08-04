<script setup>
import { ref, inject } from "vue";

const client = inject("$frappe");
const toast = inject("toast");
const emit = defineEmits(["success", "cancel"]);

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);

async function submit() {
  if (newPassword.value !== confirmPassword.value) {
    toast({ title: "Error", text: "Passwords do not match" });
    return;
  }

  try {
    loading.value = true;
    await client.call("frappe.core.doctype.user.user.update_password", {
      old_password: currentPassword.value,
      new_password: newPassword.value,
    });
    toast({ title: "Success", text: "Password updated" });
    emit("success");
  } catch (error) {
    toast({ title: "Error", text: error.message });
  } finally {
    loading.value = false;
  }
}
</script>
