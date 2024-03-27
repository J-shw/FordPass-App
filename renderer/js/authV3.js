function send(){
    let username = document.getElementById('txtUsr').value;
    let password = document.getElementById('txtPwd').value;
    ipcRenderer.send('read-file-lines', {usr: username, psd: password})
}
