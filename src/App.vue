<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import UpdatePrompt from '@/components/UpdatePrompt.vue'

// Dark mode is applied once, at the html-element level, by themeStore's
// watcher (see src/stores/themeStore.ts). Keeping a single source of truth
// for the `dark` class avoids the root div and <html> ever disagreeing.
</script>

<template>
  <div class="min-h-screen flex flex-col bg-MotoGP-light dark:bg-MotoGP-dark transition-colors duration-300">
    <AppHeader />
    <main class="flex-1 container mx-auto px-4 py-6 max-w-7xl">
      <RouterView />
    </main>
    <AppFooter />
    <UpdatePrompt />
  </div>
</template>