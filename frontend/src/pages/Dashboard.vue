<!-- src/pages/Dashboard.vue -->
<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
      Dashboard
    </h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Statistics">
        <p class="text-gray-600 dark:text-gray-300 mb-2">
          Use Frappe UI components inside your new layout.
        </p>
        <Button @click="dialogOpen = true">Open Dialog</Button>
      </Card>
      <Card title="Table">
        <!-- Example table using Frappe UI styles -->
        <div class="overflow-x-auto">
          <table
            class="min-w-full text-left text-sm text-gray-600 dark:text-gray-300"
          >
            <thead
              class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <tr>
                <th class="px-4 py-2">Name</th>
                <th class="px-4 py-2">Status</th>
                <th class="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.name"
                class="border-b dark:border-gray-600"
              >
                <td class="px-4 py-2">{{ user.name }}</td>
                <td class="px-4 py-2">{{ user.status }}</td>
                <td class="px-4 py-2">
                  <Button size="xs" @click="() => alert(user.name)"
                    >View</Button
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
    <Dialog v-model="dialogOpen" title="Example Dialog"
      >Dialog content goes here.</Dialog
    >
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Card, Dialog, Button } from "frappe-ui";

const dialogOpen = ref(false);
const users = [
  { name: "User A", status: "Active" },
  { name: "User B", status: "Pending" },
];
</script>
