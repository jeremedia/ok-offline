# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OK-OFFLINE is a Progressive Web App (PWA) built with Vue 3 and Vite that serves as an offline-first guide for Burning Man events. The app fetches data from the Burning Man Public API and caches it locally using IndexedDB, allowing participants to browse camps, art installations, and events without connectivity.

Created by Jeremy Roush and brought to you by Mr. OK of OKNOTOK.

## Development Notes

- server is always running, no need to start it for playwright mcp testing

## Current Architecture (Vue 3 + Vite)

### Tech Stack
- **Vue 3** - Frontend framework with Composition API
- **Vue Router 4** - Client-side routing
- **Vite** - Build tool and dev server with HMR
- **Leaflet 1.9.3** - Interactive maps
- **IndexedDB** - Offline data storage
- **Service Workers** - PWA functionality
- **Berkeley Mono** - Custom monospace font

[... rest of the existing content remains unchanged ...]