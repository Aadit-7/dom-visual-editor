const canvas = document.getElementById("canvas");
const addRectBtn = document.getElementById("add-rect");
const addTextBtn = document.getElementById("add-text");

const propWidth = document.getElementById("prop-width");
const propHeight = document.getElementById("prop-height");
const propBg = document.getElementById("prop-bg");
const propText = document.getElementById("prop-text");
const propTextColor = document.getElementById("prop-text-color");

const textProp = document.getElementById("text-prop");
const textColorProp = document.getElementById("text-color-prop");

const saveBtn = document.getElementById("save-project");
const loadBtn = document.getElementById("load-project");

const exportJsonBtn = document.getElementById("export-json");
const exportHtmlBtn = document.getElementById("export-html");

const layersList = document.getElementById("layers-list");

/* ------------------ LIMITS ------------------ */
const MIN_WIDTH = 30;
const MAX_WIDTH = 800;
const MIN_HEIGHT = 30;
const MAX_HEIGHT = 700;

/* ------------------ CENTRAL STATE ------------------ */
const state = {
  elements: [],
  selectedId: null,
};

let idCounter = 1;

/* ------------------ ELEMENT CREATION ------------------ */
addRectBtn.addEventListener("click", () => createElement("rect"));
addTextBtn.addEventListener("click", () => createElement("text"));

function createElement(type) {
  const id = "el_" + idCounter++;

  const data = {
    id,
    type,
    x: 50,
    y: 50,
    width: 120,
    height: 80,
    rotation: 0,
    styles: {
      backgroundColor: type === "rect" ? "#cce" : "#eef",
      color: "#000000",
    },
    text: type === "text" ? "Text" : "",
  };

  state.elements.push(data);
  renderElement(data);
  selectElement(id);
  renderLayers();
}

/* ------------------ RENDER ------------------ */
function renderElement(data) {
  const el = document.createElement("div");
  el.classList.add("element");

  if (data.type === "text") {
    el.classList.add("text");

    const textNode = document.createElement("div");
    textNode.className = "text-content";
    textNode.textContent = data.text;
    textNode.style.color = data.styles.color;

    el.appendChild(textNode);
  }

  el.dataset.id = data.id;
  updateElementStyle(el, data);

  el.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    selectElement(data.id);
    startDrag(e, el, data);
  });

  canvas.appendChild(el);
}

/* ------------------ STYLE UPDATE ------------------ */
function updateElementStyle(el, data) {
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";
  el.style.width = data.width + "px";
  el.style.height = data.height + "px";
  el.style.backgroundColor = data.styles.backgroundColor;
  el.style.transform = `rotate(${data.rotation}deg)`;

  if (data.type === "text") {
    el.style.color = data.styles.color;
  }
}

/* ------------------ SELECTION ------------------ */
function selectElement(id) {
  state.selectedId = id;
  updatePropertiesPanel();

  document.querySelectorAll(".element").forEach((el) => {
    el.classList.remove("selected");
    removeHandles(el);
  });

  const selectedEl = document.querySelector(`.element[data-id="${id}"]`);
  if (selectedEl) {
    selectedEl.classList.add("selected");
    addHandles(selectedEl);
  }
  renderLayers();
}

/* ------------------ HANDLES ------------------ */
function addHandles(el) {
  ["tl", "tr", "bl", "br"].forEach((pos) => {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle", pos);

    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      startResize(e, el, pos);
    });

    el.appendChild(handle);
  });

  const rotate = document.createElement("div");
  rotate.classList.add("rotate-handle");

  rotate.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    startRotate(e, el);
  });

  el.appendChild(rotate);
}

function removeHandles(el) {
  el.querySelectorAll(".resize-handle, .rotate-handle").forEach((h) =>
    h.remove(),
  );
}

/* ------------------ DESELECT ------------------ */
canvas.addEventListener("mousedown", (e) => {
  // 🔑 Only deselect if user clicked empty canvas
  if (e.target !== canvas) return;

  state.selectedId = null;

  document.querySelectorAll(".element").forEach((el) => {
    el.classList.remove("selected");
    removeHandles(el);
  });
  renderLayers();
});

/* ------------------ DRAG ------------------ */
let dragInfo = null;

function startDrag(e, el, data) {
  dragInfo = {
    el,
    data,
    startX: e.clientX,
    startY: e.clientY,
    origX: data.x,
    origY: data.y,
  };

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
}

