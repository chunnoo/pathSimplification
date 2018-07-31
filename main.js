canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx = canvas.getContext("2d");

let mainPath = [];
let mainPathLength = 256;
let simplificationStength = 0;

let smoothedPath = [];
let spimplifiedPath = [];

function clamp(x, a, b) {
  return Math.min(a, Math.max(x, b));
}

function reflectionClamp(x, a, b) {
  if (x > b) {
    return reflectionClamp(2*b - x, a, b);
  } else if (x < a) {
    return reflectionClamp(2*a - x, a, b);
  } else {
    return x;
  }
}

function vec2(x, y) {
  this.x = x;
  this.y = y;
}

vec2.prototype = {
  length: function() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  },
  normalize: function() {
    let len = this.length();
    this.x = this.x/len;
    this.y = this.y/ len;
  },
  normal: function() {
    return new vec2(-this.y, this.x);
  },
  dot: function(v) {
    return this.x*v.x + this.y*v.y;
  },
  to: function(v) {
    return new vec2(v.x - this.x, v.y - this.y);  
  },
  add: function(v) {
    this.x += v.x;
    this.y += v.y;
  }
}

function genRandomPath(width, height, length, strength) {
  let path = [];
  path[0] = new vec2(0, height*Math.random());
  for (let i = 1; i < length; i++) {
    let x = width * i / length;
    let y = reflectionClamp(path[i-1].y + height*strength*(Math.random() - 0.5), 0, height);
    path.push(new vec2(x,y)); 
  }
  return path;
}

function smoothPath(path, strength) {
  let newPath = [];
  for (let i = 0; i < path.length; i++) {
    let sum = new vec2(0,0);
    let num = 0;
    for (let j = Math.max(0, i - strength); j < Math.min(i + strength + 1, path.length); j++) {
      sum.add(path[j]);
      num++;
    }
    newPath.push(new vec2(path[i].x, sum.y/num));
  }
  return newPath;
}

function ramerDouglas(path, tresh) {
  let elements = [];
  elements.push(0);
  let vecTo = path[0].to(path[path.length - 1]);
  vecTo.normalize();
  let dir = vecTo.normal();
  let maxElement = -1;
  let maxDist = tresh;
  for (let i = 1; i < path.length - 1; i++) {
    let currDist = Math.abs(dir.dot(path[0].to(path[i])));
    if (currDist > maxDist) {
      maxDist = currDist;
      maxElement = i;
    }
  }
  if (maxElement != -1) { 
    elements.push.apply(elements, ramerDouglasStep(path, 0, maxElement, tresh));
    elements.push(maxElement);
    elements.push.apply(elements, ramerDouglasStep(path, maxElement, path.length - 1, tresh));
  }
  elements.push(path.length - 1);
  let ret = [];
  for (let i = 0; i < elements.length; i++) {
    ret.push(path[elements[i]]);
  }
  return ret;
}

function ramerDouglasStep(path, begin, end, tresh) {
  let elements = [];
  let vecTo = path[begin].to(path[end]);
  vecTo.normalize();
  let dir = vecTo.normal();
  let maxElement = -1;
  let maxDist = tresh;
  for (let i = begin + 1; i < end; i++) {
    let currDist = Math.abs(dir.dot(path[begin].to(path[i])));
    if (currDist > maxDist) {
      maxDist = currDist;
      maxElement = i;
    }
  }
  if (maxElement != -1) { 
    elements.push.apply(elements, ramerDouglasStep(path, begin, maxElement, tresh));
    elements.push(maxElement);
    elements.push.apply(elements, ramerDouglasStep(path, maxElement, end, tresh));
  }
  return elements;
}

function drawPath(path, color, padding) {
  let drawSize = 1 - padding*2;

  ctx.beginPath();
  ctx.moveTo(canvas.width*padding + path[0].x*canvas.width*drawSize, canvas.height*padding + path[0].y*canvas.height*drawSize);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(canvas.width*padding + path[i].x*canvas.width*drawSize, canvas.height*padding + path[i].y*canvas.height*drawSize);
  }
  ctx.strokeStyle = color;
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = "#222"; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  drawPath(mainPath, "#444", 0.125);
  drawPath(smoothedPath, "#888", 0.125);
  drawPath(simplifiedPath, "#fff", 0.125);

}

function init() {
  mainPath = genRandomPath(1.0, 1.0, 256, 0.1);
  smoothedPath = smoothPath(mainPath, 1);
  simplifiedPath = ramerDouglas(smoothedPath, 0.0); 

  draw();
}

function updateSmoothAndSimplification(e) {
  mouse = new vec2(e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top);
  
  smoothedPath = smoothPath(mainPath, Math.round(16*mouse.y/canvas.height));
  simplifiedPath = ramerDouglas(smoothedPath, Math.pow(mouse.x/canvas.width, 4));

  draw();  
}

function updatePath(e) {
  mainPath = genRandomPath(1.0, 1.0, 256, 0.1);
  updateSmoothAndSimplification(e); 
}

canvas.onmousemove = updateSmoothAndSimplification;
canvas.onclick = updatePath;

init();
