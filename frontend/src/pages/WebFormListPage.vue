<template>
  <div class="max-w-7xl mx-auto p-4 space-y-6">

    <div
      class="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
      >
        <div class="min-w-0 flex-1">
          <h1
            class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate"
          >
            {{ webForm?.list_title || webForm?.title || name }} List
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your form submissions
          </p>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <!-- Bulk Delete Button (only show when items are selected) -->
          <button
            v-if="selectedRows.length > 0"
            @click="bulkDelete"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete ({{ selectedRows.length }})
          </button>

          <!-- Add New Button -->
          <router-link
            :to="`/form/${name}?new=1`"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span class="hidden sm:inline">Add New Entry</span>
            <span class="inline sm:hidden">Add</span>
          </router-link>
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-hidden">
        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          >
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" class="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    v-model="selectAll"
                    @change="toggleSelectAll"
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    :disabled="!list?.data?.length"
                  />
                </th>
                <th
                  scope="col"
                  class="w-16 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  #
                </th>
                <th
                  v-for="field in listColumns"
                  :key="field.fieldname"
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {{ field.label || field.fieldname }}
                </th>
                <th
                  scope="col"
                  class="w-20 px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
            >
              <tr
                v-for="(doc, idx) in list?.data || []"
                :key="doc.name"
                class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                :class="{
                  'bg-blue-50 dark:bg-blue-900/20': selectedRows.includes(
                    doc.name
                  ),
                }"
              >
                <td class="px-6 py-4">
                  <input
                    type="checkbox"
                    :value="doc.name"
                    v-model="selectedRows"
                    @change="updateSelectAll"
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td
                  class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {{ idx + 1 }}
                </td>
                <td
                  v-for="field in listColumns"
                  :key="field.fieldname"
                  class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                >
                  <div class="max-w-xs">
                    <!-- Render by fieldtype -->
                    <template v-if="field.fieldtype === 'Text Editor'">
                      <div
                        class="ql-editor read-mode line-clamp-2"
                        v-html="doc[field.fieldname]"
                      ></div>
                    </template>
                    <template v-else-if="field.fieldtype === 'Date'">
                      <span class="truncate block">{{
                        formatDate(doc[field.fieldname])
                      }}</span>
                    </template>
                    <template v-else>
                      <span
                        class="truncate block"
                        :title="doc[field.fieldname]"
                      >
                        {{ doc[field.fieldname] }}
                      </span>
                    </template>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <router-link
                      :to="`/form/${name}?doc=${doc.name}`"
                      class="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/50 dark:hover:bg-blue-900 rounded-md transition-colors"
                    >
                      Edit
                    </router-link>
                    <button
                      @click="deleteRow(doc.name)"
                      :disabled="loading"
                      class="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/50 dark:hover:bg-red-900 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete this entry"
                    >
                      <svg
                        class="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!list?.data?.length">
                <td colspan="99" class="px-6 py-12 text-center">
                  <div
                    class="flex flex-col items-center justify-center space-y-3"
                  >
                    <svg
                      class="h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p class="text-gray-500 dark:text-gray-400 font-medium">
                        No records found
                      </p>
                      <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        Get started by adding your first entry
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div
        class="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center gap-2">
          <Button
            :disabled="!list?.hasPrev || list?.page <= 1"
            @click="list.prev()"
            class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </Button>
        </div>

        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Page {{ list?.page || 1 }}
          </span>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ (list?.data || []).length }} entries
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            :disabled="!list?.hasNext"
            @click="list.next()"
            class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </Button>
        </div>
      </div>
    </div>

    <!-- Debug Section -->
    <details class="bg-gray-50 dark:bg-gray-800 rounded-lg">
      <summary
        class="cursor-pointer p-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <span class="font-medium">Show raw webForm JSON</span>
      </summary>
      <div class="px-4 pb-4">
        <pre
          class="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto border"
          >{{ JSON.stringify(webForm, null, 2) }}</pre
        >
      </div>
    </details>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { call, createListResource, Button } from "frappe-ui";

const route = useRoute();
const name = ref(route.params.name);
const webForm = ref(null);
const loading = ref(false);
const doctype = ref("");
const listColumns = ref([]);
const selectedRows = ref([]);
const selectAll = ref(false);

let list = null;

async function fetchWebForm() {
  loading.value = true;
  webForm.value = null;
  try {
    const res = await call("frappe.client.get", {
      doctype: "Web Form",
      name: name.value,
    });
    webForm.value = res?.message || res || null;

    doctype.value = webForm.value?.doc_type;
    // Always use the list_columns (with label, fieldtype etc)
    listColumns.value =
      webForm.value?.list_columns && webForm.value.list_columns.length
        ? webForm.value.list_columns
        : (webForm.value?.web_form_fields || [])
            .filter(
              (f) =>
                !!f.fieldname &&
                f.fieldtype !== "Section Break" &&
                f.fieldtype !== "Column Break"
            )
            .map((f) => ({
              fieldname: f.fieldname,
              label: f.label,
              fieldtype: f.fieldtype,
            }));

    setupList();
  } catch (err) {
    webForm.value = null;
    console.error("[WebFormListPage] Error fetching webform:", err);
  }
  loading.value = false;
}

