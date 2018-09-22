const fs = require('fs');
const path = require('path');
const {app, ipcMain, BrowserWindow, globalShortcut} = require('electron');
const isDev = require('electron-is-dev');

const logMain = what => {
  log('electron', what);
};

const logRenderer = what => {
  log('renderer', what);
};

const log = (origin, what) => {
  console.log(origin, what);
};


let mainWindow;
let screenshotWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({width: 900, height: 680});
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.on('closed', () => mainWindow = null);
};

function createScreenshotWindow() {
  let screenshot = new BrowserWindow({
    frame: false,
    transparent: true
  });
  screenshot.maximize();
  screenshot.loadURL(isDev ? 'http://localhost:3000/screenshot.html' : `file://${path.join(__dirname, '../build/screenshot.html')}`);
  screenshot.on('close', () => screenshotWindow = null);
  screenshot.show();
  return screenshot;
}

app.on('ready', () => {
  createWindow();

  globalShortcut.register('CommandOrControl+Shift+J', () => {
    addTask({
      type: 'text',
      payload: 'you pressed Cmd/Ctrl+Shift+J'
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

const windows = new Set();

app.on('browser-window-created', (event, window) => {
  console.log('browser window created');
  windows.add(window);

  window.once('close', () => {
    windows.delete(window);
  });
});

ipcMain.on('push', (event, arg) => {
  if (screenshotWindow === null || screenshotWindow === undefined) {
    screenshotWindow = createScreenshotWindow();
    console.log({
      arg
    });
  }
});

ipcMain.on('image', (event, arg) => {
  console.log(arg);
  screenshotWindow.close();
});



let appState = {};
const setState = state => {
  appState = {...appState, ...state};

  for (const window of windows) {
    window.webContents.send('state', appState);
  }
};




// business use-cases
const addTask = task => {
  const tasks = [...(appState.tasks || [])];
  tasks.push(task);
  setState({tasks});
};





// for initial state, sync event
ipcMain.on('request-state', event => {
  event.returnValue = appState;
});



// task channel
ipcMain.on('task', (event, arg) => {
  switch (arg.type) {
    case 'add': {
      addTask(arg.task);
      break;
    }
    default: {
      console.log({event, arg});
      console.warn('wot?');
    }
  }
});




// log channel, for React components logging in main thread
ipcMain.on('log', (event, arg) => {
  logRenderer(arg);
});

