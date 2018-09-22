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
      types: ['window', 'screen'],
      thumbnailSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }, (error, sources) => {
      if (error) throw error
      console.log(sources);
      for (let i = 0; i < sources.length; ++i) {
        console.log(sources[i]);
        if (sources[i].id.startsWith('screen')) {
          let thumbnail = sources[i].thumbnail;
          console.log(thumbnail);
          thumbnail.crop({
            x: captureX,
            y: captureY,
            width: captureWidth,
            height: captureHeight
          });
          console.log(thumbnail);
          ipcRenderer.send('screenshot', thumbnail.toDataURL());
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
