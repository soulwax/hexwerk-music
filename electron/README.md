# Electron Setup

This application can run as a desktop app using Electron.

## Development

To run the app in Electron development mode:

```bash
npm run electron:dev
```

This will:
1. Start the Next.js dev server on `http://localhost:3222`
2. Wait for the server to be ready
3. Launch Electron and load the app

## Building for Production

### Build for all platforms:
```bash
npm run electron:build
```

### Build for specific platform:
```bash
# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac

# Linux
npm run electron:build:linux
```

Built applications will be in the `dist/` directory.

## Features

- **Media Keys Support**: Play/pause, next, and previous track buttons work system-wide
- **Native Window**: Proper desktop window with native controls
- **Security**: Context isolation enabled, no node integration in renderer
- **External Links**: Opens external URLs in default browser
- **Platform Detection**: App can detect if running in Electron vs browser

## Architecture

- `electron/main.js`: Main Electron process (handles window, app lifecycle)
- `electron/preload.js`: Preload script (exposes safe APIs to renderer)
- The renderer (Next.js app) communicates via `window.electron` API

## Media Keys

Media keys are automatically registered on Windows and Linux. On macOS, system media keys work natively through the Media Session API.

## Notes

- The app runs the Next.js server in development mode
- For production builds, you may need to bundle the Next.js server or use static export
- Icons should be placed in `public/` directory (icon.ico, icon.icns, icon.png)

