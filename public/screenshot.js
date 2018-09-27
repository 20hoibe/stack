const {
  ipcRenderer,
  desktopCapturer,
  remote,
  screen
} = window.require('electron');


let mouseDown = false;
let startPoint = {
  x: 0,
  y: 0
};
let endPoint = {
  x: 0,
  y: 0
};

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const cls = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

const getDisplay = (currentLocation) => {
  const display = screen.getDisplayNearestPoint(currentLocation);
  return display;
};

const getDesktopStream = (desktop) => {
  return new Promise((resolve, reject) => {
    desktopCapturer.getSources({
      types: ['screen']
    }, (error, sources) => {
      if (error) {
        reject(error);
        return;
      }

      let screenId;
      for (let i = 0; i < sources.length; ++i) {
        if (sources[i].id === (`screen:${desktop.id}`)) {
          screenId = sources[i].id;
          break;
        }
      }
      if (!screenId) {
        reject('Unable to determine screen');
      }
      navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: screenId
            }
          }
        })
        .then(stream => resolve(stream))
        .catch(() => reject("Unable to get stream"));
    });
  });
}

const toVideo = (stream) => {
  const videoElement = document.createElement("video");
  videoElement.autoplay = true;
  videoElement.srcObject = stream;
  return new Promise(resolve => {
    videoElement.addEventListener('playing', () => {
      resolve(videoElement);
    })
  })
}

const takeScreenShot = (
  x,
  y,
  width,
  height
) => {
  const desktop = getDisplay({
      x: x,
      y: y
  });
  return getDesktopStream(desktop)
    .then(stream => toVideo(stream))
    .then(video => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, x - desktop.bounds.x, y - desktop.bounds.y, width, height, 0, 0, width, height);
      return canvas.toDataURL();
    });
}

window.onload = event => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
}

canvas.onmousedown = event => {
  mouseDown = true;
  startPoint.x = event.pageX + window.screenX;
  startPoint.y = event.pageY + window.screenY;
  canvas.style.cursor = "crosshair";
};

canvas.onmouseup = event => {
  if (mouseDown) {
    mouseDown = false;
    endPoint.x = event.pageX + window.screenX;
    endPoint.y = event.pageY + window.screenY;

    const roi = {
      x: (endPoint.x < startPoint.x) ? endPoint.x: startPoint.x,
      y: (endPoint.y < startPoint.y) ? endPoint.y : startPoint.y,
      width: captureWidth = Math.abs(endPoint.x - startPoint.x),
      height: captureHeight = Math.abs(endPoint.y - startPoint.y)
    };

    cls();

    takeScreenShot(roi.x, roi.y, roi.width, roi.height)
      .then(scrot => ipcRenderer.send('image', scrot));
  }
}

canvas.onmousemove = event => {
  if (mouseDown) {
    const relativeStart = {
      x: startPoint.x - window.screenX,
      y: startPoint.y - window.screenY
    };
    cls();
    ctx.fillRect(
      relativeStart.x,
      relativeStart.y,
      event.pageX - relativeStart.x,
      event.pageY - relativeStart.y
    );
  }
}
