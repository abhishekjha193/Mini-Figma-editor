const canvas = document.getElementById("designCanvas");
const rectBtn = document.getElementById("addRect");
const textBtn = document.getElementById("addText");
const layerList = document.getElementById("layerList");
const moveUpBtn = document.getElementById("moveLayerUp");
const moveDownBtn = document.getElementById("moveLayerDown");
const propWidth = document.getElementById("propWidth");
const propHeight = document.getElementById("propHeight");
const propBg = document.getElementById("propBg");
const propText = document.getElementById("propText");
const textBoxWrapper = document.getElementById("textBoxWrapper");

let layers = [];

let isDragging = false;
let startMouseX = 0;
let startMouseY = 0;
let startElX = 0;
let startElY = 0;
let isResizing = false;
let startWidth = 0;
let startHeight = 0;
let isRotating = false;
let centerX = 0;
let centerY = 0;
let startAngle = 0;
let startRotation = 0;
let selectedElement = null;
let currentResizeCorner = null;

//1. Element Creation
//rectangle ka click event
rectBtn.addEventListener("click", function () {
  createElement("rect");
});

//text ka click event
textBtn.addEventListener("click", function () {
  createElement("text");
});

//function to create text and reactangle
function createElement(type) {
  const el = document.createElement("div");

  el.style.position = "absolute";
  el.addEventListener("click", function (e) {
    e.stopPropagation();
    selectElement(el);
  });
  el.addEventListener("mousedown", function (e) {
    e.stopPropagation();
    selectElement(el);
    isDragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startElX = el.offsetLeft;
    startElY = el.offsetTop;
    updatePropertiesPanel(el);
    renderLayers();
  });

  const x = Math.floor(Math.random() * 750);
  const y = Math.floor(Math.random() * 460);

  el.style.left = x + "px";
  el.style.top = y + "px";

  if (type === "rect") {
    el.style.width = "200px";
    el.style.height = "100px";
    el.style.background = "green";
  }

  if (type === "text") {
    el.style.width = "200px";
    el.style.height = "100px";
    el.style.border = "1px dashed gray";
    el.style.color = "black";
    el.innerText = "Text";

    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
  }

  canvas.appendChild(el);

  layers.push(el);
  renderLayers();
  updateZIndex();
  attachElementEvents(el);
}

//2. Single Element Selection
//select-element
function selectElement(el) {
  if (selectedElement) {
    selectedElement.classList.remove("selected");
    removeResizeHandle(selectedElement);
    removeRotateHandle(selectedElement);
  }

  selectedElement = el;

  // base class (never remove)
  el.classList.add("design-element");

  // selection state
  el.classList.add("selected");

  addResizeHandle(el);
  addRotateHandle(el);

  updatePropertiesPanel(el);
  renderLayers();
}

//outer canvas ka remove selection
canvas.addEventListener("click", function () {
  if (!selectedElement) return;

  selectedElement.classList.remove("selected");
  removeResizeHandle(selectedElement);
  removeRotateHandle(selectedElement);

  selectedElement = null;
  updatePropertiesPanel(null);
  renderLayers();
});

//3.Dragging, Resizing, and Rotation
//mousemove ka event
document.addEventListener("mousemove", function (e) {
  if (!selectedElement) return;

  if (isDragging) {
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;

    let newX = startElX + dx;
    let newY = startElY + dy;

    // boundary check
    const maxX = canvas.clientWidth - selectedElement.offsetWidth;
    const maxY = canvas.clientHeight - selectedElement.offsetHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    selectedElement.style.left = newX + "px";
    selectedElement.style.top = newY + "px";
  }

  if (isResizing) {
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newX = startElX;
    let newY = startElY;

    switch (currentResizeCorner) {
      case "top-left":
        newWidth = startWidth - dx;
        newHeight = startHeight - dy;
        newX = startElX + dx;
        newY = startElY + dy;
        break;

      case "top-right":
        newWidth = startWidth + dx;
        newHeight = startHeight - dy;
        newY = startElY + dy;
        break;

      case "bottom-right":
        newWidth = startWidth + dx;
        newHeight = startHeight + dy;
        break;

      case "bottom-left":
        newWidth = startWidth - dx;
        newHeight = startHeight + dy;
        newX = startElX + dx;
        break;
    }

    newWidth = Math.max(40, newWidth);
    newHeight = Math.max(30, newHeight);

    if (newX < 0) {
      newWidth += newX;
      newX = 0;
    }
    if (newY < 0) {
      newHeight += newY;
      newY = 0;
    }

    const maxWidth = canvas.clientWidth - newX;
    const maxHeight = canvas.clientHeight - newY;

    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);

    selectedElement.style.width = newWidth + "px";
    selectedElement.style.height = newHeight + "px";
    selectedElement.style.left = newX + "px";
    selectedElement.style.top = newY + "px";
  }

  if (isRotating && selectedElement) {
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

    const delta = angle - startAngle;
    const degrees = (delta * 180) / Math.PI;

    const finalRotation = startRotation + degrees;

    selectedElement.style.transform = `rotate(${finalRotation}deg)`;

    selectedElement.dataset.rotation = finalRotation;
  }
});

