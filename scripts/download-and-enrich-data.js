#!/usr/bin/env node

import { runCli } from './sync-season-data.js'

process.stderr.write('download-and-enrich-data.js is deprecated; using fail-closed sync-season-data.js\n')
runCli().catch(error => {
  process.stderr.write(`Season sync failed: ${error.message}\n`)
  process.exitCode = 1
})
