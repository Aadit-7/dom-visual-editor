const canvas = document.getElementById("canvas");
const addRectBtn = document.getElementById("add-rect");
const addTextBtn = document.getElementById("add-text");

/* ------------------ CENTRAL STATE ------------------ */
const state = {
  elements: [],
  selectedId: null,
};

let idCounter = 1;

/* ------------------ ELEMENT CREATION ------------------ */
addRectBtn.addEventListener("click", () => {
  createElement("rect");
});

addTextBtn.addEventListener("click", () => {
  createElement("text");
});

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
    },
    text: type === "text" ? "Text" : "",
  };

  state.elements.push(data);
  renderElement(data);
  selectElement(id);
}

/* ------------------ RENDER ELEMENT ------------------ */
function renderElement(data) {
  const el = document.createElement("div");
  el.classList.add("element");

  if (data.type === "rect") el.classList.add("rectangle");
  if (data.type === "text") {
    el.classList.add("text");
    el.textContent = data.text;
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

/* ------------------ UPDATE STYLE ------------------ */
function updateElementStyle(el, data) {
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";
  el.style.width = data.width + "px";
  el.style.height = data.height + "px";
  el.style.backgroundColor = data.styles.backgroundColor;
  el.style.transform = `rotate(${data.rotation}deg)`;
}

/* ------------------ SELECTION LOGIC ------------------ */
function selectElement(id) {
  state.selectedId = id;

  document.querySelectorAll(".element").forEach((el) => {
    el.classList.remove("selected");
  });

  const selectedEl = document.querySelector(`.element[data-id="${id}"]`);
  if (selectedEl) {
    selectedEl.classList.add("selected");
  }
}

/* Deselect on canvas click */
canvas.addEventListener("mousedown", () => {
  state.selectedId = null;
  document.querySelectorAll(".element").forEach((el) => {
    el.classList.remove("selected");
  });
});

/* ------------------ DRAGGING ------------------ */
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

  /* Canvas boundary constraint */
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
