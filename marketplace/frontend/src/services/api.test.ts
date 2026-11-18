import { afterEach, describe, expect, it, vi } from 'vitest'

describe('API base URL', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('uses the configured API origin without a trailing slash', async () => {
    vi.stubEnv('VITE_API_URL', 'https://pc-paradis-api.onrender.com/')

    const { apiClient } = await import('./api')

    expect(apiClient.defaults.baseURL).toBe(
      'https://pc-paradis-api.onrender.com/api/v1'
    )
  })

  it('keeps same-origin API requests when no API origin is configured', async () => {
    vi.stubEnv('VITE_API_URL', '')

    const { apiClient } = await import('./api')

    expect(apiClient.defaults.baseURL).toBe('/api/v1')
  })
})
