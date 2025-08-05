<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-400">404</h1>
      <p class="text-xl text-gray-600 mt-4">Page not found</p>
      <router-link
        to="/dashboard"
        class="mt-6 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go to Dashboard
      </router-link>
    </div>
  </div>
</template>
