//svg ********************************************************************
var myShadowBackground = document.querySelector("#my-shadow-background");
var svgCanvas = document.querySelector("svg");
var svgNS = "http://www.w3.org/2000/svg";
var bodyWidth  = document.body.clientWidth;
var bodyHeight = document.body.clientHeight;
var rectangles = [];


var onresize = function() {
  //resize default svg
  svgCanvas.setAttribute("width", bodyWidth);
  svgCanvas.setAttribute("height", bodyHeight);
  svgCanvas.setAttribute("viewBox", "0 0 " + bodyWidth + " " + bodyHeight);
  
  let d = myShadowBackground.getAttribute("d");
  let pathArray = d.split("\n");
  let newbgArea = `M0 0 h${bodyWidth} v${bodyHeight} h-${bodyWidth} Z`;

  pathArray[0] = newbgArea;
  d = pathArray.join("\n");
  myShadowBackground.setAttribute("d", d);
}

//if the screen size is resized, the size of the rectangles in the svg changes.
window.addEventListener("resize", onresize);

// Run function on load, could also run on dom ready
// We will adjust the size of the rectangels in the svg.
window.onload = function() {
  onresize();
}

function Rectangle(x, y, w, h, svgCanvas) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.stroke = 5;
  this.el = document.createElementNS(svgNS, "rect");
  this.el.setAttribute("data-index", rectangles.length);
  this.el.setAttribute("id", "rect-id-" + rectangles.length);
  this.el.setAttribute("class", "edit-rectangle highlight");
  rectangles.push(this);
  
  svgCanvas.appendChild(this.el);
}

Rectangle.prototype.draw = function() {
  this.el.setAttribute("x", this.x + this.stroke / 2);
  this.el.setAttribute("y", this.y + this.stroke / 2);
  this.el.setAttribute("width", this.w - this.stroke);
  this.el.setAttribute("height", Math.abs( this.h - this.stroke) );
  this.el.setAttribute("stroke-width", this.stroke);
  updateSvgBgPath(this.el);
};

//************************* draw *************************

function endMoving(event) {
  rect = rectangles[rectangles.length-1];
  let delButton = createDelButton(rect, rectangles.length-1);
  document.querySelector(`.my-ss-container`).appendChild(delButton);
}

const interactSvgCanvas = interact('.my-ss-container');

interactSvgCanvas.draggable({
  onstart: function (event) {
    new Rectangle(event.pageX, event.pageY, 50, 50, svgCanvas);
  },
  onmove : targetMoving,
  onend  : endMoving,
})

function targetMoving (event) {
 var rectangle = rectangles[rectangles.length-1];

 if(event.rect.left <= 0 && event.rect.top > 0) {
   //console.log("coordinate left down");
   let horizontalLength = rectangle.w + (rectangle.x - event.pageX);// event.rect.left - rectangle.x;
   rectangle.x = event.pageX < rectangle.stroke ? rectangle.stroke : event.pageX;
   rectangle.w = horizontalLength < rectangle.stroke ? rectangle.stroke : horizontalLength;

   //rectangle.y =  event.pageY < 5 ? 5 : event.pageY;
   rectangle.h = event.pageY < rectangle.stroke ? rectangle.stroke : event.pageY- rectangle.y;
 }
 else if(event.rect.left <= 0 && event.rect.top <= 0) {
   //console.log("coordinate left up");

   let horizontalLength = rectangle.w + (rectangle.x - event.pageX);// event.rect.left - rectangle.x;
   rectangle.x = event.pageX < rectangle.stroke ? rectangle.stroke : event.pageX;
   rectangle.w = horizontalLength < rectangle.stroke ? rectangle.stroke : horizontalLength;

   let verticalLength = rectangle.h + (rectangle.y - event.pageY);
   rectangle.y = event.pageY < rectangle.stroke ? rectangle.stroke : event.pageY;
   rectangle.h = verticalLength < rectangle.stroke ? rectangle.stroke : verticalLength;
   
 }else if(event.rect.left > 0 && event.rect.top > 0) {
   //console.log("coordinate right down");
   rectangle.w = (event.pageX - rectangle.x) < rectangle.stroke ? rectangle.stroke * 2 : (event.pageX - rectangle.x);
   rectangle.h = (event.pageY - rectangle.y) < rectangle.stroke ? rectangle.stroke * 2 : (event.pageY - rectangle.y);
 }else {
   //console.log("coordinate right up");
   let verticalLength = rectangle.h + (rectangle.y - event.pageY);
   rectangle.y = event.pageY < rectangle.stroke ? rectangle.stroke : event.pageY;
   rectangle.h = verticalLength < rectangle.stroke ? rectangle.stroke : verticalLength;

   rectangle.w = (event.pageX - rectangle.x) < rectangle.stroke ? rectangle.stroke : (event.pageX - rectangle.x);
 }
 rectangle.draw();
}


