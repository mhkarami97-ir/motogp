import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const LINK_CODE_KEY = 'motogp-telegram-link-code'
const LINKED_USER_KEY = 'motogp-telegram-username'
const REMINDERS_ACTIVE_KEY = 'motogp-reminders-active'

export const REMINDER_API_BASE =
  import.meta.env.VITE_REMINDER_API_BASE || 'https://task-reminders.mhkarami97.workers.dev'

function generateRandomCode(): string {
  const bytes = new Uint8Array(8)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `mgp_${hex}`
}

function getStoredLinkCode(): string {
  let code = localStorage.getItem(LINK_CODE_KEY)
  if (!code || !code.startsWith('mgp_')) {
    code = generateRandomCode()
    localStorage.setItem(LINK_CODE_KEY, code)
  }
  return code
}

export interface MotoGPRaceSyncPayload {
  eventId: string
  eventName: string
  circuitName: string
  countryName: string
  raceStart: string
  raceEnd?: string
  year?: number
}

export const useReminderStore = defineStore('motogp-reminder', () => {
  const linkCode = ref<string>(getStoredLinkCode())
  const linked = ref<boolean>(false)
  const username = ref<string | null>(localStorage.getItem(LINKED_USER_KEY) || null)
  const botUsername = ref<string>('f1_reminder_bot')
  const totalRaces = ref<number>(0)
  const nextRace = ref<any>(null)
  const isSubscribedAll = ref<boolean>(localStorage.getItem(REMINDERS_ACTIVE_KEY) === 'true')
  const modalOpen = ref<boolean>(false)
  const loading = ref<boolean>(false)
  const isCheckingStatus = ref<boolean>(false)
  const initialized = ref<boolean>(false)

  const telegramBotUrl = computed<string | null>(() => {
    return botUsername.value ? `https://t.me/${botUsername.value}?start=${linkCode.value}` : null
  })

  async function init(): Promise<void> {
    if (initialized.value) return
    initialized.value = true

    try {
      const res = await fetch(`${REMINDER_API_BASE}/api/motogp/config`)
      if (res.ok) {
        const cfg = (await res.json()) as { botUsername?: string }
        if (cfg.botUsername) botUsername.value = cfg.botUsername
      }
    } catch {
      // offline / fallback
    }

    await checkStatus()
  }

  async function checkStatus(): Promise<boolean> {
    if (isCheckingStatus.value) return linked.value
    isCheckingStatus.value = true

    try {
      const res = await fetch(`${REMINDER_API_BASE}/api/motogp/link/status?code=${linkCode.value}`)
      if (res.ok) {
        const data = (await res.json()) as {
          linked: boolean
          username: string | null
          botUsername?: string
          totalRaces?: number
          nextRace?: any
        }
        linked.value = Boolean(data.linked)
        username.value = data.username ?? null
        if (data.botUsername) botUsername.value = data.botUsername
        if (typeof data.totalRaces === 'number') totalRaces.value = data.totalRaces
        if (data.nextRace) nextRace.value = data.nextRace

        if (linked.value) {
          localStorage.setItem(LINKED_USER_KEY, username.value || '')
          isSubscribedAll.value = true
          localStorage.setItem(REMINDERS_ACTIVE_KEY, 'true')
        } else {
          localStorage.removeItem(LINKED_USER_KEY)
          isSubscribedAll.value = false
          localStorage.removeItem(REMINDERS_ACTIVE_KEY)
        }
      }
    } catch {
      // network error
    } finally {
      isCheckingStatus.value = false
    }

    return linked.value
  }

  function openModal(): void {
    modalOpen.value = true
    void checkStatus()
  }

  function closeModal(): void {
    modalOpen.value = false
  }

  async function syncRaces(races: MotoGPRaceSyncPayload[]): Promise<boolean> {
    if (races.length === 0) return false
    loading.value = true
    try {
      const res = await fetch(`${REMINDER_API_BASE}/api/motogp/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ races, linkCode: linkCode.value }),
      })
      if (res.ok) {
        const data = (await res.json()) as { success: boolean; totalRaces?: number }
        if (data.success && typeof data.totalRaces === 'number') {
          totalRaces.value = data.totalRaces
        }
        return true
      }
    } catch (err) {
      console.error('Failed to sync MotoGP races:', err)
    } finally {
      loading.value = false
    }
    return false
  }

  async function subscribeAll(races?: MotoGPRaceSyncPayload[]): Promise<boolean> {
    if (!linked.value) {
      openModal()
      return false
    }

    loading.value = true
    try {
      const res = await fetch(`${REMINDER_API_BASE}/api/motogp/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkCode: linkCode.value, races }),
      })
      if (res.ok) {
        const data = (await res.json()) as { success: boolean }
        if (data.success) {
          isSubscribedAll.value = true
          localStorage.setItem(REMINDERS_ACTIVE_KEY, 'true')
          return true
        }
      }
    } catch (err) {
      console.error('Failed to subscribe MotoGP season reminders:', err)
    } finally {
      loading.value = false
    }
    return false
  }

  async function unlink(): Promise<void> {
    loading.value = true
    try {
      await fetch(`${REMINDER_API_BASE}/api/motogp/unlink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkCode: linkCode.value }),
      })
    } catch {
      // ignore
    } finally {
      loading.value = false
    }

    linked.value = false
    username.value = null
    isSubscribedAll.value = false
    localStorage.removeItem(LINKED_USER_KEY)
    localStorage.removeItem(REMINDERS_ACTIVE_KEY)
    linkCode.value = generateRandomCode()
    localStorage.setItem(LINK_CODE_KEY, linkCode.value)
  }

  return {
    linkCode,
    linked,
    username,
    botUsername,
    totalRaces,
    nextRace,
    isSubscribedAll,
    modalOpen,
    loading,
    isCheckingStatus,
    initialized,
    telegramBotUrl,
    init,
    checkStatus,
    openModal,
    closeModal,
    syncRaces,
    subscribeAll,
    unlink,
  }
})
