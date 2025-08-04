<template>
  <div class="max-w-2xl mx-auto p-6">
    <div v-if="loading" class="text-gray-400 mb-2">Loading…</div>

    <div v-else-if="webForm">
      <h1 class="text-2xl font-bold mb-4">{{ webForm.title }}</h1>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div v-for="field in filteredFields" :key="field.name">
          <label v-if="field.label" class="block font-semibold mb-1">
            {{ field.label }}
            <span v-if="field.reqd" class="text-red-500">*</span>
          </label>
          <!-- Data -->
          <input
            v-if="field.fieldtype === 'Data'"
            type="text"
            class="border rounded px-3 py-2 w-full"
            :placeholder="field.label"
            v-model="formValues[field.fieldname]"
            :required="field.reqd"
          />

          <!-- Link -->
          <input
            v-else-if="field.fieldtype === 'Link'"
            type="text"
            class="border rounded px-3 py-2 w-full"
            :placeholder="field.label"
            v-model="formValues[field.fieldname]"
          />

          <!-- Attach Image -->
          <input
            v-else-if="field.fieldtype === 'Attach Image'"
            type="file"
            class="block"
            @change="onFileChange($event, field.fieldname)"
          />

          <!-- Expand for more field types as needed -->
        </div>
        <button
          type="submit"
          class="px-4 py-2 rounded bg-blue-600 text-white font-semibold"
        >
          Submit
        </button>
      </form>

      <!-- Debug info -->
      <details class="mt-6">
        <summary class="cursor-pointer text-gray-600">
          Show raw webForm JSON
        </summary>
        <pre class="bg-gray-100 rounded p-3 text-xs overflow-x-auto"
          >{{ webForm }}
        </pre>
        <summary class="cursor-pointer text-gray-600 mt-2">
          Show loaded doc values
        </summary>
        <pre class="bg-gray-100 rounded p-3 text-xs overflow-x-auto"
          >{{ docValues }}
        </pre>
      </details>
    </div>

    <div v-else class="text-red-600">Form not found.</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { call } from "frappe-ui";

const route = useRoute();
const name = ref(route.params.name);
const webForm = ref(null);
const loading = ref(false);

// Holds form values by fieldname
const formValues = reactive({});
const docValues = ref(null);

// Computed property for filtered fields
const filteredFields = computed(() => {
  if (!webForm.value || !Array.isArray(webForm.value.web_form_fields))
    return [];
  return webForm.value.web_form_fields.filter(
    (field) =>
      field.fieldtype !== "Section Break" && field.fieldtype !== "Column Break"
  );
});

// Fetch the web form by name, then fetch the user's document to prefill
async function fetchWebForm() {
  if (!name.value) {
    console.warn("No name param in route!");
    return;
  }
  loading.value = true;
  webForm.value = null;
  docValues.value = null;
  try {
    // 1. Load the Web Form meta
    const result = await call("frappe.client.get", {
      doctype: "Web Form",
      name: name.value,
    });
    webForm.value = result?.message ? result.message : result ?? null;

    // 2. Fetch the user's doc (if webForm is loaded and doc_type set)
    if (webForm.value && webForm.value.doc_type) {
      await fetchDoc();
    }

    // 3. Initialize formValues with docValues (if any)
    if (webForm.value && Array.isArray(webForm.value.web_form_fields)) {
      webForm.value.web_form_fields.forEach((field) => {
        if (field.fieldname) {
          formValues[field.fieldname] =
            (docValues.value && docValues.value[field.fieldname]) || "";
        }
      });
    }
    if (!webForm.value) {
      console.warn("[WebFormPage] No webform found for", name.value);
    }
  } catch (err) {
    console.error("[WebFormPage] Error fetching webform:", err);
    webForm.value = null;
  }
  loading.value = false;
}

// Fetches the doc for the currently logged-in user/profile
async function fetchDoc() {
  try {
    // Get current user (works if logged in; replace as needed for your use case)
    let currentUser = null;
    try {
      const userRes = await call("frappe.client.get", {
        doctype: "User",
        name: currentUser, // <-- REPLACE THIS with dynamic user logic for production!
      });
      currentUser = userRes?.message?.name || "Administrator";
    } catch (e) {
      currentUser = "Administrator";
    }
    // Now get the doc
    const docRes = await call("frappe.client.get", {
      doctype: webForm.value.doc_type,
      name: currentUser,
    });
    docValues.value = docRes?.message ? docRes.message : docRes ?? null;
  } catch (err) {
    docValues.value = null;
    console.error("[WebFormPage] Error fetching doc:", err);
  }
}

// Handle file input (simple, does not upload yet)
function onFileChange(event, fieldname) {
  const file = event.target.files[0];
  formValues[fieldname] = file;
}

// Example submit handler
async function onSubmit() {
  try {
    loading.value = true;

    // Prepare the updated doc (must include name)
    const updatedDoc = {
      doctype: webForm.value.doc_type,
      name: docValues.value.name,
      ...formValues,
    };

    await call("frappe.client.save", {
      doc: updatedDoc,
    });

    alert("Profile updated successfully!");
    await fetchDoc();
  } catch (err) {
    alert("Failed to save: " + (err.message || err));
    console.error("[WebFormPage] Error saving form:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchWebForm);
watch(
  () => route.params.name,
  (n) => {
    name.value = n;
    fetchWebForm();
  }
);
</script>