// ****** resize and drag process******************************************
interact(".edit-rectangle")
  .rectChecker(function(element) {
    // find the Rectangle object that the element belongs to
    var rectangle = rectangles[element.getAttribute("data-index")];
    // return a suitable object for interact.js
    return {
      left: rectangle.x,
      top: rectangle.y,
      right: rectangle.x + rectangle.w,
      bottom: rectangle.y + rectangle.h
    };
  })
  .draggable({
    max: Infinity,
    inertia: true,
    listeners: {
      move(event) {
        var rectangle = rectangles[event.target.getAttribute("data-index")];
        rectangle.x = event.rect.left;
        rectangle.y = event.rect.top;
        setRectDelButtonPossition(rectangle, event.target.getAttribute("data-index"));
        rectangle.draw();
      }
    },
    modifiers: [
      interact.modifiers.restrictRect({
        // restrict to a parent element that matches this CSS selector
        restriction: "svg",
        // only restrict before ending the drag
        endOnly: true
      })
    ]
  })
  .resizable({
    edges: { left: true, top: true, right: true, bottom: true },
    listeners: {
      move(event) {
        let rectangle = rectangles[event.target.getAttribute("data-index")];
        rectangle.w = event.rect.width;
        rectangle.h = event.rect.height;
        rectangle.x = event.rect.left;
        rectangle.y = event.rect.top;
        setRectDelButtonPossition(rectangle, event.target.getAttribute("data-index"));
        rectangle.draw();
      }
    },
    modifiers: [
      interact.modifiers.restrictEdges({ outer: "svg", endOnly: true }),
      interact.modifiers.restrictSize({ min: { width: 20, height: 20 } })
    ]
  });

interact.maxInteractions(Infinity);

function updateSvgBgPath(rect) {
  let dataIndex   = rect.getAttribute("data-index");
  let d           = myShadowBackground.getAttribute("d");
  let newRectPath = `M${rect.getAttribute("x")} ${rect.getAttribute("y")} h${rect.getAttribute("width")} v${rect.getAttribute("height")} h-${rect.getAttribute("width")} Z`;
  let newD        = setPathWithIndex(d, dataIndex, newRectPath);

  myShadowBackground.setAttribute("d", newD);
}

function setPathWithIndex(d, index, newPath) {
    let pathArray = d.split("\n");
    pathArray[parseInt(index)+1] = newPath;
    return pathArray.join("\n");
}

function removePathWithIndex(d, index) {
  let pathArray = d.split("\n");
  pathArray.splice(parseInt(index)+1, 1);
  
  return pathArray.join("\n");
}

function createDelButton(rect, index) {
  let delButton = document.createElement("button");
  delButton.setAttribute("class", "del-select del-icon del-button");
  delButton.setAttribute("id", `del-button-${index}`);
  delButton.setAttribute("x", rect.x + rect.w);
  delButton.setAttribute("y", rect.y);
  delButton.setAttribute("rect-id", index);
  delButton.onclick = deleteRect;
  if(rect.x + rect.w + rect.stroke * 5 >= svgCanvas.width.baseVal["valueInSpecifiedUnits"]) {
    delButton.style.left = parseFloat(rect.x - rect.stroke * 4).toString() + "px";
    delButton.style.top  = parseFloat(rect.y).toString() + "px"; 
  }else {
    delButton.style.left = parseFloat(rect.x + rect.w).toString() + "px";
    delButton.style.top  = parseFloat(rect.y).toString() + "px"; 
  }

  return delButton;
}

function setRectDelButtonPossition(rectangle, index) {
  delButton = document.getElementById(`del-button-${(parseInt(index) )}`);

  if(rectangle.x + rectangle.w + rectangle.stroke * 5 >= svgCanvas.width.baseVal["valueInSpecifiedUnits"]){
    delButton.style.left = parseFloat(rectangle.x - rectangle.stroke * 4).toString() + "px";
    delButton.style.top  = parseFloat(rectangle.y).toString() + "px"; 
  }else {
    delButton.style.left = parseFloat(rectangle.x + rectangle.w).toString() + "px";
    delButton.style.top  = parseFloat(rectangle.y).toString() + "px"; 
  }
}

function deleteRect() {
  let deletedButtonIndex = parseInt(this.getAttribute("rect-id"));
  let d       = myShadowBackground.getAttribute("d");
  let editedD = removePathWithIndex(d, this.getAttribute("rect-id"));
  myShadowBackground.setAttribute("d", editedD);
  
  rectangles.splice(this.getAttribute("rect-id"), 1);

  document.getElementById(`rect-id-${deletedButtonIndex}`).remove();

  this.remove();
  
  document.querySelectorAll("rect").forEach(function(rect, index) {
    let rectIndex = rect.getAttribute("data-index");
    if( rectIndex > deletedButtonIndex ) {
      rect.setAttribute("data-index", (parseInt(rectIndex) - 1).toString());
      rect.setAttribute("id", ("rect-id-"+  parseInt(rectIndex)));
      let delButton = document.getElementById(`del-button-${parseInt(rectIndex)+1}`);
      delButton.setAttribute("rect-id", parseInt(rectIndex));
      delButton.setAttribute("id", `del-button-${parseInt(rectIndex)}`);
    }
  })
}