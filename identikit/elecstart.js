const { app, BrowserWindow, Menu } = require('electron')
const PDFWindow = require('electron-pdf-window')
var win;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ 
        width: 1000, 
        height: 800,
        icon: __dirname + '/tombio/resources/electron-icon.png',
        webPreferences: {
          nodeIntegration: true
        }
    })

    // and load the index.html of the app.
    win.loadFile('identikit/electron.html')
}

app.on('ready', createWindow)

const template = [
    // {
    //   label: 'Edit',
    //   submenu: [
    //     { role: 'undo' },
    //     { role: 'redo' },
    //     { type: 'separator' },
    //     { role: 'cut' },
    //     { role: 'copy' },
    //     { role: 'paste' },
    //     { role: 'pasteandmatchstyle' },
    //     { role: 'delete' },
    //     { role: 'selectall' }
    //   ]
    // },
    {
      label: 'View',
      submenu: [
        { 
            label: 'Select knowledge-base',
            click() {win.loadFile('identikit/electron.html')}
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
        label: 'Identikit Help',
        submenu: [
          { 
              label: 'Building a knowledge-base',
              click() {openPDF('Building a knowledge-base.pdf')}
          },
          { 
            label: 'Deploying Identikit ID resources',
            click() {openPDF('Deploying your visualisations.pdf')}
          },
          { type: 'separator' },
          { 
            label: 'Getting started',
            click() {openPDF('Getting started.pdf')}
          },
          { 
            label: 'Quick-start guide',
            click() {openPDF('Quick-start guide.pdf')}
          },
          { type: 'separator' },
          { 
            label: 'Character scoring',
            click() {openPDF('Character scoring.pdf')}
          },
          { 
            label: 'Notes for coders',
            click() {openPDF('Notes for coders.pdf')}
          }
        ]
      }
    // {
    //   role: 'help',
    //   submenu: [
    //     {
    //       label: 'Learn More',
    //       click () { require('electron').shell.openExternal('https://electronjs.org') }
    //     }
    //   ]
    // }
  ]

  function openPDF(file) {
    let pdf = new PDFWindow({
        width: 800,
        height: 600,
        icon: __dirname + '/tombio/resources/electron-icon.png',
        autoHideMenuBar: true
    })
    pdf.loadURL(__dirname + '/documentation/' + file)
  }
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)