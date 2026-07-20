import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/season-registry.test.js',
      'test/gis-routing.test.js',
      'test/unit/**/*.test.js'
    ]
  }
})
