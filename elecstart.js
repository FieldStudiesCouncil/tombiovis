const { app, BrowserWindow } = require('electron')

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ width: 1000, height: 800 })

    // and load the index.html of the app.
    win.loadFile('electron.html')
}

app.on('ready', createWindow)