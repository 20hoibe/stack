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


let screenshotWindow;

const createWindow = (param, {width, height}) => {
  const window = new BrowserWindow({width, height, show: false});
  window.loadURL(isDev ? `http://localhost:3000` : `file://${__dirname}/../build/index.html`);

  // postpone show window, until loaded
  window.webContents.once('dom-ready', () => {
    window.show();
    window.focus();
  });

  const {id} = window;
  setWindowState(id, param);
  return window;
};


const createCreateTaskWindow = () => {
  createWindow({type: 'create-task'}, {width: 480, height: 120});
};

let listWindow;
const toggleListTaskWindow = () => {
  if (!listWindow || listWindow.isDestroyed()) {
    listWindow = createWindow({type: 'list-task'}, {width: 640, height: 1024});
  } else {
    listWindow.close();
  }
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
};

let tray;
app.on('ready', () => {
  
  tray = new Tray(__dirname + '/assets/tray.png');
  const menu = Menu.buildFromTemplate([
    {label: `Create Task\t${process.platform !== 'darwin' ? 'Ctrl' : 'Cmd'}+Shift+J`, type: 'normal', click: () => {
      createCreateTaskWindow();
    }},
    {label: 'Show List', type: 'normal', click: () => {
      toggleListTaskWindow();
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

  globalShortcut.register('CommandOrControl+Shift+L', () => {
    toggleListTaskWindow();
  });

  globalShortcut.register('CommandOrControl+Shift+U', () => {
    popTask();
  });
});

app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('activate', () => {
  if (window === null) {
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
  tasks.unshift(task);
  setState({tasks});

  taskNotification({description: 'Add Task', task});
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
      title: 'Cannot pop task from emtpy task list'
    });

    notification.show();
    return;
  }

  const tasks = [...(appState.tasks || [])];
  const oldTask = tasks.pop();
  
  setState({tasks});

  taskNotification({description: 'Pop Task', task: oldTask});
};

const setWindowState = (id, windowState) => {
  const windowStates = {...(appState.windowStates || {})};
  windowStates[id] = windowState;
  setState({windowStates});
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
    case 'delete': {
      deleteTask(arg.index);
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

