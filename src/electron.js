const fs = require('fs');
const path = require('path');
const {app, ipcMain, BrowserWindow, globalShortcut, Notification, Tray, Menu, nativeImage} = require('electron');
const isDev = require('electron-is-dev');
const uuid = require('uuid');
const isMac = process.platform === 'darwin';
let screen; // lazy loaded

const logMain = what => {
  log('electron', what);
};

const logRenderer = what => {
  log('renderer', what);
};

const log = (origin, what) => {
  console.log(origin, what);
};

if (process.platform === 'darwin') {
  // don't show in dock
  app.dock.hide();
}

// Some windows prevent close, but only hide. If quit is true,
// then close events must not be prevented, because app is to be quitted.
let quit = false;

// asar don't like dots, so normalization is needed
const browserWindowIcon = path.normalize((() => {
  switch (process.platform) {
    case 'linux': {
      return __dirname + '/../assets/64x64.png';
    }
    case 'win32': {
      return __dirname + '/../assets/icon.ico';
    }
    case 'darwin': {
      return __dirname + '/../assets/icon.icns';
    }
  }
})());

// asar don't like dots, so normalization is needed
const trayIcon = path.normalize((() => {
  switch (process.platform) {
    case 'linux': {
      return __dirname + '/../assets/64x64.png';
    }
    case 'win32': {
      return __dirname + '/../assets/icon.ico';
    }
    case 'darwin': {
      return __dirname + '/../assets/iconTemplate.png';
    }
  }
})());

const stateFilePath = app.getPath('userData') + '/state.json';
logMain(`using state file: ${stateFilePath}`);

let appState;
try {
  const appStateString = fs.readFileSync(stateFilePath, {flag: 'r'});
  appState = JSON.parse(appStateString);
} catch (e) {
  appState = {};
}

const setState = state => {
  appState = {...appState, ...state};

  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(appState));
  } catch (e) {
    console.error(e);
  }

  for (const window of windows) {
    window.webContents.send('state', appState);
  }
};

const setWindowState = (id, windowState) => {
  const windowStates = {...(appState.windowStates || {})};
  windowStates[id] = windowState;
  setState({windowStates});
};



const createWindow = (param, {width, height}) => {
  const window = new BrowserWindow({width, height, show: false, icon: browserWindowIcon});
  window.loadURL(isDev ? `http://localhost:3000/index.html` : `file://${__dirname}/../build/index.html`);

  if (!isDev) {
    window.setMenu(null);
  }

  // postpone show window, until loaded
  window.webContents.once('dom-ready', () => {
    window.show();
    window.focus();
  });

  const {id} = window;
  setWindowState(id, param);
  return window;
};

/** @type {Electron.BrowserWindow} */
let createTaskWindow;
const createCreateTaskWindow = () => {
  if (!createTaskWindow) {
    createTaskWindow = createWindow({type: 'create-task'}, {width: 480, height: 120});
    createTaskWindow.on('close', event => {
      if (quit) {
        return;
      }
      
      event.preventDefault();
      createTaskWindow.hide();
    });

    return;
  }

  if (createTaskWindow.isVisible()) {
    createTaskWindow.hide();
  } else {
    createTaskWindow.show();
  }
  
};

/** @type {Electron.BrowserWindow} */
let listWindow;
const toggleListTaskWindow = () => {
  if (!listWindow) {
    listWindow = createWindow({type: 'list-task'}, {width: 640, height: 640});
    listWindow.on('close', event => {
      if (quit) {
        return;
      }
      
      event.preventDefault();
      listWindow.hide();
    });

    return;
  }

  if (listWindow.isVisible()) {
    listWindow.hide();
  } else {
    listWindow.show();
  }
  
};

/** @type {Electron.BrowserWindow[]} */
let screenshotWindows;

const closeScreenshotWindows = () => {
  if (!screenshotWindows) {
    return;
  }

  for (const screenshotWindow of screenshotWindows) {
    screenshotWindow.close();
  }

  screenshotWindows = undefined;
};

const toggleScreenshot = () => {
  if (screenshotWindows) {
    closeScreenshotWindows();
    return;
  }

  screenshotWindows = [];

  for (const display of screen.getAllDisplays()) {
    const screenshotWindow = new BrowserWindow({
      frame: false,
      transparent: true,
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.bounds.width,
      height: display.bounds.height,
      icon: browserWindowIcon
    });

    if (!isDev) {
      screenshotWindow.setMenu(null);
    }

    screenshotWindow.maximize();
    screenshotWindow.loadURL(isDev ? 'http://localhost:3000/screenshot.html' : `file://${__dirname}/../build/screenshot.html`);
    screenshotWindow.show();
    screenshotWindows.push(screenshotWindow);
  }
};

const notifyCurrentTask = () => {
  if (!appState || !appState.tasks || appState.tasks.length === 0) {
    const notification = new Notification({title: `Stack is empty`});
    notification.show();
    return;
  }

  taskNotification({description: 'Currently working on', task: appState.tasks[0]});
};

