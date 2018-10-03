const {ipcRenderer, screen} = window.require('electron');

let mouseDown = false;
const startPoint = {x: 0, y: 0};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const clearCanvas = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

/**
 * `navigator.mediaDevices.getUserMedia` promisified
 */
const getDesktopStream = async () => {

  let mediaStream;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'screen'
        }
      }
    });
  } catch (e) {
    throw new Error('Unable to get screen stream');
  }

  return mediaStream;
};

/**
 * Virtual screen boundary including all displays.
 */
const getVirtualScreenBound = () => {
  let minX = 0, minY = 0, maxX = 0, maxY = 0;

  for (const display of screen.getAllDisplays()) {
    maxX = Math.max(maxX, display.bounds.x + display.bounds.width);
    maxY = Math.max(maxY, display.bounds.y + display.bounds.height);
    minX = Math.min(minX, display.bounds.x);
    minY = Math.min(minY, display.bounds.y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Takes a screenshot with all params being screen coords, returning a image/png data URL string.
 */
const takeScreenshot = async ({x, y, width, height}) => {
  canvas.style.cursor = 'none';
  clearCanvas();

  // Linux/Ubuntu: still got red rectangle in screenshot: longer short wait
  // what didn't work: 50ms, 200ms, 400ms
  await new Promise(resolve => setTimeout(resolve, 800));

  const stream = await getDesktopStream();

  const videoElem = document.createElement('video');
  videoElem.autoplay = true;
  videoElem.srcObject = stream;

  await new Promise((resolve) => {
    videoElem.addEventListener('loadedmetadata', () => {
      resolve();
    });
  });

  const virtualScreenBound = getVirtualScreenBound();
  const videoPixelsPerScreenPixelX = videoElem.videoWidth / virtualScreenBound.width;
  const videoPixelsPerScreenPixelY = videoElem.videoHeight / virtualScreenBound.height;

  const canvasElem = document.createElement('canvas');
  canvasElem.width = width;
  canvasElem.height = height;

  // x or y can be negative (e.g. darwin external display left to primary display)
  const srcX = (x - virtualScreenBound.x) * videoPixelsPerScreenPixelX;
  const srcY = (y - virtualScreenBound.y) * videoPixelsPerScreenPixelY;
  const srcW = width * videoPixelsPerScreenPixelX;
  const srcH = height * videoPixelsPerScreenPixelY;

  const videoCanvasCtx = canvasElem.getContext('2d');
  videoCanvasCtx.drawImage(videoElem, srcX, srcY, srcW, srcH, 0, 0, width, height);

  return canvasElem.toDataURL('image/png');
};

const onWindowLoad = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cursor = 'crosshair';

  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
};

/**
 * @param {MouseEvent} event 
 */
const onMouseDown = event => {
  mouseDown = true;
  startPoint.x = event.screenX;
  startPoint.y = event.screenY;
};

/**
 * @param {MouseEvent} event 
 */
const onMouseUp = async event => {
  if (!mouseDown) {
    return;
  }

  mouseDown = false;

  const dataURL = await takeScreenshot({
    x: Math.min(event.screenX, startPoint.x),
    y: Math.min(event.screenY, startPoint.y),
    width: Math.abs(event.screenX - startPoint.x),
    height: Math.abs(event.screenY - startPoint.y)
  });

  ipcRenderer.send('task', {
    type: 'add',
    task: {
      type: 'image',
      payload: dataURL
    }
  });

  ipcRenderer.send('command', 'close-screenshot-windows');
};

/**
 * @param {MouseEvent} event 
 */
const onMouseMove = event => {
  if (!mouseDown) {
    return;
  }

  clearCanvas();

  const x = startPoint.x - window.screenX;
  const y = startPoint.y - window.screenY;
  const width = event.screenX - startPoint.x;
  const height = event.screenY - startPoint.y;

  ctx.fillRect(x, y, width, height);
};

/**
 * @param {KeyboardEvent} event 
 */
const onKeyUp = event => {
  if (event.code === 'Escape') {
    ipcRenderer.send('command', 'close-screenshot-windows');
  }
};


window.addEventListener('load', onWindowLoad);
window.addEventListener('keyup', onKeyUp);
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp);
canvas.addEventListener('mousemove', onMouseMove);
