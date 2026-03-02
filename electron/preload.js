const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Dosyadan senkron oku — React loadData() tarafından çağrılır
  loadData: () => ipcRenderer.sendSync('load-data-sync'),
  // Dosyaya async kaydet
  saveData: (jsonData) => ipcRenderer.invoke('save-data', jsonData),
})
