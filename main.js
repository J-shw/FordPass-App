const {app,BrowserWindow, ipcMain }=require('electron')
const path=require('path')
const url=require('url')
const crypto = require('crypto');
const connectedcar = require('connected-car');


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
    const client = connectedcar.AuthClient('9fb503e0-715b-47e8-adfd-ad4b7770f73b', {region: 'GB'}); // Region argument is only required if you live outside the United States.
    const token = await client.getAccessTokenFromCredentials({
        username: credentials.usr,
        password: credentials.psd,
    });

    console.log(token);
});

app.on('ready',createWindows)