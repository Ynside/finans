const { app, BrowserWindow, protocol, net, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')

const isDev = !app.isPackaged

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
  },
])

function getDataFilePath() {
  return path.join(app.getPath('userData'), 'finansal-veriler.json')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Finansal Takip Sistemi',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:3000')
    win.webContents.openDevTools()
  } else {
    win.loadURL('app://localhost/index.html')
  }
}

// IPC: React'in doğrudan dosyadan senkron okuması için
ipcMain.on('load-data-sync', (event) => {
  const dataFile = getDataFilePath()
  if (fs.existsSync(dataFile)) {
    try {
      event.returnValue = fs.readFileSync(dataFile, 'utf-8')
    } catch {
      event.returnValue = null
    }
  } else {
    event.returnValue = null
  }
})

// IPC: Renderer'dan gelen veriyi dosyaya kaydet
ipcMain.handle('save-data', (event, jsonData) => {
  try {
    fs.writeFileSync(getDataFilePath(), jsonData, 'utf-8')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

app.whenReady().then(() => {
  if (!isDev) {
    const outDir = path.join(__dirname, '..', 'out')

    protocol.handle('app', (request) => {
      const { pathname } = new URL(request.url)
      let filePath = path.join(outDir, pathname)

      if (!path.extname(filePath)) {
        const withIndex = path.join(filePath, 'index.html')
        if (fs.existsSync(withIndex)) {
          filePath = withIndex
        } else {
          filePath = filePath + '.html'
        }
      }

      return net.fetch(url.pathToFileURL(filePath).href)
    })
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
