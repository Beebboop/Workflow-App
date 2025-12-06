# Mobile Setup Guide

## Quick Start

1. **Start Backend**: `start-mobile.bat`
2. **Build Mobile App**: `build-mobile.bat` 
3. **Open in Android Studio**: `cd web-app && npm run android:open`
4. **Build APK**: In Android Studio

## Development Commands

```bash
# Development with live reload
npm run mobile:dev

# Build for mobile
npm run mobile:build

# Sync with native projects
npm run android:sync
npm run ios:sync

# Run on device/emulator
npm run android:run
npm run ios:run

# Open native IDEs
npm run android:open
npm run ios:open