/**
 * Release Notes Service - JSONL Pattern Implementation
 * 
 * This service loads release notes from a JSONL (JSON Lines) file for efficient,
 * scalable release management that avoids context pollution when adding new releases.
 * 
 * JSONL Format:
 * - Each line is a complete JSON object representing one release
 * - Newest releases are appended to the end of the file
 * - Format: {"version":"X.X.X","date":"YYYY-MM-DD","added":[],"fixed":[],"changed":[],"security":[],"breaking":[],"technical":[]}
 * 
 * Benefits:
 * - Add new releases by appending ONE line (no massive file edits)
 * - Context efficient - never need to read entire release history
 * - Scalable - file grows linearly, not exponentially in complexity
 * - Flexible - can limit to recent N releases in UI
 */

// Cache for parsed release notes
let cachedReleaseNotes = null

/**
 * Load and parse release notes from JSONL file
 * @param {number} limit - Maximum number of recent releases to return (default: 20)
 * @returns {Promise<Array>} Array of release note objects, newest first
 */
export async function loadReleaseNotes(limit = 20) {
  if (cachedReleaseNotes) {
    return cachedReleaseNotes.slice(0, limit)
  }

  try {
    const response = await fetch('/data/release-notes.jsonl')
    if (!response.ok) {
      throw new Error(`Failed to load release notes: ${response.status}`)
    }
    
    const text = await response.text()
    const lines = text.trim().split('\n').filter(line => line.trim())
    
    // Parse each line as JSON
    const releases = lines.map(line => {
      try {
        return JSON.parse(line)
      } catch (error) {
        console.warn('Failed to parse release note line:', line, error)
        return null
      }
    }).filter(Boolean)
    
    // Reverse to get newest first (since file grows by appending)
    cachedReleaseNotes = releases.reverse()
    
    return cachedReleaseNotes.slice(0, limit)
  } catch (error) {
    console.error('Failed to load release notes:', error)
    return []
  }
}

/**
 * Add a new release to the JSONL file
 * NOTE: This is for documentation only - actual appending happens during release process
 * 
 * @example
 * // To add a new release, append to public/data/release-notes.jsonl:
 * echo '{"version":"3.26.0","date":"2025-08-03","added":["🌊 Seven Pools Knowledge Graph"],"fixed":[],"changed":[]}' >> public/data/release-notes.jsonl
 */
export function addReleaseNote(release) {
  throw new Error('Release notes should be added via file append during release process, not programmatically')
}

/**
 * Clear the cache (useful for development/testing)
 */
export function clearCache() {
  cachedReleaseNotes = null
}

/**
 * JSONL Release Format Specification
 * 
 * Each line in release-notes.jsonl must be a valid JSON object with these fields:
 * 
 * Required fields:
 * - version (string): Semantic version like "3.26.0"
 * - date (string): ISO date like "2025-08-03"
 * 
 * Optional arrays (include empty arrays for unused categories):
 * - added (array): New features with emoji prefixes
 * - fixed (array): Bug fixes with emoji prefixes  
 * - changed (array): Behavior changes with emoji prefixes
 * - security (array): Security improvements
 * - breaking (array): Breaking changes
 * - technical (array): Technical/internal changes
 * 
 * @example Valid JSONL line:
 * {"version":"3.26.0","date":"2025-08-03","added":["🌊 Seven Pools Knowledge Graph - Interactive visualization"],"fixed":["🐛 Fixed search bug"],"changed":[],"security":[],"breaking":[],"technical":[]}
 */