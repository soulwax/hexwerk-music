// File: electron/preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Media keys
  /**
   * @param {(key: string) => void} callback
   */
  onMediaKey: (callback) => {
    ipcRenderer.on('media-key', (_, key) => callback(key));
  },
  removeMediaKeyListener: () => {
    ipcRenderer.removeAllListeners('media-key');
  },
  
  // Platform detection
  isElectron: true,
  platform: process.platform,
});

