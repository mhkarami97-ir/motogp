<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { useReminderStore } from '@/stores'

const { t } = useI18n()
const route = useRoute()
const mobileMenuOpen = ref(false)
const reminderStore = useReminderStore()

const navItems = [
  { name: t('nav.home'), to: '/' },
  { name: t('nav.drivers'), to: '/drivers' },
  { name: t('nav.teams'), to: '/teams' },
  { name: t('nav.calendar'), to: '/calendar' },
]
</script>

<template>
  <header class="stripe-top sticky top-0 z-50 border-b border-MotoGP-light-border dark:border-MotoGP-border bg-MotoGP-light-surface/90 dark:bg-MotoGP-dark/90 backdrop-blur-md transition-colors duration-300">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="flex items-center justify-between h-16">
        <RouterLink to="/" class="flex items-center gap-2 group">
          <span class="relative text-MotoGP-red font-black text-2xl tracking-tight">
            MotoGP
            <span class="absolute -bottom-1 right-0 left-0 h-0.5 bg-MotoGP-red scale-x-0 group-hover:scale-x-100 transition-transform origin-right" />
          </span>
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">ایران</span>
        </RouterLink>

        <nav class="hidden md:flex items-center gap-6">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'relative py-1 text-sm font-medium transition-colors hover:text-MotoGP-red',
              route.path === item.to ? 'text-MotoGP-red' : 'text-gray-600 dark:text-gray-300',
            ]"
          >
            {{ item.name }}
            <span v-if="route.path === item.to" class="absolute -bottom-1 right-0 left-0 h-0.5 rounded-full bg-MotoGP-red" />
          </RouterLink>
        </nav>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-MotoGP-light-surface-2 dark:hover:bg-MotoGP-surface transition-colors"
            title="یادآور تلگرام"
            aria-label="یادآور تلگرام"
            @click="reminderStore.openModal"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span v-if="reminderStore.linked" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-MotoGP-dark" />
          </button>
          <ThemeToggle />
          <button
            class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-MotoGP-light-surface-2 dark:hover:bg-MotoGP-surface transition-colors"
            aria-label="منو"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-MotoGP-light-border dark:border-MotoGP-border space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'block py-2 px-2 rounded-lg text-sm font-medium transition-colors',
            route.path === item.to ? 'text-MotoGP-red bg-MotoGP-red/5' : 'hover:text-MotoGP-red hover:bg-MotoGP-light-surface-2 dark:hover:bg-MotoGP-surface',
          ]"
          @click="mobileMenuOpen = false"
        >
          {{ item.name }}
        </RouterLink>
        <button
          type="button"
          class="flex w-full items-center justify-between py-2 px-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-MotoGP-red hover:bg-MotoGP-light-surface-2 dark:hover:bg-MotoGP-surface transition-colors"
          @click="reminderStore.openModal(); mobileMenuOpen = false"
        >
          <span class="flex items-center gap-2">
            <span>🔔</span>
            <span>یادآور تلگرام</span>
          </span>
          <span v-if="reminderStore.linked" class="text-xs text-emerald-500 font-bold">فعال</span>
        </button>
      </div>
    </div>
  </header>
</template>