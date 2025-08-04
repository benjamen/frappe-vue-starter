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
              :type="
                field.type ||
                (selectOptions[field.name]?.length ? 'select' : 'text')
              "
              :options="selectOptions[field.name]"
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
                  :type="
                    field.type ||
                    (selectOptions[field.name]?.length ? 'select' : 'text')
                  "
                  :options="selectOptions[field.name]"
                  class="w-full"
                />
              </template>
              <Button
                type="submit"
                variant="solid"
                size="sm"
                class="!bg-green-600 !text-white hover:!bg-green-700"
                >💾 Save</Button
              >
              <Button
                type="button"
                @click="cancelEdit"
                variant="outline"
                size="sm"
                >❌ Cancel</Button
              >
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
                >Edit</Button
              >
              <Button
                @click="deleteDoc(doc)"
                variant="ghost"
                size="sm"
                class="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:!bg-red-50 !text-red-600"
                >Delete</Button
              >
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
import { doctypeConfigs } from "../data/doctypeConfigs";

const route = useRoute();
const doctype = computed(() => route.params.doctype || "ToDo");

// Config for common doctypes, using explicit type if needed

const config = computed(
  () =>
    doctypeConfigs[doctype.value] || {
      title: doctype.value,
      subtitle: `List of ${doctype.value}`,
      singular: doctype.value,
      addFields: [],
      displayFields: [],
    }
);

const pageTitle = computed(() => config.value.title);
const pageSubtitle = computed(() => config.value.subtitle);
const pageTitleSingular = computed(() => config.value.singular);
const addFields = computed(() => config.value.addFields || []);
const displayFields = computed(() => config.value.displayFields || []);

const selectOptions = ref({});
const selectOptionsReady = ref(false);

// List resource
const docs = createListResource({
  doctype: doctype.value,
  fields: ["name", ...displayFields.value.map((f) => f.name)],
  orderBy: "creation desc",
  start: 0,
  pageLength: 10,
});

// Watch for route/doctype changes and reload data + field meta
watch(doctype, () => {
  docs.doctype = doctype.value;
  docs.fetch();
  fetchFieldMeta();
});
watch(displayFields, () => {
  docs.fields = ["name", ...displayFields.value.map((f) => f.name)];
  docs.fetch();
});
onMounted(() => {
  docs.fetch();
  fetchFieldMeta();
});

// Fetch Frappe field meta to get select options for any doctype
async function fetchFieldMeta() {
  selectOptionsReady.value = false;
  try {
    const response = await call("frappe.desk.form.load.getdoctype", {
      doctype: doctype.value,
    });
    console.log("[DocType Meta Raw]", doctype.value, response);

    // Try to get fields array in both common shapes
    let fields = null;
    if (
      response &&
      response.message &&
      Array.isArray(response.message.fields)
    ) {
      fields = response.message.fields;
    } else if (
      response &&
      response.docs &&
      Array.isArray(response.docs) &&
      response.docs[0] &&
      Array.isArray(response.docs[0].fields)
    ) {
      fields = response.docs[0].fields;
    }

    if (!fields) {
      console.warn("[Meta Fetch] No fields found for", doctype.value, response);
      selectOptions.value = {};
      selectOptionsReady.value = true;
      resetNewDoc();
      return;
    }

    selectOptions.value = {};
    for (const f of fields) {
      if (f.fieldtype === "Select" && f.options) {
        selectOptions.value[f.fieldname] = f.options
          .split("\n")
          .filter((o) => o && o !== "")
          .map((opt) => ({ value: opt, label: opt }));
      }
    }
    selectOptionsReady.value = true;
    resetNewDoc();
  } catch (e) {
    console.warn("Meta fetch failed for", doctype.value, e);
    selectOptionsReady.value = true;
    resetNewDoc();
  }
}

// Add new doc
const newDoc = ref({});
function resetNewDoc() {
  newDoc.value = Object.fromEntries(
    addFields.value.map((f) => {
      // Default to first select value if available
      if (selectOptions.value[f.name]?.length) {
        return [f.name, selectOptions.value[f.name][0].value];
      }
      return [f.name, ""];
    })
  );
}
watch(addFields, resetNewDoc, { immediate: true });
watch(selectOptions, resetNewDoc);

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
      `Delete ${config.value.singular} "${doc[displayFields.value[0]?.name]}"?`
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
