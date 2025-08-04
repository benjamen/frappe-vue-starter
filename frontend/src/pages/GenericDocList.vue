<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4"
  >
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1
          class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2"
        >
          {{ pageTitle }}
        </h1>
        <p class="text-gray-600">{{ pageSubtitle }}</p>
      </div>

      <!-- Add Doc Form -->
      <div
        v-if="addFields.length"
        class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8 hover:shadow-2xl transition-all duration-300"
      >
        <form @submit.prevent="addDoc" class="flex flex-col sm:flex-row gap-4">
          <template v-for="field in addFields" :key="field.name">
            <FormControl
              v-model="newDoc[field.name]"
              :label="field.label"
              :placeholder="field.placeholder || field.label || field.name"
              :type="field.type"
              :options="field.options"
              :required="field.required"
              class="w-full"
            />
          </template>
          <Button
            type="submit"
            variant="solid"
            class="!bg-gradient-to-r !from-indigo-600 !to-purple-600 !text-white hover:!from-indigo-700 hover:!to-purple-700 !shadow-lg hover:!shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Add {{ pageTitleSingular }}
          </Button>
        </form>
      </div>

      <!-- Loading State -->
      <div v-if="!docs.data" class="flex justify-center items-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"
        ></div>
        <span class="ml-3 text-gray-600 font-medium">Loading...</span>
      </div>

      <!-- Docs Grid -->
      <div v-else-if="docs.data.length" class="grid gap-4 mb-8">
        <div
          v-for="doc in docs.data"
          :key="doc.name"
          class="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
          <!-- Edit Mode -->
          <div v-if="editingId === doc.name && editingDoc && editingDoc.doc">
            <form
              @submit.prevent="saveEdit"
              class="flex flex-col sm:flex-row gap-4"
            >
              <template v-for="field in displayFields" :key="field.name">
                <FormControl
                  v-model="editingDoc.doc[field.name]"
                  :label="field.label"
                  :type="field.type"
                  :options="field.options"
                  class="w-full"
                />
              </template>
              <Button
                type="submit"
                variant="solid"
                size="sm"
                class="!bg-green-600 !text-white hover:!bg-green-700"
              >
                💾 Save
              </Button>
              <Button
                type="button"
                @click="cancelEdit"
                variant="outline"
                size="sm"
              >
                ❌ Cancel
              </Button>
            </form>
          </div>

          <!-- Display Mode -->
          <div v-else class="flex items-center justify-between gap-4">
            <div class="flex-1">
              <div
                v-for="field in displayFields"
                :key="field.name"
                class="mb-1"
              >
                <span class="font-semibold"
                  >{{ field.label || field.name }}:
                </span>
                <span>{{ doc[field.name] }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button
                @click="startEdit(doc)"
                variant="ghost"
                size="sm"
                class="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:!bg-blue-50 !text-blue-600"
              >
                Edit
              </Button>
              <Button
                @click="deleteDoc(doc)"
                variant="ghost"
                size="sm"
                class="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:!bg-red-50 !text-red-600"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div
          class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-12 h-12 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-600 mb-2">
          No {{ pageTitle }} yet
        </h3>
        <p class="text-gray-500">
          Create your first {{ pageTitleSingular.toLowerCase() }} to get
          started!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { createListResource, createDocumentResource, call } from "frappe-ui";
import { Button, FormControl } from "frappe-ui";

const route = useRoute();
const doctype = computed(() => route.params.doctype || "ToDo");

// These will be dynamically built!
const pageTitle = ref("");
const pageSubtitle = ref("");
const pageTitleSingular = ref("");
const addFields = ref([]);
const displayFields = ref([]);

const docs = createListResource({
  doctype: doctype.value,
  fields: ["name"],
  orderBy: "creation desc",
  start: 0,
  pageLength: 10,
});

watch(doctype, () => {
  docs.doctype = doctype.value;
  fetchFieldMeta();
  docs.fetch();
});
onMounted(() => {
  fetchFieldMeta();
  docs.fetch();
});

async function fetchFieldMeta() {
  // Fetch from Frontend Page Config if you want custom title/subtitle (optional)
  let customTitle = "";
  let customSubtitle = "";
  let customSingular = "";
  try {
    const { message: cfg } = await call("frappe.client.get_list", {
      doctype: "Frontend Page Config",
      filters: { doctype: doctype.value },
      fields: ["page_title", "page_subtitle", "page_singular"],
      limit_page_length: 1,
    });
    if (Array.isArray(cfg) && cfg.length) {
      customTitle = cfg[0].page_title;
      customSubtitle = cfg[0].page_subtitle;
      customSingular = cfg[0].page_singular;
    }
  } catch (e) {
    // ignore if missing
  }

  const response = await call("frappe.desk.form.load.getdoctype", {
    doctype: doctype.value,
  });
  let fields = response?.message?.fields || response?.docs?.[0]?.fields || [];
  // Fallback to doctype name if no custom
  pageTitle.value = customTitle || doctype.value;
  pageSubtitle.value = customSubtitle || `List of ${doctype.value}`;
  pageTitleSingular.value = customSingular || doctype.value;

  // List fields: show those in_list_view, or bold (Frappe standard for "important")
  displayFields.value = fields
    .filter((f) => f.in_list_view || f.bold)
    .map((f) => ({
      name: f.fieldname,
      label: f.label,
      type: mapFrappeType(f.fieldtype),
      options:
        f.fieldtype === "Select" && f.options
          ? f.options
              .split("\n")
              .filter(Boolean)
              .map((opt) => ({ value: opt, label: opt }))
          : undefined,
    }));

  // Add/edit fields: not hidden, not read_only, not Table/Button/HTML/Break/Image
  addFields.value = fields
    .filter(
      (f) =>
        !f.hidden &&
        !f.read_only &&
        ![
          "Section Break",
          "Column Break",
          "Table",
          "Button",
          "HTML",
          "Image",
        ].includes(f.fieldtype)
    )
    .map((f) => ({
      name: f.fieldname,
      label: f.label,
      required: !!f.reqd,
      type: mapFrappeType(f.fieldtype),
      options:
        f.fieldtype === "Select" && f.options
          ? f.options
              .split("\n")
              .filter(Boolean)
              .map((opt) => ({ value: opt, label: opt }))
          : undefined,
      placeholder: f.label,
    }));

  // Dynamically update list fields on resource
  docs.fields = ["name", ...displayFields.value.map((f) => f.name)];
  resetNewDoc();
}

// Convert Frappe field types to form types
function mapFrappeType(fieldtype) {
  switch (fieldtype) {
    case "Data":
      return "text";
    case "Text":
    case "Small Text":
    case "Long Text":
    case "Code":
      return "textarea";
    case "Int":
    case "Float":
    case "Currency":
    case "Percent":
      return "number";
    case "Date":
      return "date";
    case "Datetime":
      return "datetime-local";
    case "Time":
      return "time";
    case "Select":
      return "select";
    case "Check":
      return "checkbox";
    default:
      return "text";
  }
}

// Add new doc
const newDoc = ref({});
function resetNewDoc() {
  newDoc.value = Object.fromEntries(
    addFields.value.map((f) => [f.name, f.options?.[0]?.value ?? ""])
  );
}
watch(addFields, resetNewDoc, { immediate: true });

async function addDoc() {
  for (const field of addFields.value) {
    if (field.required && !newDoc.value[field.name]) return;
  }
  try {
    await docs.insert.submit({ ...newDoc.value });
    resetNewDoc();
    await docs.fetch();
  } catch (err) {
    alert("Failed to add: " + err.message);
  }
}

// Editing (only one at a time)
const editingId = ref(null);
const editingDoc = ref(null);
function startEdit(doc) {
  editingId.value = doc.name;
  editingDoc.value = createDocumentResource({
    doctype: doctype.value,
    name: doc.name,
  });
}
async function saveEdit() {
  if (!editingDoc.value || !editingDoc.value.doc) return;
  try {
    await editingDoc.value.setValue.submit({ ...editingDoc.value.doc });
    editingId.value = null;
    editingDoc.value = null;
    await docs.fetch();
  } catch (err) {
    alert("Failed to save: " + err.message);
  }
}
function cancelEdit() {
  editingId.value = null;
  editingDoc.value = null;
}
async function deleteDoc(doc) {
  if (
    !confirm(
      `Delete ${pageTitleSingular.value} "${
        doc[displayFields.value[0]?.name]
      }"?`
    )
  )
    return;
  try {
    const docRes = createDocumentResource({
      doctype: doctype.value,
      name: doc.name,
    });
    await docRes.delete.submit();
    await docs.fetch();
  } catch (err) {
    alert("Failed to delete: " + err.message);
  }
}
</script>
