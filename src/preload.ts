import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('tandem', {
  // Navigation
  navigate: (url: string) => ipcRenderer.invoke('navigate', url),
  goBack: () => ipcRenderer.invoke('go-back'),
  goForward: () => ipcRenderer.invoke('go-forward'),
  reload: () => ipcRenderer.invoke('reload'),

  // Page content
  getPageContent: () => ipcRenderer.invoke('get-page-content'),
  getPageStatus: () => ipcRenderer.invoke('get-page-status'),
  executeJS: (code: string) => ipcRenderer.invoke('execute-js', code),

  // Events from main process
  onCopilotAlert: (callback: (data: { title: string; body: string }) => void) => {
    ipcRenderer.on('copilot-alert', (_event, data) => callback(data));
  },
  onNavigated: (callback: (url: string) => void) => {
    ipcRenderer.on('navigated', (_event, url) => callback(url));
  },
});
