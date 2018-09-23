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

const getDisplayBounds = (currentLocation) => {
  const display = screen.getDisplayNearestPoint(currentLocation);
  return display.bounds;
};

const getDesktopStream = (currentLocation) => {
  return new Promise((resolve, reject) => {
    const desktopBounds = getDisplayBounds(currentLocation);
    desktopCapturer.getSources({
      types: ['screen']
    }, (error, sources) => {
      if (error) {
        reject(error);
        return;
      }

      let screenId;
      for (let i = 0; i < sources.length; ++i) {
        if (sources[i].id.startsWith('screen')) {
          screenId = sources[i].id;
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
              chromeMediaSourceId: screenId,
              maxWidth: desktopBounds.width,
              maxHeight: desktopBounds.height,
              minWidth: desktopBounds.width,
              minHeight: desktopBounds.height
            }
          }
        })
        .then(stream => resolve(stream))
        .catch(stream => reject(stream));;
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
  return getDesktopStream({
      x: x,
      y: y
    })
    .then(stream => toVideo(stream))
    .then(video => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, x, y, width, height, 0, 0, width, height);
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
  startPoint.x = event.pageX;
  startPoint.y = event.pageY;
  canvas.style.cursor = "crosshair";
};

canvas.onmouseup = event => {
  if (mouseDown) {
    mouseDown = false;
    endPoint.x = event.pageX;
    endPoint.y = event.pageY;

    const roi = {
      x: (event.pageX < startPoint.x) ? event.pageX : startPoint.x,
      y: (event.pageY < startPoint.y) ? event.pageY : startPoint.y,
      width: captureWidth = Math.abs(event.pageX - startPoint.x),
      height: captureHeight = Math.abs(event.pageY - startPoint.y)
    };

    takeScreenShot(roi.x, roi.y, roi.width, roi.height)
      .then(scrot => ipcRenderer.send('image', scrot));
  }
}

canvas.onmousemove = event => {
  if (mouseDown) {
    cls();
    ctx.fillRect(
      startPoint.x,
      startPoint.y,
      event.pageX - startPoint.x,
      event.pageY - startPoint.y
    );
  }
}