function onDrag(e) {
  if (!dragInfo) return;

  const dx = e.clientX - dragInfo.startX;
  const dy = e.clientY - dragInfo.startY;

  let newX = dragInfo.origX + dx;
  let newY = dragInfo.origY + dy;

  newX = Math.max(0, Math.min(newX, canvas.clientWidth - dragInfo.data.width));
  newY = Math.max(
    0,
    Math.min(newY, canvas.clientHeight - dragInfo.data.height),
  );

  dragInfo.data.x = newX;
  dragInfo.data.y = newY;

  updateElementStyle(dragInfo.el, dragInfo.data);
}

function stopDrag() {
  dragInfo = null;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
}

/* ------------------ SMART RESIZE ------------------ */
let resizeInfo = null;

function startResize(e, el, position) {
  const data = state.elements.find((d) => d.id === el.dataset.id);

  resizeInfo = {
    el,
    data,
    position,
    startX: e.clientX,
    startY: e.clientY,
    startW: data.width,
    startH: data.height,
    startXPos: data.x,
    startYPos: data.y,
    originalRotation: data.rotation,
  };

  data.rotation = 0;
  updateElementStyle(el, data);

  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
}

function onResize(e) {
  if (!resizeInfo) return;

  const dx = e.clientX - resizeInfo.startX;
  const dy = e.clientY - resizeInfo.startY;

  let { data, position } = resizeInfo;

  let newW = resizeInfo.startW;
  let newH = resizeInfo.startH;
  let newX = resizeInfo.startXPos;
  let newY = resizeInfo.startYPos;

  if (position.includes("r")) newW += dx;
  if (position.includes("l")) {
    newW -= dx;
    newX += dx;
  }
  if (position.includes("b")) newH += dy;
  if (position.includes("t")) {
    newH -= dy;
    newY += dy;
  }

  data.width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newW));
  data.height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, newH));
  data.x = newX;
  data.y = newY;

  updateElementStyle(resizeInfo.el, data);
}

function stopResize() {
  if (!resizeInfo) return;

  resizeInfo.data.rotation = resizeInfo.originalRotation;
  updateElementStyle(resizeInfo.el, resizeInfo.data);

  resizeInfo = null;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
}

/* ------------------ ROTATE ------------------ */
let rotateInfo = null;

function startRotate(e, el) {
  const data = state.elements.find((d) => d.id === el.dataset.id);
  const rect = el.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = e.clientX - centerX;
  const dy = e.clientY - centerY;

  const mouseAngle = Math.atan2(dy, dx) * (180 / Math.PI);

  rotateInfo = {
    el,
    data,
    centerX,
    centerY,
    offset: mouseAngle - data.rotation,
  };

  document.addEventListener("mousemove", onRotate);
  document.addEventListener("mouseup", stopRotate);
}

function onRotate(e) {
  if (!rotateInfo) return;

  const dx = e.clientX - rotateInfo.centerX;
  const dy = e.clientY - rotateInfo.centerY;

  const mouseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  rotateInfo.data.rotation = mouseAngle - rotateInfo.offset;

  updateElementStyle(rotateInfo.el, rotateInfo.data);
}

function stopRotate() {
  rotateInfo = null;
  document.removeEventListener("mousemove", onRotate);
  document.removeEventListener("mouseup", stopRotate);
}

/* ------------------ KEYBOARD ------------------ */
document.addEventListener("keydown", (e) => {
  if (!state.selectedId) return;

  const data = state.elements.find((el) => el.id === state.selectedId);
  const el = document.querySelector(`.element[data-id="${state.selectedId}"]`);
  if (!data || !el) return;

  const step = 5;

  switch (e.key) {
    case "Delete":
      el.remove();
      state.elements = state.elements.filter((i) => i.id !== state.selectedId);
      state.selectedId = null;
      renderLayers();
      return;
    case "ArrowUp":
      data.y = Math.max(0, data.y - step);
      break;
    case "ArrowDown":
      data.y = Math.min(canvas.clientHeight - data.height, data.y + step);
      break;
    case "ArrowLeft":
      data.x = Math.max(0, data.x - step);
      break;
    case "ArrowRight":
      data.x = Math.min(canvas.clientWidth - data.width, data.x + step);
      break;
    default:
      return;
  }

  updateElementStyle(el, data);
});