//mouseup
document.addEventListener("mouseup", function () {
  isDragging = false;
  isResizing = false;
  isRotating = false;
  saveLayout();
});

//resize function
function addResizeHandle(el) {
  const corners = ["top-left", "top-right", "bottom-right", "bottom-left"];

  corners.forEach((corner) => {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle", corner);

    handle.addEventListener("mousedown", function (e) {
      e.stopPropagation();
      startResize(e, corner);
    });

    el.appendChild(handle);
  });
}

function removeResizeHandle(el) {
  const handles = el.querySelectorAll(".resize-handle");
  handles.forEach((handle) => handle.remove());
}

function startResize(e, corner) {
  isResizing = true;
  currentResizeCorner = corner;

  startMouseX = e.clientX;
  startMouseY = e.clientY;

  startWidth = selectedElement.offsetWidth;
  startHeight = selectedElement.offsetHeight;

  startElX = selectedElement.offsetLeft;
  startElY = selectedElement.offsetTop;
}

//rotation functions
function addRotateHandle(el) {
  const handle = document.createElement("div");
  handle.classList.add("rotate-handle");
  if (el.querySelector(".rotate-handle")) return;
  handle.addEventListener("mousedown", startRotate);

  el.appendChild(handle);
}
function startRotate(e) {
  e.stopPropagation();

  isRotating = true;
  isDragging = false;
  isResizing = false;

  const rect = selectedElement.getBoundingClientRect();

  centerX = rect.left + rect.width / 2;
  centerY = rect.top + rect.height / 2;

  startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

  const currentRotation = selectedElement.dataset.rotation || 0;

  startRotation = Number(currentRotation);
}
function removeRotateHandle(el) {
  const handle = el.querySelector(".rotate-handle");
  if (handle) handle.remove();
}

//4.simple layer panel
//layering section
function renderLayers() {
  layerList.innerHTML = "";

  layers.forEach((el, index) => {
    const li = document.createElement("li");

    li.textContent = el.innerText ? "Text" : "Rectangle";

    li.style.cursor = "pointer";

    if (el === selectedElement) {
    }

    li.addEventListener("click", function (e) {
      e.stopPropagation();
      selectElement(el);
    });

    layerList.appendChild(li);
  });
}

//update z-index
function updateZIndex() {
  layers.forEach((el, index) => {
    el.style.zIndex = index + 1;
  });
}

moveUpBtn.addEventListener("click", function () {
  if (!selectedElement) return;

  const index = layers.indexOf(selectedElement);
  if (index === layers.length - 1) return;

  [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];

  updateZIndex();
  renderLayers();
});

moveDownBtn.addEventListener("click", function () {
  if (!selectedElement) return;

  const index = layers.indexOf(selectedElement);
  if (index === 0) return;

  [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];

  updateZIndex();
  renderLayers();
});

