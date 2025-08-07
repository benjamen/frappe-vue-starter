<template>
  <div>
    <router-view />
  </div>
</template>
<script setup>
import { usePageConfigStore } from "@/stores/pageConfig";
import { onMounted } from "vue";

const pageConfigStore = usePageConfigStore();

onMounted(() => {
  pageConfigStore.fetchConfigs();
});

</script>
