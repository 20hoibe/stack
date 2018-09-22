const {app, ipcMain, BrowserWindow, globalShortcut, Notification, Tray, Menu, nativeImage} = require('electron');
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

const createWindow = param => {
  mainWindow = new BrowserWindow({width: 480, height: 120, show: false});
  mainWindow.loadURL(isDev ? `http://localhost:3000` : `file://${__dirname}/../build/index.html`);
  mainWindow.on('closed', () => mainWindow = null);

  // postpone show window, until loaded
  mainWindow.webContents.once('dom-ready', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  const {id} = mainWindow;
  setWindowState(id, param);
};

const createScreenshotWindow = () => {
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

let tray;
app.on('ready', () => {
  tray = new Tray(__dirname + '/assets/tray.png');
  const menu = Menu.buildFromTemplate([
    {label: `Create Task\t${process.platform !== 'darwin' ? 'Ctrl' : 'Cmd'}+Shift+J`, type: 'normal', click: () => {
      createCreateTaskWindow();
    }},
    {label: 'Quit', type: 'normal', click: () => {
      app.quit();
    }}
  ]);
  tray.setTitle('Stack');
  tray.setToolTip('Stack');
  tray.setContextMenu(menu);
});

app.on('ready', () => {
  globalShortcut.register('CommandOrControl+Shift+J', () => {
    createCreateTaskWindow();
  });

  globalShortcut.register('CommandOrControl+Shift+K', () => {
    screenshotWindow = createScreenshotWindow();
  });
});

app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('activate', () => {
  if (mainWindow === null) {
    // createWindow('test2');
  }
});

const windows = new Set();

app.on('browser-window-created', (event, window) => {
  windows.add(window);

  window.once('close', () => {
    windows.delete(window);
  });
});

ipcMain.on('push', (event, arg) => {
  if (!screenshotWindow) {
    screenshotWindow = createScreenshotWindow();
    console.log({
      arg
    });
  }
});

ipcMain.on('image', (event, arg) => {

  let image;
  if (arg === null || arg === undefined) {
    image = nativeImage.createFromPath(`${__dirname}/assets/placeholder.png`);
  } else {
    image = arg;
  }

  addTask({
    type: 'image',
    payload: image
  });

  if (screenshotWindow) {
    screenshotWindow.close();
  }
});



let appState = {};
const setState = state => {
  appState = {...appState, ...state};

  for (const window of windows) {
    window.webContents.send('state', appState);
  }
};

const taskNotification = task => {
  switch (task.type) {
    case 'text': {
      const notification = new Notification({
        title: `Add Task "${task.payload}"`
      });
      notification.show();
      break;
    }
    case 'image': {
      const notification = new Notification({
        title: 'Add Task',
        icon: nativeImage.createFromDataURL(task.payload)
      });

      notification.show();
      break;
    }
    default: {
      const notification = new Notification({title: 'added unknown task type'});
      notification.show();
      break;
    }
  }
};


// business use-cases
const addTask = task => {
  const tasks = [...(appState.tasks || [])];
  tasks.push(task);
  setState({tasks});

  taskNotification(task);
};

const setWindowState = (id, windowState) => {
  const windowStates = {...(appState.windowStates || {})};
  windowStates[id] = windowState;
  setState({windowStates});
};

const createCreateTaskWindow = () => {
  createWindow({type: 'create-task'});
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
      logMain({event, arg});
      console.warn('wot?');
    }
  }
});




// log channel, for React components logging in main thread
ipcMain.on('log', (event, arg) => {
  logRenderer(arg);
});

