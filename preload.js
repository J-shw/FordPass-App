const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { contextBridge, ipcRenderer, dialog } = require('electron');

contextBridge.exposeInMainWorld('os', {
    homedir: () => os.homedir(),
});

contextBridge.exposeInMainWorld('path', {
    join: (...args) => path.join(...args),
});

contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

contextBridge.exposeInMainWorld('secureCrypto', {
    createHash: algorithm => {
        return crypto.createHash(algorithm);
    }
});
