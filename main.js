const {app,BrowserWindow, ipcMain }=require('electron')
const path=require('path')
const auth = require('./modules/auth');

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

ipcMain.on('read-file-lines', async (event, credentials) => {
    auth.authenticate(credentials.usr,credentials.psd);
});

app.on('ready',createWindows)