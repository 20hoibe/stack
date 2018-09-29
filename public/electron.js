const fs = require('fs');
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
  if (listWindow && !listWindow.isDestroyed()) {
    listWindow.close();
    listWindow = null;
    return;
  }

  listWindow = createWindow({type: 'list-task'}, {width: 640, height: 640});
};

let screenshotWindows = undefined;

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
      height: display.bounds.height
    });

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
    return
  }

  taskNotification({description: 'Currently working on', task: appState.tasks[0]});
};

let tray;
app.on('ready', () => {

  screen = require('electron').screen;

  tray = new Tray(__dirname + '/assets/tray.png');
  const menu = Menu.buildFromTemplate([
    {label: `Create Task\t\t\t${!isMac ? 'Ctrl' : 'Cmd'}+Shift+J`, type: 'normal', click: () => {
      createCreateTaskWindow();
    }},
    {label: `Make Screenshot\t\t${!isMac ? 'Ctrl' : 'Cmd'}+Shift+K`, type: 'normal', click: () => {
      toggleScreenshot();
    }},
    {label: `Show Current Task\t${!isMac ? 'Ctrl' : 'Cmd'}+Shift+I`, type: 'normal', click: () => {
      notifyCurrentTask();
    }},
    {label: `Show List\t\t\t\t${!isMac ? 'Ctrl' : 'Cmd'}+Shift+L`, type: 'normal', click: () => {
      toggleListTaskWindow();
    }},
    {label: `Pop Task\t\t\t\t${!isMac ? 'Ctrl' : 'Cmd'}+Shift+U`, type: 'normal', click: () => {
      popTask();
    }},
    {label: `Postpone Task\t\t\t\t${!isMac ? 'Ctrl' : 'Cmd'}+Shift+P`, type: 'normal', click: () => {
      postponeTask();
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
    toggleScreenshot();
  });

  globalShortcut.register('CommandOrControl+Shift+L', () => {
    toggleListTaskWindow();
  });

  globalShortcut.register('CommandOrControl+Shift+U', () => {
    popTask();
  });

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    notifyCurrentTask();
  });

  globalShortcut.register('CommandOrControl+Shift+P', () => {
    postponeTask();
  })
});

// don't remove listener to prevent app quit
app.on('window-all-closed', () => {});

app.on('activate', () => {});

const windows = new Set();

app.on('browser-window-created', (event, window) => {
  windows.add(window);

  window.once('close', () => {
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

  let tasks = [...(appState.tasks || [])]
  tasks.push(tasks.shift());
  setState({tasks});
  notifyCurrentTask();
}

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
      console.warn('wot?');
    }
  }
});




// log channel, for React components logging in main thread
ipcMain.on('log', (event, arg) => {
  logRenderer(arg);
});