//5. Basic Properties Panel
function updatePropertiesPanel(el) {
  if (!el) {
    propWidth.value = "";
    propHeight.value = "";
    propBg.value = "";
    propText.value = "";
    textBoxWrapper.style.display = "none";
    return;
  }

  propWidth.value = el.offsetWidth;
  propHeight.value = el.offsetHeight;

  const bg = window.getComputedStyle(el).backgroundColor;
  propBg.value = rgbToHex(bg);

  if (el.innerText && el.innerText !== "") {
    textBoxWrapper.style.display = "block";
    propText.value = el.innerText;
  } else {
    textBoxWrapper.style.display = "none";
  }
}

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result) return "#ffffff";

  return (
    "#" +
    result
      .slice(0, 3)
      .map((x) => Number(x).toString(16).padStart(2, "0"))
      .join("")
  );
}

//width
propWidth.addEventListener("input", function () {
  if (!selectedElement) return;

  selectedElement.style.width = propWidth.value + "px";
});

//height
propHeight.addEventListener("input", function () {
  if (!selectedElement) return;

  selectedElement.style.height = propHeight.value + "px";
});

//backgroundcolor
propBg.addEventListener("input", function () {
  if (!selectedElement) return;

  selectedElement.style.backgroundColor = propBg.value;
});

//text
propText.addEventListener("input", function () {
  if (!selectedElement) return;

  selectedElement.innerText = propText.value;
});

//6.keyboard interaction
document.addEventListener("keydown", function (e) {
  if (!selectedElement) return;

  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
    return;
  }

  switch (e.key) {
    case "Delete":
    case "Backspace":
      deleteSelectedElement();
      break;

    case "ArrowUp":
      moveSelectedElement(0, -5);
      break;

    case "ArrowDown":
      moveSelectedElement(0, 5);
      break;

    case "ArrowLeft":
      moveSelectedElement(-5, 0);
      break;

    case "ArrowRight":
      moveSelectedElement(5, 0);
      break;
  }
});

function deleteSelectedElement() {
  if (!selectedElement) return;

  selectedElement.remove();

  layers = layers.filter((el) => el !== selectedElement);

  selectedElement = null;

  renderLayers();
  updatePropertiesPanel(null);
}

function moveSelectedElement(dx, dy) {
  const currentX = selectedElement.offsetLeft;
  const currentY = selectedElement.offsetTop;

  let newX = currentX + dx;
  let newY = currentY + dy;

  const maxX = canvas.clientWidth - selectedElement.offsetWidth;
  const maxY = canvas.clientHeight - selectedElement.offsetHeight;

  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));

  selectedElement.style.left = newX + "px";
  selectedElement.style.top = newY + "px";
}

//7.save and load
function saveLayout() {
  const layout = layers.map((el, index) => ({
    type: el.innerText ? "text" : "rect",
    x: el.offsetLeft,
    y: el.offsetTop,
    width: el.offsetWidth,
    height: el.offsetHeight,
    rotation: Number(el.dataset.rotation || 0),
    background: el.style.backgroundColor || "",
    text: el.innerText || "",
    zIndex: index,
  }));

  localStorage.setItem("miniFigmaLayout", JSON.stringify(layout));
}

function loadLayout() {
  const saved = localStorage.getItem("miniFigmaLayout");
  if (!saved) return;

  const layout = JSON.parse(saved);

  canvas.innerHTML = "";
  layers = [];
  selectedElement = null;

  layout.forEach((item) => {
    const el = document.createElement("div");
    el.style.position = "absolute";

    el.style.left = item.x + "px";
    el.style.top = item.y + "px";
    el.style.width = item.width + "px";
    el.style.height = item.height + "px";
    el.style.transform = `rotate(${item.rotation}deg)`;
    el.dataset.rotation = item.rotation;

    if (item.type === "rect") {
      el.style.backgroundColor = item.background || "green";
    }

    if (item.type === "text") {
      el.style.border = "1px dashed gray";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.innerText = item.text;
    }

    attachElementEvents(el);
    canvas.appendChild(el);
    layers.push(el);
  });

  renderLayers();
}

function attachElementEvents(el) {
  el.addEventListener("click", function (e) {
    e.stopPropagation();
    selectElement(el);
  });

  el.addEventListener("mousedown", function (e) {
    e.stopPropagation();
    selectElement(el);

    isDragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startElX = el.offsetLeft;
    startElY = el.offsetTop;
  });
}

window.addEventListener("load", function () {
  loadLayout();
});
