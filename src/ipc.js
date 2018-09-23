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

export const deleteTask = index => {
  ipcRenderer.send('task', {
    type: 'delete',
    index
  });
};

export const closeWindow = () => {
  remote.getCurrentWindow().close();
};