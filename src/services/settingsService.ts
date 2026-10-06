import { getStorage, type StorageService } from './storageService'

export type Theme = 'light' | 'dark'

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark'

export function createSettingsService(storage: StorageService = getStorage()) {
  return {
    /** The farmer's explicit choice, or undefined to follow the phone's setting. */
    async getTheme(): Promise<Theme | undefined> {
      const value = await storage.readSetting('theme')
      return isTheme(value) ? value : undefined
    },

    async setTheme(theme: Theme | undefined): Promise<void> {
      try {
        await storage.writeSetting('theme', theme ?? null)
      } catch {
        // The theme still applies for this session; failing to remember it is not worth an error.
      }
    },
  }
}
