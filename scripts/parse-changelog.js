#!/usr/bin/env node

/**
 * Parse CHANGELOG.md and generate release notes data for the app
 * This script can be run manually or as part of the build process
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')
const outputPath = path.join(__dirname, '..', 'src', 'data', 'releaseNotes.json')

function parseChangelog() {
  const content = fs.readFileSync(changelogPath, 'utf8')
  const releases = []
  
  // Split by version headers
  const versionSections = content.split(/^## \[/m).slice(1)
  
  versionSections.forEach(section => {
    const lines = section.split('\n')
    const versionMatch = lines[0].match(/^([\d.]+)\] - (.+)/)
    
    if (!versionMatch) return
    
    const version = versionMatch[1]
    const date = versionMatch[2]
    
    const release = {
      version,
      date,
      added: [],
      changed: [],
      fixed: [],
      deprecated: [],
      removed: [],
      security: [],
      technical: []
    }
    
    let currentSection = null
    
    lines.slice(1).forEach(line => {
      if (line.startsWith('### Added')) {
        currentSection = 'added'
      } else if (line.startsWith('### Changed')) {
        currentSection = 'changed'
      } else if (line.startsWith('### Fixed')) {
        currentSection = 'fixed'
      } else if (line.startsWith('### Deprecated')) {
        currentSection = 'deprecated'
      } else if (line.startsWith('### Removed')) {
        currentSection = 'removed'
      } else if (line.startsWith('### Security')) {
        currentSection = 'security'
      } else if (line.startsWith('### Technical')) {
        currentSection = 'technical'
      } else if (line.startsWith('- ') && currentSection) {
        release[currentSection].push(line.substring(2))
      }
    })
    
    // Clean up empty arrays
    Object.keys(release).forEach(key => {
      if (Array.isArray(release[key]) && release[key].length === 0) {
        delete release[key]
      }
    })
    
    releases.push(release)
  })
  
  return releases
}

try {
  const releaseNotes = parseChangelog()
  
  // Ensure directory exists
  const dataDir = path.dirname(outputPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  // Write JSON file
  fs.writeFileSync(outputPath, JSON.stringify(releaseNotes, null, 2))
  
  console.log(`Successfully parsed ${releaseNotes.length} releases`)
  console.log(`Output written to: ${outputPath}`)
} catch (error) {
  console.error('Error parsing changelog:', error)
  process.exit(1)
}