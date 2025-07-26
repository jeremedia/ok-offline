#!/usr/bin/env node

/**
 * Clears all local data including IndexedDB and localStorage
 * Run this in the browser console or as a bookmarklet
 */

const clearAllData = async () => {
  console.log('Starting complete data clear...');
  
  // Clear IndexedDB
  try {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      console.log(`Deleting IndexedDB: ${db.name}`);
      await indexedDB.deleteDatabase(db.name);
    }
  } catch (e) {
    // Fallback for browsers that don't support databases()
    const dbNames = ['bm2023-db', 'bm2024-db', 'bm2025-db'];
    for (const name of dbNames) {
      try {
        console.log(`Deleting IndexedDB: ${name}`);
        await indexedDB.deleteDatabase(name);
      } catch (err) {
        console.log(`Failed to delete ${name}:`, err);
      }
    }
  }
  
  // Clear localStorage
  console.log('Clearing localStorage...');
  localStorage.clear();
  
  // Clear sessionStorage
  console.log('Clearing sessionStorage...');
  sessionStorage.clear();
  
  // Unregister service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      console.log('Unregistering service worker...');
      await registration.unregister();
    }
  }
  
  // Clear caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      console.log(`Deleting cache: ${cacheName}`);
      await caches.delete(cacheName);
    }
  }
  
  console.log('✅ All data cleared! Please refresh the page.');
};

// If running in browser
if (typeof window !== 'undefined') {
  clearAllData();
} else {
  console.log('This script should be run in the browser console.');
  console.log('Copy and paste the clearAllData function into the console.');
}