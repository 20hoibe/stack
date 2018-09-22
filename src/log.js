const {ipcRenderer} = window.require('electron');

export const log = what => {
  ipcRenderer.send('log', what);
};