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
          Task Manager
        </h1>
        <p class="text-gray-600">Stay organized and productive</p>
      </div>

      <!-- Add Task Form -->
      <div
        class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8 hover:shadow-2xl transition-all duration-300"
      >
        <form @submit.prevent="addTask" class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative group">
            <input
              v-model="newDescription"
              placeholder="What needs to be done?"
              class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 bg-white/50 backdrop-blur-sm group-hover:border-indigo-300"
              required
            />
            <div
              class="absolute inset-y-0 right-3 flex items-center pointer-events-none"
            >
              <svg
                class="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
            </div>
          </div>
          <select
            v-model="newStatus"
            class="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:border-indigo-300"
          >
            <option value="Open">📋 Open</option>
            <option value="Closed">✅ Closed</option>
          </select>
          <Button
            type="submit"
            variant="solid"
            class="!bg-gradient-to-r !from-indigo-600 !to-purple-600 !text-white hover:!from-indigo-700 hover:!to-purple-700 !shadow-lg hover:!shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Add Task
          </Button>
        </form>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 mb-6 justify-center">
        <Button
          @click="filterStatus = 'all'"
          :variant="filterStatus === 'all' ? 'solid' : 'outline'"
          size="sm"
          class="transition-all duration-200"
        >
          All Tasks ({{ totalTasks }})
        </Button>
        <Button
          @click="filterStatus = 'Open'"
          :variant="filterStatus === 'Open' ? 'solid' : 'outline'"
          size="sm"
          class="transition-all duration-200"
        >
          📋 Open ({{ openTasks }})
        </Button>
        <Button
          @click="filterStatus = 'Closed'"
          :variant="filterStatus === 'Closed' ? 'solid' : 'outline'"
          size="sm"
          class="transition-all duration-200"
        >
          ✅ Closed ({{ closedTasks }})
        </Button>
      </div>

      <!-- Loading State -->
      <div v-if="!todos.data" class="flex justify-center items-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"
        ></div>
        <span class="ml-3 text-gray-600 font-medium"
          >Loading your tasks...</span
        >
      </div>

      <!-- Tasks Grid -->
      <div v-else-if="filteredTodos.length > 0" class="grid gap-4 mb-8">
        <div
          v-for="todo in filteredTodos"
          :key="todo.name"
          class="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
          <!-- Edit Mode -->
          <div v-if="editingId === todo.name && editingDoc" class="space-y-4">
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="flex-1 relative">
                <input
                  v-model="editingDoc.doc.description"
                  class="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 bg-orange-50"
                  placeholder="Update task description..."
                />
              </div>
              <select
                v-model="editingDoc.doc.status"
                class="px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 bg-orange-50"
              >
                <option value="Open">📋 Open</option>
                <option value="Closed">✅ Closed</option>
              </select>
            </div>
            <div class="flex gap-2 justify-end">
              <Button
                @click="saveEdit"
                variant="solid"
                size="sm"
                class="!bg-green-600 !text-white hover:!bg-green-700"
              >
                💾 Save
              </Button>
              <Button @click="cancelEdit" variant="outline" size="sm">
                ❌ Cancel
              </Button>
            </div>
          </div>

          <!-- Normal Display -->
          <div v-else class="flex items-center justify-between gap-4">
            <div class="flex-1 flex items-center gap-3">
              <div
                class="w-2 h-2 rounded-full"
                :class="
                  todo.status === 'Open'
                    ? 'bg-orange-400 animate-pulse'
                    : 'bg-green-400'
                "
              ></div>
              <span
                class="text-gray-800 font-medium text-lg"
                :class="
                  todo.status === 'Closed' ? 'line-through text-gray-500' : ''
                "
              >
                {{ todo.description }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <Badge
                :variant="todo.status === 'Open' ? 'warning' : 'success'"
                class="transition-all duration-200"
              >
                {{ todo.status === "Open" ? "📋 Open" : "✅ Closed" }}
              </Badge>
              <Button
                @click="startEdit(todo)"
                variant="ghost"
                size="sm"
                class="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:!bg-blue-50 !text-blue-600"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  ></path>
                </svg>
              </Button>
              <Button
                @click="deleteTask(todo)"
                variant="ghost"
                size="sm"
                class="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:!bg-red-50 !text-red-600"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
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
          {{
            filterStatus === "all"
              ? "No tasks yet"
              : `No ${filterStatus.toLowerCase()} tasks`
          }}
        </h3>
        <p class="text-gray-500">
          {{
            filterStatus === "all"
              ? "Create your first task to get started!"
              : `No tasks with ${filterStatus.toLowerCase()} status found.`
          }}
        </p>
      </div>

      <!-- Pagination - Only show if there are more items -->
      <div
        v-if="todos.data && todos.data.length >= todos.pageLength"
        class="text-center mb-8"
      >
        <Button
          @click="todos.next()"
          variant="outline"
          class="!border-2 !border-gray-200 hover:!border-indigo-300 hover:!text-indigo-600 transform hover:scale-105 transition-all duration-200"
        >
          Load More Tasks →
        </Button>
      </div>

      <!-- Stats Footer -->
      <div v-if="todos.data && todos.data.length > 0" class="text-center">
        <div
          class="inline-flex items-center gap-6 px-6 py-3 bg-white/50 backdrop-blur-sm rounded-full border border-white/20"
        >
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium text-gray-600">
              {{ openTasks }} Open
            </span>
          </div>
          <div class="w-px h-4 bg-gray-300"></div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-green-400 rounded-full"></div>
            <span class="text-sm font-medium text-gray-600">
              {{ closedTasks }} Completed
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { createListResource, createDocumentResource } from "frappe-ui";
import { Button, Badge } from "frappe-ui";

const todos = createListResource({
  doctype: "ToDo",
  fields: ["name", "description", "status"],
  orderBy: "creation desc",
  start: 0,
  pageLength: 5,
});

const newDescription = ref("");
const newStatus = ref("Open");
const filterStatus = ref("all");

const editingId = ref(null);
const editingDoc = ref(null);

// Computed properties for filtering and stats
const filteredTodos = computed(() => {
  if (!todos.data) return [];
  if (filterStatus.value === "all") return todos.data;
  return todos.data.filter((todo) => todo.status === filterStatus.value);
});

const totalTasks = computed(() => (todos.data ? todos.data.length : 0));
const openTasks = computed(() =>
  todos.data ? todos.data.filter((t) => t.status === "Open").length : 0
);
const closedTasks = computed(() =>
  todos.data ? todos.data.filter((t) => t.status === "Closed").length : 0
);

// Add a new task with enhanced UX
async function addTask() {
  if (!newDescription.value.trim()) return;

  try {
    await todos.insert.submit({
      description: newDescription.value.trim(),
      status: newStatus.value,
    });
    newDescription.value = "";
    newStatus.value = "Open";
    await todos.fetch();
  } catch (error) {
    console.error("Failed to add task:", error);
  }
}

// Start editing a task
function startEdit(todo) {
  editingId.value = todo.name;
  editingDoc.value = createDocumentResource({
    doctype: "ToDo",
    name: todo.name,
  });
}

// Save edited task
async function saveEdit() {
  if (!editingDoc.value || !editingDoc.value.doc.description.trim()) return;

  try {
    await editingDoc.value.setValue.submit({
      description: editingDoc.value.doc.description.trim(),
      status: editingDoc.value.doc.status,
    });
    editingId.value = null;
    editingDoc.value = null;
    await todos.fetch();
  } catch (error) {
    console.error("Failed to save task:", error);
  }
}

// Cancel editing
function cancelEdit() {
  editingId.value = null;
  editingDoc.value = null;
}

// Delete a task with confirmation
async function deleteTask(todo) {
  if (!confirm(`Are you sure you want to delete "${todo.description}"?`))
    return;

  try {
    const docRes = createDocumentResource({
      doctype: "ToDo",
      name: todo.name,
    });
    await docRes.delete.submit();
    await todos.fetch();
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
}

// Initialize
todos.fetch();
</script>
