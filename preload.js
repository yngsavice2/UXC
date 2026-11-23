const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('uxs', {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (payload) => ipcRenderer.invoke('file:save', payload),
  createFile: (payload) => ipcRenderer.invoke('file:create', payload),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url)
});