/* ------------------ PROPERTIES PANEL ------------------ */
function updatePropertiesPanel() {
  if (!state.selectedId) return;

  const data = state.elements.find((el) => el.id === state.selectedId);
  if (!data) return;

  propWidth.value = data.width;
  propHeight.value = data.height;
  propBg.value = data.styles.backgroundColor;

  if (data.type === "text") {
    textProp.style.display = "block";
    textColorProp.style.display = "block";
    propText.value = data.text;
    propTextColor.value = data.styles.color;
  } else {
    textProp.style.display = "none";
    textColorProp.style.display = "none";
  }
}

propWidth.addEventListener("input", () => {
  const data = state.elements.find((el) => el.id === state.selectedId);
  if (!data) return;

  data.width = Math.min(
    MAX_WIDTH,
    Math.max(MIN_WIDTH, Number(propWidth.value)),
  );

  updateElementStyle(
    document.querySelector(`.element[data-id="${data.id}"]`),
    data,
  );
});

propHeight.addEventListener("input", () => {
  const data = state.elements.find((el) => el.id === state.selectedId);
  if (!data) return;

  data.height = Math.min(
    MAX_HEIGHT,
    Math.max(MIN_HEIGHT, Number(propHeight.value)),
  );

  updateElementStyle(
    document.querySelector(`.element[data-id="${data.id}"]`),
    data,
  );
});

propBg.addEventListener("input", () => {
  const data = state.elements.find((el) => el.id === state.selectedId);
  if (!data) return;

  data.styles.backgroundColor = propBg.value;
  updateElementStyle(
    document.querySelector(`.element[data-id="${data.id}"]`),
    data,
  );
});

propText.addEventListener("input", () => {
  const data = state.elements.find((el) => el.id === state.selectedId);
  if (!data || data.type !== "text") return;

  const el = document.querySelector(`.element[data-id="${data.id}"]`);
  const textNode = el.querySelector(".text-content");
  if (textNode) textNode.textContent = data.text;
});

propText.addEventListener("input", () => {
  const data = state.elements.find((el) => el.id === state.selectedId);
  if (!data || data.type !== "text") return;

  data.text = propText.value;

  const el = document.querySelector(`.element[data-id="${data.id}"]`);
  const textNode = el.querySelector(".text-content");

  if (textNode) {
    textNode.textContent = data.text;
  }
});

saveBtn.addEventListener("click", () => {
  const dataToSave = {
    elements: state.elements,
    idCounter,
  };

  localStorage.setItem("dom-editor-project", JSON.stringify(dataToSave));
  alert("Project saved successfully!");
});

function loadProject() {
  const saved = localStorage.getItem("dom-editor-project");
  if (!saved) return;

  const parsed = JSON.parse(saved);

  state.elements = parsed.elements || [];
  idCounter = parsed.idCounter || 1;
  state.selectedId = null;

  canvas.innerHTML = "";

  state.elements.forEach((el) => {
    renderElement(el);
  });

  renderLayers();
}
loadBtn.addEventListener("click", loadProject);

// Auto-load on page refresh
window.addEventListener("load", loadProject);

exportJsonBtn.addEventListener("click", () => {
  const json = JSON.stringify(state.elements, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "design.json";
  a.click();

  URL.revokeObjectURL(url);
});

exportHtmlBtn.addEventListener("click", () => {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Exported Design</title>
  <style>
    body { margin: 0; }
    .canvas {
      position: relative;
      width: 100vw;
      height: 100vh;
      background: #f9f9f9;
    }
    .element {
      position: absolute;
    }
  </style>
</head>
<body>
  <div class="canvas">
`;

  state.elements.forEach((el) => {
    html += `
    <div class="element"
      style="
        left:${el.x}px;
        top:${el.y}px;
        width:${el.width}px;
        height:${el.height}px;
        background:${el.styles.backgroundColor};
        color:${el.styles.color};
        transform: rotate(${el.rotation}deg);
      ">
      ${el.type === "text" ? el.text : ""}
    </div>
`;
  });

  html += `
  </div>
</body>
</html>
`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "design.html";
  a.click();

  URL.revokeObjectURL(url);
});

/* ------------------ LAYERS PANEL ------------------ */
function renderLayers() {
  layersList.innerHTML = "";

  // Show top-most element first
  [...state.elements].reverse().forEach((el) => {
    const layer = document.createElement("div");
    layer.className = "layer-item";

    layer.textContent = el.type === "rect" ? "Rectangle" : "Text";

    if (el.id === state.selectedId) {
      layer.classList.add("active");
    }

    layer.addEventListener("click", () => {
      selectElement(el.id);
    });

    layersList.appendChild(layer);
  });
}
