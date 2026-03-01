const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (jsonData) => ipcRenderer.invoke('save-data', jsonData),
})
