/**
 * Screenshot Analysis Helper
 * 
 * This helper ensures proper screenshot analysis during development
 * by enforcing a two-step process: capture then analyze
 */

/**
 * Structured analysis template for screenshots
 * @param {string} imagePath - Path to the screenshot file
 * @returns {Object} Analysis structure
 */
export function createScreenshotAnalysis(imagePath) {
  return {
    imagePath,
    timestamp: new Date().toISOString(),
    analysis: {
      overallLayout: '',
      headerNavigation: '',
      mainContent: '',
      interactiveElements: '',
      visualIssues: '',
      mobileSpecific: ''
    }
  }
}

/**
 * Log reminder to read screenshot file
 * @param {string} screenshotName - Name of the screenshot
 * @param {string} filePath - Path to the screenshot file
 */
export function logScreenshotReminder(screenshotName, filePath) {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║ SCREENSHOT TAKEN: ${screenshotName.padEnd(44)}║
╠═══════════════════════════════════════════════════════════════╣
║ IMPORTANT: Read this file to analyze the visual output:       ║
║ ${filePath.padEnd(61)}║
╠═══════════════════════════════════════════════════════════════╣
║ Analysis checklist:                                           ║
║ 1. Overall Layout - What is the general structure?            ║
║ 2. Header/Navigation - What's at the top?                     ║
║ 3. Main Content - What's in the center/body?                  ║
║ 4. Interactive Elements - Buttons, forms, controls visible?   ║
║ 5. Visual Issues - Anything broken, overlapping, cut off?     ║
║ 6. Mobile-Specific - Touch targets, spacing, readability?     ║
╚═══════════════════════════════════════════════════════════════╝
  `)
}

/**
 * Visual testing assertions for common mobile issues
 */
export const mobileTestChecklist = {
  touchTargets: 'Minimum 44x44px for all interactive elements',
  spacing: 'Adequate padding between elements for finger taps',
  textSize: 'Minimum 16px font size for readability',
  viewport: 'Content fits within viewport without horizontal scroll',
  orientation: 'Layout adapts properly to portrait/landscape',
  bottomNav: 'Bottom navigation accessible with thumb reach',
  modals: 'Modals/overlays centered and not cut off',
  keyboard: 'Input fields accessible when keyboard appears'
}

/**
 * Get mobile viewport configurations for testing
 */
export const mobileViewports = {
  iphoneSE: { width: 375, height: 667, name: 'iPhone SE' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
  pixel7: { width: 412, height: 915, name: 'Pixel 7' },
  ipadMini: { width: 768, height: 1024, name: 'iPad Mini' }
}

/**
 * Document visual test results
 * @param {string} testName - Name of the test
 * @param {Object} analysis - Screenshot analysis results
 * @param {boolean} passed - Whether the test passed
 * @param {Array<string>} issues - List of issues found
 */
export function documentVisualTest(testName, analysis, passed, issues = []) {
  const result = {
    testName,
    timestamp: new Date().toISOString(),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    passed,
    analysis,
    issues
  }
  
  console.log('Visual Test Result:', result)
  return result
}