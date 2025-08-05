<template>
  <div class="w-full p-4 lg:p-6 xl:p-8 space-y-6 lg:space-y-8">
    <!-- TOP NAV & TITLE BAR -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <router-link
        v-if="webForm?.show_list"
        :to="`/form/${name}/list`"
        class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span class="hidden sm:inline">Back to List</span>
      </router-link>

      <div class="flex-1 text-center">
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          {{ webForm?.title }}
        </h1>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ isNew ? 'Create new entry' : 'Edit existing entry' }}
        </p>
      </div>

      <!-- Right-side spacer for symmetry on larger screens -->
      <div class="hidden sm:block w-24 lg:w-32"></div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span class="text-gray-600 dark:text-gray-400">Loading form...</span>
      </div>
    </div>

    <!-- Form Content -->
    <div v-else-if="webForm" class="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <form @submit.prevent="onSubmit(false)" class="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        <template v-for="(section, sIdx) in sections" :key="sIdx">
          <!-- Section Heading -->
          <div
            v-if="section.label && section.label.trim()"
            class="border-b border-gray-200 dark:border-gray-700 pb-4"
          >
            <h2 class="text-lg sm:text-xl font-semibold text-blue-700 dark:text-blue-300">
              {{ section.label }}
            </h2>
          </div>

          <!-- Section Fields Grid -->
          <div
            class="grid gap-4 sm:gap-6 lg:gap-8"
            :class="getGridClass(section.columns.length)"
          >
            <template v-for="(column, cIdx) in section.columns" :key="cIdx">
              <div class="space-y-4 sm:space-y-6">
                <template v-for="field in column" :key="field.name">
                  <div class="form-field">
                    <!-- Field Label (except for checkboxes) -->
                    <label
                      v-if="field.fieldtype !== 'Check'"
                      class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                      :class="{ 'text-gray-400 dark:text-gray-500': field.read_only }"
                    >
                      {{ field.label }}
                      <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                    </label>

                    <!-- Text Input Fields -->
                    <input
                      v-if="
                        [
                          'Data',
                          'Int',
                          'Float',
                          'Password',
                          'Email',
                          'Phone',
                        ].includes(field.fieldtype)
                      "
                      :type="
                        field.fieldtype === 'Password'
                          ? 'password'
                          : field.fieldtype === 'Email'
                          ? 'email'
                          : field.fieldtype === 'Phone'
                          ? 'tel'
                          : field.fieldtype === 'Int' || field.fieldtype === 'Float'
                          ? 'number'
                          : 'text'
                      "
                      :step="field.fieldtype === 'Float' ? 'any' : undefined"
                      class="form-input"
                      :placeholder="field.description || `Enter ${field.label.toLowerCase()}`"
                      v-model="formValues[field.fieldname]"
                      :required="field.reqd"
                      :readonly="field.read_only"
                      :autocomplete="
                        field.fieldtype === 'Password' ? 'new-password' : 'off'
                      "
                    />

                    <!-- Select Dropdown -->
                    <select
                      v-else-if="field.fieldtype === 'Select'"
                      class="form-input"
                      v-model="formValues[field.fieldname]"
                      :required="field.reqd"
                      :disabled="field.read_only"
                    >
                      <option value="" disabled>Select {{ field.label }}</option>
                      <option
                        v-for="opt in field.options
                          ? field.options.split('\n').filter(Boolean)
                          : []"
                        :key="opt"
                        :value="opt"
                      >
                        {{ opt }}
                      </option>
                    </select>

                    <!-- Date Input -->
                    <input
                      v-else-if="field.fieldtype === 'Date'"
                      type="date"
                      class="form-input"
                      v-model="formValues[field.fieldname]"
                      :required="field.reqd"
                      :readonly="field.read_only"
                    />

                    <!-- Color Picker -->
                    <div v-else-if="field.fieldtype === 'Color'" class="flex items-center gap-3">
                      <input
                        type="color"
                        class="h-12 w-16 rounded border border-gray-300 dark:border-gray-700 cursor-pointer disabled:cursor-not-allowed"
                        v-model="formValues[field.fieldname]"
                        :required="field.reqd"
                        :disabled="field.read_only"
                        :value="ensureColor(formValues[field.fieldname])"
                        @input="onColorInput(field.fieldname, $event.target.value)"
                      />
                      <input
                        type="text"
                        class="form-input flex-1"
                        placeholder="#000000"
                        v-model="formValues[field.fieldname]"
                        :readonly="field.read_only"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>

                    <!-- Link Field with Typeahead -->
                    <div v-else-if="field.fieldtype === 'Link'" class="relative">
                      <input
                        type="text"
                        class="form-input"
                        :placeholder="`Search ${field.options || 'records'}...`"
                        v-model="linkInputs[field.fieldname]"
                        @input="onLinkInput(field)"
                        @focus="showLinkDropdown[field.fieldname] = true"
                        @blur="hideLinkDropdownWithDelay(field.fieldname)"
                        :required="field.reqd"
                        :readonly="field.read_only"
                        autocomplete="off"
                      />
                      <!-- Dropdown for link suggestions -->
                      <ul
                        v-if="
                          showLinkDropdown[field.fieldname] &&
                          linkDropdown[field.fieldname]?.length
                        "
                        class="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg max-h-48 overflow-y-auto"
                      >
                        <li
                          v-for="opt in linkDropdown[field.fieldname]"
                          :key="opt.value"
                          class="px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                          @mousedown.prevent="
                            selectLinkValue(field.fieldname, opt)
                          "
                        >
                          <div class="font-medium text-gray-900 dark:text-gray-100">
                            {{ opt.label }}
                          </div>
                        </li>
                      </ul>
                    </div>

                    <!-- Textarea Fields -->
                    <textarea
                      v-else-if="
                        [
                          'Text',
                          'Small Text',
                          'Long Text',
                          'Text Editor',
                        ].includes(field.fieldtype)
                      "
                      class="form-input"
                      :placeholder="field.description || `Enter ${field.label.toLowerCase()}`"
                      v-model="formValues[field.fieldname]"
                      :required="field.reqd"
                      :readonly="field.read_only"
                      :rows="getTextareaRows(field)"
                    />

                    <!-- Checkbox -->
                    <div
                      v-else-if="field.fieldtype === 'Check'"
                      class="flex items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        v-model="formValues[field.fieldname]"
                        class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        :required="field.reqd"
                        :id="field.fieldname"
                        :disabled="field.read_only"
                      />
                      <label
                        :for="field.fieldname"
                        class="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                        :class="{ 'text-gray-400 dark:text-gray-500': field.read_only }"
                      >
                        {{ field.label }}
                        <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                      </label>
                    </div>

                    <!-- File Upload -->
                    <div
                      v-else-if="
                        ['Attach Image', 'Attach', 'Attach File'].includes(
                          field.fieldtype
                        )
                      "
                      class="space-y-2"
                    >
                      <input
                        type="file"
                        class="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 focus:outline-none"
                        @change="onFileChange($event, field.fieldname)"
                        :required="field.reqd"
                        :disabled="field.read_only"
                        :accept="field.fieldtype === 'Attach Image' ? 'image/*' : undefined"
                      />
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ field.fieldtype === 'Attach Image' ? 'Images only' : 'Any file type' }}
                      </p>
                    </div>

                    <!-- Fallback Text Input -->
                    <input
                      v-else
                      type="text"
                      class="form-input"
                      :placeholder="field.description || `Enter ${field.label.toLowerCase()}`"
                      v-model="formValues[field.fieldname]"
                      :required="field.reqd"
                      :readonly="field.read_only"
                    />

                    <!-- Field Description -->
                    <p
                      v-if="field.description && field.fieldtype !== 'Check'"
                      class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                    >
                      {{ field.description }}
                    </p>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </template>

        <!-- Submit and Delete Buttons -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <!-- Delete Button (only show when editing existing record) -->
          <button
            v-if="!isNew"
            type="button"
            @click="onDelete"
            :disabled="loading"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium text-sm rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <div v-else class="hidden sm:block"></div>

          <!-- Save Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <!-- Save Button (stays on page) -->
            <button
              type="submit"
              :disabled="loading"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold text-base rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ loading ? 'Saving...' : 'Save' }}
            </button>

            <!-- Save and Close Button -->
            <button
              type="button"
              @click="onSubmit(true)"
              :disabled="loading"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-base rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              {{ loading ? 'Saving...' : (isNew ? 'Create & Close' : 'Save & Close') }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Error State -->
    <div v-else class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
      <div class="flex items-center justify-center space-x-2">
        <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="text-red-800 dark:text-red-400 font-medium">Form not found</span>
      </div>
      <p class="text-red-600 dark:text-red-500 text-sm mt-2">
        The requested form could not be loaded. Please check the form name and try again.
      </p>
    </div>

    <!-- Debug Section -->
    <details class="bg-gray-50 dark:bg-gray-800 rounded-lg">
      <summary class="cursor-pointer p-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
        <span class="font-medium">Debug Information</span>
        <span class="text-xs ml-2">(Click to expand)</span>
      </summary>
      <div class="px-4 pb-4 space-y-4">
        <div>
          <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">WebForm JSON</h4>
          <pre class="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto border">{{ JSON.stringify(webForm, null, 2) }}</pre>
        </div>
        <div>
          <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Document Values</h4>
          <pre class="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto border">{{ JSON.stringify(docValues, null, 2) }}</pre>
        </div>
        <div>
          <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Form Values</h4>
          <pre class="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto border">{{ JSON.stringify(formValues, null, 2) }}</pre>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { call } from "frappe-ui";

const route = useRoute();
const router = useRouter();
const name = ref(route.params.name);

const webForm = ref(null);
const loading = ref(false);
const formValues = reactive({});
const docValues = ref(null);

const docName = computed(() => route.query.doc || null);
const isNew = computed(() => route.query.new == 1 || !docName.value);

const linkInputs = reactive({});
const linkDropdown = reactive({});
const showLinkDropdown = reactive({});
let linkTimeouts = {};

// Dynamic grid class based on column count
function getGridClass(columnCount) {
  if (columnCount === 1) return 'grid-cols-1';
  if (columnCount === 2) return 'grid-cols-1 md:grid-cols-2';
  if (columnCount === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  if (columnCount === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  return `grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(columnCount, 6)}`;
}

// Get textarea rows based on field type and description
function getTextareaRows(field) {
  // Check if field label or description contains keywords that suggest it's a description field
  const isDescriptionField = field.label.toLowerCase().includes('description') ||
                             field.description?.toLowerCase().includes('description') ||
                             field.fieldname.toLowerCase().includes('description');

  if (field.fieldtype === 'Long Text' || field.fieldtype === 'Text Editor') {
    return isDescriptionField ? 10 : 8;
  } else if (field.fieldtype === 'Small Text') {
    return isDescriptionField ? 5 : 3;
  } else if (field.fieldtype === 'Text') {
    return isDescriptionField ? 8 : 5;
  }
  return 5;
}

function parseSections(fields) {
  const sections = [];
  let currentSection = { label: "", columns: [[]] };
  let currentColumn = currentSection.columns[0];

  fields.forEach((field) => {
    if (field.fieldtype === "Section Break") {
      if (
        currentSection.columns.some((col) => col.length) ||
        (currentSection.label && currentSection.label.trim())
      ) {
        sections.push(currentSection);
      }
      currentSection = { label: field.label || "", columns: [[]] };
      currentColumn = currentSection.columns[0];
    } else if (field.fieldtype === "Column Break") {
      currentColumn = [];
      currentSection.columns.push(currentColumn);
    } else if (field.fieldtype === "Page Break") {
      // Optional: handle multi-page here
    } else {
      currentColumn.push(field);
    }
  });

  if (
    currentSection.columns.some((col) => col.length) ||
    (currentSection.label && currentSection.label.trim())
  ) {
    sections.push(currentSection);
  }

  return sections;
}

const sections = computed(() =>
  parseSections(webForm.value?.web_form_fields || [])
);

// Ensure valid color hex
function ensureColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
}

function onColorInput(fieldname, val) {
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    formValues[fieldname] = val;
  }
}

// Typeahead for Link field
function onLinkInput(field) {
  const search = linkInputs[field.fieldname];
  if (!search || search.length < 1 || field.read_only) {
    linkDropdown[field.fieldname] = [];
    return;
  }
  if (linkTimeouts[field.fieldname])
    clearTimeout(linkTimeouts[field.fieldname]);
  linkTimeouts[field.fieldname] = setTimeout(async () => {
    try {
      const res = await call("frappe.client.get_list", {
        doctype: field.options,
        fields: ["name"],
        filters: [["name", "like", `%${search}%`]],
        limit_page_length: 10,
      });
      linkDropdown[field.fieldname] = (res?.message || res || []).map((r) => ({
        value: r.name,
        label: r.name,
      }));
      showLinkDropdown[field.fieldname] = true;
    } catch (err) {
      linkDropdown[field.fieldname] = [];
      showLinkDropdown[field.fieldname] = false;
    }
  }, 180);
}

function selectLinkValue(fieldname, opt) {
  linkInputs[fieldname] = opt.label;
  formValues[fieldname] = opt.value;
  showLinkDropdown[fieldname] = false;
}

function hideLinkDropdownWithDelay(fieldname) {
  setTimeout(() => {
    showLinkDropdown[fieldname] = false;
  }, 160);
}

async function fetchWebForm() {
  loading.value = true;
  webForm.value = null;
  docValues.value = null;
  try {
    const result = await call("frappe.client.get", {
      doctype: "Web Form",
      name: name.value,
    });
    webForm.value = result?.message || result || null;

    if (!isNew.value && docName.value) {
      await fetchDoc();
    }

    if (webForm.value && Array.isArray(webForm.value.web_form_fields)) {
      webForm.value.web_form_fields.forEach((field) => {
        if (field.fieldname) {
          let val =
            (!isNew.value &&
              docValues.value &&
              docValues.value[field.fieldname]) ||
            "";
          formValues[field.fieldname] =
            field.fieldtype === "Color" ? ensureColor(val) : val;
          if (field.fieldtype === "Link") linkInputs[field.fieldname] = val;
        }
      });
    }
  } catch (err) {
    console.error("[WebFormPage] Error fetching webform/meta/doc:", err);
    webForm.value = null;
  }
  loading.value = false;
}

async function fetchDoc() {
  try {
    const docRes = await call("frappe.client.get", {
      doctype: webForm.value.doc_type,
      name: docName.value,
    });
    docValues.value = docRes?.message || docRes || null;
  } catch (err) {
    docValues.value = null;
    console.error("[WebFormPage] Error fetching doc:", err);
  }
}

function onFileChange(event, fieldname) {
  const file = event.target.files[0];
  formValues[fieldname] = file;
}

async function onDelete() {
  if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
    return;
  }

  try {
    loading.value = true;
    await call("frappe.client.delete", {
      doctype: webForm.value.doc_type,
      name: docName.value,
    });

    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.textContent = 'Record deleted successfully!';
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);

    router.push(`/form/${name.value}/list`);
  } catch (err) {
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = 'Failed to delete: ' + (err.message || err);
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);

    console.error("[WebFormPage] Error deleting record:", err);
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  try {
    loading.value = true;
    if (isNew.value) {
      const res = await call("frappe.client.insert", {
        doc: {
          doctype: webForm.value.doc_type,
          ...formValues,
        },
      });
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Record created successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);

      router.push(`/form/${name.value}/list`);
    } else {
      const updatedDoc = { ...docValues.value, ...formValues };
      await call("frappe.client.save", { doc: updatedDoc });

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Record updated successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);

      await fetchDoc();
    }
  } catch (err) {
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = 'Failed to save: ' + (err.message || err);
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);

    console.error("[WebFormPage] Error saving form:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchWebForm);
watch(
  () => [route.params.name, route.query.doc, route.query.new],
  () => {
    name.value = route.params.name;
    fetchWebForm();
  }
);
</script>

<style scoped>
.form-input {
  @apply block w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 read-only:bg-gray-50 dark:read-only:bg-gray-800;
}

.form-field {
  @apply space-y-1;
}

/* Custom scrollbar for dropdowns */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700 rounded;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
