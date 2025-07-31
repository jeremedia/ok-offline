#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'HARDCODED_COLORS.md');
const content = fs.readFileSync(filePath, 'utf8');

// Convert lines starting with "- Line" to checkbox format
const converted = content.replace(/^- Line (\d+): (.+)$/gm, '- [ ] Line $1: $2');

fs.writeFileSync(filePath, converted);
console.log('✅ Converted HARDCODED_COLORS.md to checkbox format');