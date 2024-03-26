const {app,BrowserWindow }=require('electron')
const path=require('path')
const url=require('url')
const crypto = require('crypto');

let mainWindow;


const isDev = process.env.NODE_ENV !== 'production';

function createWindows() {
    
    mainWindow = new BrowserWindow({
        width: isDev ? 1400 : 1100,              
        height: 600,             
        icon: '/assets/icons/Icon_256x256.png',
        resizable: isDev,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: true,
          preload: path.join(__dirname,'preload.js')
        },
    });
    // Open devtools
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html')); 
}

app.on('ready',createWindows)