function setupList() {
  if (!doctype.value || listColumns.value.length === 0) return;
  list = createListResource({
    doctype: doctype.value,
    fields: ["name", ...listColumns.value.map((c) => c.fieldname)],
    orderBy: "modified desc",
    pageLength: 10,
  });
  list.fetch();

  // Clear selections when list changes
  selectedRows.value = [];
  selectAll.value = false;
}

function toggleSelectAll() {
  if (selectAll.value) {
    // Select all current page items
    selectedRows.value = (list?.data || []).map((doc) => doc.name);
  } else {
    // Deselect all
    selectedRows.value = [];
  }
}

function updateSelectAll() {
  const currentPageItems = (list?.data || []).map((doc) => doc.name);
  const selectedCurrentPage = currentPageItems.filter((name) =>
    selectedRows.value.includes(name)
  );
  selectAll.value =
    currentPageItems.length > 0 &&
    selectedCurrentPage.length === currentPageItems.length;
}

async function deleteRow(docName) {
  if (
    !confirm(
      "Are you sure you want to delete this entry? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    loading.value = true;
    await call("frappe.client.delete", {
      doctype: doctype.value,
      name: docName,
    });

    // Show success message
    showToast("Entry deleted successfully!", "success");

    // Remove from selected if it was selected
    selectedRows.value = selectedRows.value.filter((name) => name !== docName);
    updateSelectAll();

    // Refresh the list
    if (list && list.reload) {
      await list.reload();
    }
  } catch (err) {
    showToast("Failed to delete: " + (err.message || err), "error");
    console.error("[WebFormListPage] Error deleting entry:", err);
  } finally {
    loading.value = false;
  }
}

async function bulkDelete() {
  const count = selectedRows.value.length;
  if (
    !confirm(
      `Are you sure you want to delete ${count} ${
        count === 1 ? "entry" : "entries"
      }? This action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    loading.value = true;
    const deletePromises = selectedRows.value.map((docName) =>
      call("frappe.client.delete", {
        doctype: doctype.value,
        name: docName,
      })
    );

    await Promise.all(deletePromises);

    // Show success message
    showToast(
      `${count} ${count === 1 ? "entry" : "entries"} deleted successfully!`,
      "success"
    );

    // Clear selections
    selectedRows.value = [];
    selectAll.value = false;

    // Refresh the list
    if (list && list.reload) {
      await list.reload();
    }
  } catch (err) {
    showToast(
      "Failed to delete some entries: " + (err.message || err),
      "error"
    );
    console.error("[WebFormListPage] Error bulk deleting entries:", err);
  } finally {
    loading.value = false;
  }
}

function showToast(message, type = "info") {
  const toastDiv = document.createElement("div");
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";
  toastDiv.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm`;
  toastDiv.textContent = message;
  document.body.appendChild(toastDiv);
  setTimeout(() => toastDiv.remove(), 4000);
}

function getStatusClass(status) {
  if (!status)
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

  const statusLower = status.toString().toLowerCase();

  // Success/Positive statuses
  if (
    [
      "active",
      "approved",
      "completed",
      "success",
      "done",
      "finished",
      "published",
      "enabled",
      "confirmed",
      "verified",
      "accepted",
    ].includes(statusLower)
  ) {
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  }

  // Warning/In Progress statuses
  if (
    [
      "pending",
      "in progress",
      "processing",
      "review",
      "waiting",
      "partial",
      "draft",
      "submitted",
      "open",
    ].includes(statusLower)
  ) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  }

  // Error/Negative statuses
  if (
    [
      "cancelled",
      "rejected",
      "failed",
      "error",
      "disabled",
      "inactive",
      "closed",
      "expired",
      "blocked",
      "suspended",
    ].includes(statusLower)
  ) {
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }

  // Info/Neutral statuses
  if (
    ["new", "created", "scheduled", "paused", "hold", "on hold"].includes(
      statusLower
    )
  ) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  }

  // Default gray for unknown statuses
  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
}

function formatDate(val) {
  if (!val) return "";
  if (val.length === 10 && val.includes("-")) {
    return val.split("-").reverse().join("/");
  }
  const date = new Date(val);
  if (isNaN(date)) return val;
  return date.toLocaleDateString();
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

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ql-editor.read-mode {
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  min-height: unset;
  background: transparent;
  border: none;
  box-shadow: none;
}

.ql-editor.read-mode * {
  margin: 0;
  padding: 0;
}
</style>