/** @type {Electron.Tray} */
let tray;
app.on('ready', () => {
  screen = require('electron').screen;

  const trayIconImage = nativeImage.createFromPath(trayIcon);
  trayIconImage.setTemplateImage(true);

  tray = new Tray(trayIconImage);
  const menu = Menu.buildFromTemplate([
    {label: 'Create Task', submenu: [
      {label: 'Text...', accelerator: 'CmdOrCtrl+Shift+J', click: createCreateTaskWindow},
      {label: 'Screenshot...', accelerator: 'CmdOrCtrl+Shift+K', click: toggleScreenshot},
    ]},
    {label: 'Show Current Task', accelerator: 'CmdOrCtrl+Shift+N', click: notifyCurrentTask},
    {label: 'Show List...', accelerator: 'CmdOrCtrl+Shift+L', click: toggleListTaskWindow},
    {label: 'Pop Task', accelerator: 'CmdOrCtrl+Shift+U', click: popTask},
    {label: 'Postpone Task', accelerator: 'CmdOrCtrl+Shift+P', click: postponeTask},
    {type: 'separator'},
    {label: 'Quit', type: 'normal', click: quitApp}
  ]);

  tray.setTitle('Stack');
  tray.setToolTip('Stack');
  tray.setContextMenu(menu);
});

app.on('ready', () => {
  globalShortcut.register('CmdOrCtrl+Shift+J', createCreateTaskWindow);
  globalShortcut.register('CmdOrCtrl+Shift+K', toggleScreenshot);
  globalShortcut.register('CmdOrCtrl+Shift+L', toggleListTaskWindow);
  globalShortcut.register('CmdOrCtrl+Shift+U', popTask);
  globalShortcut.register('CmdOrCtrl+Shift+I', notifyCurrentTask);
  globalShortcut.register('CmdOrCtrl+Shift+P', postponeTask);
});

const quitApp = () => {
  quit = true;
  app.quit();
};

// don't remove listener to prevent app quit
app.on('window-all-closed', () => {});

app.on('activate', () => {});

const windows = new Set();

app.on('browser-window-created', (event, window) => {
  windows.add(window);

  window.once('closed', () => {
    windows.delete(window);
  });
});




const taskNotification = ({description, task}) => {
  switch (task.type) {
  case 'text': {
    const notification = new Notification({
      title: `${description} "${task.payload}"`
    });
    notification.show();
    break;
  }
  case 'image': {
    const notification = new Notification({
      title: description,
      icon: nativeImage.createFromDataURL(task.payload)
    });

    notification.show();
    break;
  }
  default: {
    const notification = new Notification({title: `${description} unknown task type`});
    notification.show();
    break;
  }
  }
};

// business use-cases
const addTask = task => {
  const tasks = [...(appState.tasks || [])];

  task = {...task, id: uuid.v4()};
  tasks.unshift(task);
  setState({tasks});

  taskNotification({description: 'Add Task', task});
};

const postponeTask = () => {
  let notification;
  if (!appState || !appState.tasks || appState.tasks.length === 0) {
    notification = new Notification({
      title: 'Nothing to postpone, feel free to take a walk!'
    });
  } else if (appState.tasks.length === 1) {
    notification = new Notification({
      title: 'Just one more thing before you can take the day off! Hang in there!'
    });
  }
  if (notification) {
    notification.show();
    return;
  }

  let tasks = [...(appState.tasks || [])];
  tasks.push(tasks.shift());
  setState({tasks});
  notifyCurrentTask();
};

const deleteTask = index => {
  const oldTask = appState.tasks[index];

  const tasks = [...(appState.tasks || [])];
  tasks.splice(index, 1);
  setState({tasks});

  taskNotification({description: 'Delete Task', task: oldTask});
};

const popTask = () => {
  if (!appState || !appState.tasks || appState.tasks.length === 0) {
    const notification = new Notification({
      title: 'Cannot pop from empty stack'
    });

    notification.show();
    return;
  }

  const tasks = [...(appState.tasks || [])];
  const oldTask = tasks.shift();

  setState({tasks});

  taskNotification({description: 'Pop Task', task: oldTask});
};




// for initial state, sync event
ipcMain.on('request-state', event => {
  event.returnValue = appState;
});



// channel for simple async commands
ipcMain.on('command', (event, arg) => {
  switch (arg) {
  case 'close-screenshot-windows': {
    closeScreenshotWindows();
    break;
  }
  }
});



// task channel
ipcMain.on('task', (event, arg) => {
  switch (arg.type) {
  case 'add': {
    addTask(arg.task);
    break;
  }
  case 'delete': {
    deleteTask(arg.index);
    break;
  }
  default: {
    logMain({event, arg});
  }
  }
});




// log channel, for React components logging in main thread
ipcMain.on('log', (event, arg) => {
  logRenderer(arg);
});

