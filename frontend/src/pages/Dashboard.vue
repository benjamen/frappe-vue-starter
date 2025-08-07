<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
      Dashboard
    </h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Statistics">
        <p class="text-gray-600 dark:text-gray-300 mb-2">
          Welcome back, {{ userName }}! Use Frappe UI components inside your new layout.
        </p>
        <Button @click="dialogOpen = true">Open Dialog</Button>
      </Card>
      <Card title="User Info">
        <div class="space-y-2">
          <p class="text-sm">
            <span class="font-medium">Email:</span> {{ session.user }}
          </p>
          <p class="text-sm" v-if="session.userInfo?.full_name">
            <span class="font-medium">Name:</span> {{ session.userInfo.full_name }}
          </p>
          <div class="mt-4">
            <Button @click="$router.push('/profile')" variant="outline" size="sm">
              Update Profile
            </Button>
            <Button @click="handleLogout" variant="outline" size="sm" class="ml-2 text-red-600">
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Table from original -->
    <Card title="Table" class="mt-6">
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
                <Button size="xs" @click="() => alert(user.name)">View</Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Dialog v-model="dialogOpen" title="Example Dialog">
      Dialog content goes here.
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { Card, Dialog, Button } from "frappe-ui"
import { session } from '@/data/session'

const dialogOpen = ref(false)
const users = [
  { name: "User A", status: "Active" },
  { name: "User B", status: "Pending" },
]

const userName = computed(() => {
  if (session.userInfo?.full_name) {
    return session.userInfo.full_name
  }
  if (session.user) {
    return session.user.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  return 'User'
})

const handleLogout = () => {
  if (confirm('Are you sure you want to sign out?')) {
    session.logout.submit()
  }
}
</script>
