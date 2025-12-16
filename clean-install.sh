#!/bin/bash
# Clean up problematic dependencies
rm -f package-lock.json
rm -rf node_modules
npm install
