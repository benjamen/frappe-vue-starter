<!-- src/layouts/AdminLayout.vue -->
<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <!-- Hamburger menu button (shows only when sidebar is hidden) -->
    <Button
      v-if="collapsed"
      @click="collapsed = false"
      variant="light"
      icon-left="menu"
      class="absolute top-4 left-4 z-50"
    />
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
          <fa-icon :icon="item.icon" class="mr-3" />
          {{ item.name }}
        </router-link>
      </nav>
    </aside>

    <!-- Content -->
    <div class="flex flex-col flex-1">
      <!-- Top bar -->
      <header
        class="h-16 flex items-center justify-end px-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <Button
          @click="toggleDarkMode"
          variant="light"
          :icon-left="dark ? 'moon' : 'sun'"
        />
        <Button
          v-if="!isLoggedIn"
          to="/account/login"
          variant="light"
          icon-left="log-in"
          class="ml-4"
          >Login</Button
        >
        <Button
          v-else
          @click="logout"
          variant="light"
          icon-left="log-out"
          class="ml-4"
          >Logout</Button
        >
      </header>

      <!-- Main content -->
      <main class="p-6 flex-1 bg-gray-50 dark:bg-gray-900">
        <router-view />
      </main>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { session } from "../data/session";
import { doctypeConfigs } from "../data/doctypeConfigs";

import {
  faHome,
  faChartPie,
  faCogs,
  faSun,
  faMoon,
  faTasks,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { navItems } from "@/navItems";

const faIcon = FontAwesomeIcon;

const collapsed = ref(false);
const dark = ref(document.documentElement.classList.contains("dark"));
const route = useRoute();
const router = useRouter();

const isActive = (path) => route.path === path;
const isLoggedIn = computed(() => session.isLoggedIn);

function toggleDarkMode() {
  dark.value = !dark.value;
  if (dark.value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // Dispatch event to sync with Settings page
  window.dispatchEvent(
    new CustomEvent("darkModeChanged", {
      detail: { enabled: dark.value },
    })
  );
}

async function logout() {
  await session.logout.submit();
}
</script>
