const {
  ipcRenderer,
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

    setTimeout(() => {
      canvas.style.cursor = "default";
      ipcRenderer.sendSync('image', "new screenshot");
    }, 300);
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
