<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Hamburger menu button (shows only when sidebar is hidden/collapsed) -->
    <Button
      v-if="collapsed"
      @click="collapsed = false"
      variant="light"
      icon-left="menu"
      class="absolute top-4 left-4 z-50"
    />
    <!-- Sidebar -->
    <aside
      :class="[
        'transition-all duration-300 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
        collapsed ? 'hidden' : 'block',
      ]"
    >
      <div
        class="h-16 flex items-center justify-between px-4 border-b dark:border-gray-700"
      >
        <span class="text-xl font-semibold text-gray-800 dark:text-gray-200"
          >MyApp</span
        >
        <Button
          @click="collapsed = !collapsed"
          variant="light"
          :icon-left="collapsed ? 'chevron-right' : 'chevron-left'"
        />
      </div>
      <nav class="p-4 space-y-2">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          :class="{
            'bg-gray-100 dark:bg-gray-700 font-medium': isActive(item.to),
          }"
        >
          <fa-icon v-if="item.icon" :icon="item.icon" class="mr-3" />
          {{ item.name }}
        </router-link>
      </nav>
    </aside>

    <!-- Content area -->
    <div class="flex flex-col flex-1">
      <!-- Top bar -->
      <header
        class="h-16 flex items-center justify-end px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <div class="flex items-center gap-2">
          <!-- Settings/Profile Dropdown -->
          <div class="relative" v-if="isLoggedIn">
            <button
              @click="showSettingsMenu = !showSettingsMenu"
              class="flex items-center gap-2 px-3 py-2 text-gray-800 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <span class="text-sm">{{ userInitials }}</span>
              <span class="text-xs">{{ showSettingsMenu ? "▲" : "▼" }}</span>
            </button>
            <div
              v-if="showSettingsMenu"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1"
            >
              <router-link
                to="/profile"
                class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                @click="showSettingsMenu = false"
              >
                <span class="text-sm">⚙️</span> Profile Settings
              </router-link>
              <hr class="my-1 border-gray-200 dark:border-gray-700" />
              <button
                @click="logout"
                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <span class="text-sm">🚪</span> Logout
              </button>
            </div>
          </div>
          <!-- Dark Mode Toggle -->
          <button
            @click="toggleDarkMode"
            class="p-2 text-gray-800 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            :title="dark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <span class="text-lg">{{ dark ? "🌙" : "☀️" }}</span>
          </button>
          <!-- Login Button -->
          <button
            v-if="!isLoggedIn"
            @click="router.push('/account/login')"
            class="ml-2 px-3 py-2 text-gray-800 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <span class="text-sm">🔑</span> Login
          </button>
        </div>
      </header>
      <!-- Main content -->
      <main class="p-6 flex-1 bg-gray-50 dark:bg-gray-900">
        <router-view />
      </main>
    </div>

    <!-- Click outside to close settings menu -->
    <div
      v-if="showSettingsMenu"
      @click="showSettingsMenu = false"
      class="fixed inset-0 z-40"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { session } from "@/data/session";
import { useNavItems } from "@/navItems"; // <-- Import this composable!

const navItems = useNavItems(); // <-- Use dynamic nav!
const collapsed = ref(false);
const dark = ref(document.documentElement.classList.contains("dark"));
const showSettingsMenu = ref(false);
const route = useRoute();
const router = useRouter();

const isActive = (path) => route.path === path;
const isLoggedIn = computed(() => session.isLoggedIn || session.user);

// User initials...
const userInitials = computed(() => {
  if (session.userInfo?.full_name) {
    return session.userInfo.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (session.user) {
    return session.user.split("@")[0].slice(0, 2).toUpperCase();
  }
  return "U";
});

function toggleDarkMode() {
  dark.value = !dark.value;
  if (dark.value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  window.dispatchEvent(
    new CustomEvent("darkModeChanged", { detail: { enabled: dark.value } })
  );
}

async function logout() {
  showSettingsMenu.value = false;
  await session.logout.submit();
}

onMounted(() => {
  window.addEventListener("click", (e) => {
    if (
      showSettingsMenu.value &&
      !e.target.closest(".relative") &&
      !e.target.closest(".absolute")
    ) {
      showSettingsMenu.value = false;
    }
  });
});
</script>
