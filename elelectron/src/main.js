import { app, BrowserWindow, clipboard, ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const BACKEND_REQUEST_TIMEOUT_MS = 10_000;
const pendingBackendRequests = new Map();
let backendProcess = null;

const rejectBackendRequest = (elecID, error) => {
  const pendingRequest = pendingBackendRequests.get(elecID);
  if (!pendingRequest) return;

  clearTimeout(pendingRequest.timeout);
  pendingBackendRequests.delete(elecID);
  pendingRequest.reject(error);
};

const rejectAllBackendRequests = (error) => {
  for (const elecID of pendingBackendRequests.keys()) {
    rejectBackendRequest(elecID, error);
  }
};

const getDummyBackendPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend', 'dummy_main.py');
  }

  return path.resolve(app.getAppPath(), '..', 'backend', 'dummy_main.py');
};

const startBackend = () => {
  if (backendProcess) return;

  const backendPath = getDummyBackendPath();
  const pythonCommand = process.env.PIXELPASS_PYTHON
    || (process.platform === 'win32' ? 'python' : 'python3');
  const child = spawn(pythonCommand, ['-u', backendPath], {
    cwd: path.dirname(backendPath),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  backendProcess = child;

  const outputLines = createInterface({ input: child.stdout });
  outputLines.on('line', (line) => {
    let response;

    try {
      response = JSON.parse(line);
    } catch {
      console.error('Python backend wrote invalid JSON to stdout.');
      rejectAllBackendRequests(new Error('Python backend returned invalid JSON.'));
      return;
    }

    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      console.error('Python backend response was not a JSON object.');
      rejectAllBackendRequests(new Error('Python backend returned an invalid response.'));
      return;
    }

    const pendingRequest = pendingBackendRequests.get(response.elecID);
    if (!pendingRequest) {
      console.error('Python backend returned an unknown elecID.');
      return;
    }

    clearTimeout(pendingRequest.timeout);
    pendingBackendRequests.delete(response.elecID);
    pendingRequest.resolve(response);
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (message) => {
    console.error(`[Python backend] ${message.trimEnd()}`);
  });

  child.on('error', (error) => {
    console.error('Could not start the Python backend:', error);
    rejectAllBackendRequests(error);
  });

  child.on('close', (code) => {
    outputLines.close();
    if (backendProcess === child) backendProcess = null;
    rejectAllBackendRequests(
      new Error(`Python backend stopped unexpectedly with exit code ${code}.`),
    );
  });
};

const stopBackend = () => {
  const child = backendProcess;
  backendProcess = null;

  if (child && !child.killed) child.kill();
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

ipcMain.handle('clipboard:write', (_event, text) => {
  clipboard.writeText(String(text));
  return true;
});

ipcMain.handle('python:request', (_event, request) => {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new TypeError('Python backend request must be an object.');
  }

  const child = backendProcess;
  if (!child || child.killed || !child.stdin.writable) {
    throw new Error('Python backend is not running.');
  }

  const elecID = randomUUID();
  const protocolRequest = { ...request, elecID };
  const protocolLine = `${JSON.stringify(protocolRequest)}\n`;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      rejectBackendRequest(
        elecID,
        new Error(`Python backend request ${elecID} timed out.`),
      );
    }, BACKEND_REQUEST_TIMEOUT_MS);

    pendingBackendRequests.set(elecID, { reject, resolve, timeout });

    child.stdin.write(protocolLine, 'utf8', (error) => {
      if (error) rejectBackendRequest(elecID, error);
    });
  });
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  startBackend();
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  stopBackend();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
