import { expect, test } from '@playwright/test'

async function setInstalledState(page, values = {}) {
  await page.goto('/manifest.json')
  await page.evaluate(state => {
    localStorage.setItem('onboarding_completed', 'true')
    localStorage.setItem('season_default_2026_applied', 'true')
    localStorage.setItem('selectedYear', '2026')
    for (const [key, value] of Object.entries(state)) localStorage.setItem(key, value)
  }, values)
}

async function waitForServiceWorker(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
}

test('fresh installation presents the 2026 onboarding policy and disclaimer', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/2026\/map$/)
  await expect(page.getByRole('heading', { name: '🔥 Welcome to OK-OFFLINE' })).toBeVisible()
  await expect(page.getByText('This app is not affiliated, endorsed, or verified by Burning Man Project.')).toBeVisible()
  await expect(page.getByText('2026 camp placements publish August 23; art placements publish August 30.')).not.toBeVisible()
})

test.describe('desktop release behavior', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Desktop-only service worker checks')

  test('manifest and service worker are installable and revisioned', async ({ page, request }) => {
    const manifestResponse = await request.get('/manifest.json')
    expect(manifestResponse.headers()['content-type']).toMatch(/application\/(manifest\+json|json)/)
    const manifest = await manifestResponse.json()
    expect(manifest.name).toBe('OK-OFFLINE — Black Rock City Guide')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192' }),
      expect.objectContaining({ sizes: '512x512' })
    ]))

    await setInstalledState(page)
    await page.goto('/2026/map')
    await waitForServiceWorker(page)
    const scriptUrl = await page.evaluate(async () => (await navigator.serviceWorker.ready).active.scriptURL)
    expect(scriptUrl).toMatch(/sw\.js\?build=4\.0\.0-/)
  })

  test('upgrades once to 2026 while preserving the compatibility database and historical navigation', async ({ page }) => {
    await page.goto('/manifest.json')
    await page.evaluate(async () => {
      localStorage.setItem('onboarding_completed', 'true')
      localStorage.setItem('selectedYear', '2025')
      localStorage.setItem('favorite_probe', 'preserved')
      localStorage.removeItem('season_default_2026_applied')

      await new Promise((resolve, reject) => {
        const request = indexedDB.open('bm2025-db', 2)
        request.onupgradeneeded = event => {
          const database = event.target.result
          for (const name of ['art', 'camp', 'event']) {
            if (!database.objectStoreNames.contains(name)) {
              const store = database.createObjectStore(name, { keyPath: 'uid' })
              store.createIndex('year', 'year', { unique: false })
            }
          }
        }
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const database = request.result
          const transaction = database.transaction('camp', 'readwrite')
          transaction.objectStore('camp').put({ uid: 'custom-preserved', year: 2025, name: 'Preserved', isCustom: true })
          transaction.oncomplete = () => {
            database.close()
            resolve()
          }
          transaction.onerror = () => reject(transaction.error)
        }
      })
    })

    await page.goto('/')
    await expect(page).toHaveURL(/\/2026\/map$/)
    expect(await page.evaluate(() => localStorage.getItem('selectedYear'))).toBe('2026')
    expect(await page.evaluate(() => localStorage.getItem('favorite_probe'))).toBe('preserved')
    const preserved = await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('bm2025-db', 2)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const database = request.result
        const read = database.transaction('camp').objectStore('camp').get('custom-preserved')
        read.onsuccess = () => {
          database.close()
          resolve(read.result)
        }
        read.onerror = () => reject(read.error)
      }
    }))
    expect(preserved).toMatchObject({ uid: 'custom-preserved', year: 2025, isCustom: true })

    await page.locator('#year-selector').selectOption('2025')
    await expect(page).toHaveURL(/\/2025\/map$/)
    expect(await page.evaluate(() => localStorage.getItem('selectedYear'))).toBe('2025')
  })

  test('season data is network-first with offline cached fallback', async ({ page, context }) => {
    await setInstalledState(page)

    await page.goto('/2026/map')
    await waitForServiceWorker(page)
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready
      const urls = [
        '/data/2026/metadata.json', '/data/2026/camps.json', '/data/2026/art.json', '/data/2026/events.json',
        '/data/2026/gis/city_blocks.geojson', '/data/2026/gis/cpns.geojson', '/data/2026/gis/dmz.geojson',
        '/data/2026/gis/plazas.geojson', '/data/2026/gis/street_lines.geojson', '/data/2026/gis/street_outlines.geojson',
        '/data/2026/gis/toilets.geojson', '/data/2026/gis/trash_fence.geojson'
      ]
      await new Promise((resolve, reject) => {
        const channel = new MessageChannel()
        channel.port1.onmessage = event => event.data?.error ? reject(new Error(event.data.error)) : resolve(event.data)
        registration.active.postMessage({ type: 'CACHE_DATA', data: urls }, [channel.port2])
      })
    })

    const onlineSnapshot = await page.evaluate(async () => {
      const response = await fetch('/data/2026/metadata.json')
      return { contentType: response.headers.get('content-type'), body: await response.json() }
    })
    expect(onlineSnapshot.contentType).toContain('application/json')
    expect(onlineSnapshot.body).toMatchObject({ year: '2026', phase: 'content-public' })
    const workerSource = await (await page.request.get('/sw.js')).text()
    expect(workerSource).toContain('networkFirst(request, DATA_CACHE')

    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('#app .app-title')).toBeVisible()
    expect(await page.evaluate(() => navigator.onLine)).toBe(false)
    await context.setOffline(false)
  })

  test('a newly installed worker removes stale build caches', async ({ page }) => {
    await setInstalledState(page)
    await page.goto('/2026/map')
    await waitForServiceWorker(page)
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration.unregister()
      await caches.open('ok-offline-app-stale-build')
      await navigator.serviceWorker.register('/sw.js?build=4.0.0-replacement-smoke', { updateViaCache: 'none' })
      await navigator.serviceWorker.ready
    })
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).includes('ok-offline-app-stale-build'))).toBe(false)
  })
})

test('mobile WebKit can navigate current and historical editions', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'WebKit mobile smoke')
  await setInstalledState(page)
  await page.goto('/2026/map')
  await expect(page.locator('#app .app-title')).toBeVisible()
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.locator('#mobile-year-selector').selectOption('2025')
  await expect(page).toHaveURL(/\/2025\/map$/)
})
