const {
  ipcRenderer,
  desktopCapturer,
  remote
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

    const captureX = (event.pageX < startPoint.x) ? event.pageX : startPoint.x;
    const captureY = (event.pageY < startPoint.y) ? event.pageY : startPoint.y;
    const captureWidth = Math.abs(event.pageX - startPoint.x);
    const captureHeight = Math.abs(event.pageY - startPoint.y);

    desktopCapturer.getSources({
      types: ['screen']
    }, (error, sources) => {
      if (error) throw error
      for (let i = 0; i < sources.length; ++i) {
        if (sources[i].id.startsWith('screen')) {
          let thumbnail = sources[i].thumbnail;
          const rect = {
            x: captureX + window.screenLeft,
            y: captureY + window.screenTop,
            width: captureWidth,
            height: captureHeight
          };
          ipcRenderer.send('log', rect);
          const result = thumbnail.crop(rect);
          ipcRenderer.send('log', thumbnail.getSize());
          ipcRenderer.send('image', thumbnail.toDataURL());
        }
      }
    })
    // setTimeout(() => {
    //   canvas.style.cursor = "default";
    // }, 300);
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
