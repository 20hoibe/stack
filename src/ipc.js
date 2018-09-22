const {ipcRenderer, remote} = window.require('electron');

export const addTextTask = payload => {
  ipcRenderer.send('task', {
    type: 'add',
    task: {
      type: 'text',
      payload
    }
  });
};

export const closeWindow = () => {
  remote.getCurrentWindow().close();
};