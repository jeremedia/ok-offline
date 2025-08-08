#!/usr/bin/env node

/**
 * Check GitHub Actions build status for OK-OFFLINE
 * Run with: node scripts/check-build-status.js
 */

import { execSync } from 'child_process';

const REPO = 'jeremedia/ok-offline';
const WORKFLOW = 'Deploy to Production';

function checkBuildStatus() {
  try {
    // Get latest workflow runs
    const output = execSync(`gh run list --repo ${REPO} --workflow "${WORKFLOW}" --limit 5 --json status,conclusion,createdAt,headBranch,event`, { encoding: 'utf8' });
    const runs = JSON.parse(output);
    
    console.log(`\n📊 OK-OFFLINE Build Status Report`);
    console.log(`${'='.repeat(50)}\n`);
    
    // Check latest run
    if (runs.length > 0) {
      const latest = runs[0];
      const status = latest.conclusion || latest.status;
      const emoji = status === 'success' ? '✅' : status === 'failure' ? '❌' : '⏳';
      
      console.log(`Latest Build: ${emoji} ${status.toUpperCase()}`);
      console.log(`Branch: ${latest.headBranch}`);
      console.log(`Time: ${new Date(latest.createdAt).toLocaleString()}`);
      console.log(`Trigger: ${latest.event}\n`);
      
      // Show recent history
      console.log('Recent Builds:');
      runs.forEach((run, i) => {
        const runStatus = run.conclusion || run.status;
        const runEmoji = runStatus === 'success' ? '✅' : runStatus === 'failure' ? '❌' : '⏳';
        console.log(`  ${i + 1}. ${runEmoji} ${runStatus.padEnd(10)} - ${new Date(run.createdAt).toLocaleString()}`);
      });
      
      // Count failures
      const failures = runs.filter(r => r.conclusion === 'failure').length;
      if (failures > 0) {
        console.log(`\n⚠️  Warning: ${failures} out of ${runs.length} recent builds failed!`);
      } else {
        console.log(`\n✨ All recent builds passed!`);
      }
      
      // If latest failed, show how to view logs
      if (latest.conclusion === 'failure') {
        console.log(`\n🔍 To view failure details:`);
        console.log(`   gh run view --repo ${REPO} --log-failed`);
      }
    } else {
      console.log('No workflow runs found.');
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`View all runs: https://github.com/${REPO}/actions\n`);
    
  } catch (error) {
    console.error('Error checking build status:', error.message);
    console.log('\nMake sure you have GitHub CLI installed and authenticated:');
    console.log('  brew install gh');
    console.log('  gh auth login');
  }
}

// Run the check
checkBuildStatus();