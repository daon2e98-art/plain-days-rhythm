const albumName = new URLSearchParams(window.location.search).get("album") || "default";
const safeAlbumName = albumName.toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 40) || "default";
const DB_NAME = `plain-days-little-window-${safeAlbumName}`;
const STORE_NAME = "photos";
const SETTINGS_KEY = `plain-days-little-window-settings-${safeAlbumName}`;
const MAX_PHOTOS = 6;

const viewer = document.getElementById("viewer");
const editor = document.getElementById("editor");
const emptyState = document.getElementById("emptyState");
const currentSlide = document.getElementById("currentSlide");
const nextSlide = document.getElementById("nextSlide");
const captionBar = document.getElementById("captionBar");
const counter = document.getElementById("counter");
const photoGrid = document.getElementById("photoGrid");
const photoInput = document.getElementById("photoInput");
const uploadLabel = document.getElementById("uploadLabel");
const intervalSelect = document.getElementById("intervalSelect");
const fitSelect = document.getElementById("fitSelect");
const toast = document.getElementById("toast");

let db;
let photos = [];
let currentIndex = 0;
let activeImage = currentSlide;
let standbyImage = nextSlide;
let slideshowTimer;
let toastTimer;
let settings = readSettings();

function readSettings() {
  try {
    return {
      interval: 8000,
      fit: "cover",
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
    };
  } catch {
    return { interval: 8000, fit: "cover" };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("position", "position");
      }
    };
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onerror = () => reject(request.error);
  });
}

function getAllPhotos() {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => a.position - b.position));
    request.onerror = () => reject(request.error);
  });
}

function addPhoto(blob, position) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).add({ blob, position });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deletePhoto(id) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
}

function writeAllPhotos(items) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    items.forEach((photo, index) => store.put({ ...photo, position: index }));
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function compressImage(file) {
  const bitmap = await loadBitmap(file);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { alpha: false });
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (typeof bitmap.close === "function") bitmap.close();
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
}

async function loadBitmap(file) {
  if ("createImageBitmap" in window) return createImageBitmap(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be opened"));
    };
    image.src = url;
  });
}

function photoUrl(photo) {
  if (!photo.url) photo.url = URL.createObjectURL(photo.blob);
  return photo.url;
}

function releaseUrls() {
  photos.forEach((photo) => {
    if (photo.url) URL.revokeObjectURL(photo.url);
  });
}

async function refreshPhotos() {
  releaseUrls();
  photos = await getAllPhotos();
  currentIndex = Math.min(currentIndex, Math.max(0, photos.length - 1));
  renderViewer(true);
  renderEditor();
}

function renderViewer(immediate = false) {
  clearTimeout(slideshowTimer);
  const hasPhotos = photos.length > 0;
  emptyState.hidden = hasPhotos;
  captionBar.hidden = !hasPhotos;
  currentSlide.hidden = !hasPhotos;
  nextSlide.hidden = !hasPhotos;

  if (!hasPhotos) return;

  [currentSlide, nextSlide].forEach((image) => { image.style.objectFit = settings.fit; });
  const src = photoUrl(photos[currentIndex]);
  if (immediate || !activeImage.src) {
    activeImage.src = src;
    activeImage.classList.add("visible");
    standbyImage.classList.remove("visible");
  } else {
    standbyImage.src = src;
    standbyImage.onload = () => {
      standbyImage.classList.add("visible");
      activeImage.classList.remove("visible");
      [activeImage, standbyImage] = [standbyImage, activeImage];
    };
  }

  counter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`;
  scheduleSlideshow();
}

function scheduleSlideshow() {
  clearTimeout(slideshowTimer);
  if (photos.length > 1 && settings.interval > 0 && editor.hidden) {
    slideshowTimer = setTimeout(() => showPhoto(currentIndex + 1), settings.interval);
  }
}

function showPhoto(index) {
  if (!photos.length) return;
  currentIndex = (index + photos.length) % photos.length;
  renderViewer();
}

function renderEditor() {
  photoGrid.innerHTML = "";
  photos.forEach((photo, index) => {
    const item = document.createElement("article");
    item.className = "photo-item";
    item.innerHTML = `
      <img alt="Photo ${index + 1}">
      <div class="photo-controls">
        <button type="button" data-action="left" aria-label="Move left">‹</button>
        <button type="button" data-action="delete" aria-label="Delete">×</button>
        <button type="button" data-action="right" aria-label="Move right">›</button>
      </div>`;
    item.querySelector("img").src = photoUrl(photo);
    item.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => handlePhotoAction(button.dataset.action, index));
    });
    photoGrid.appendChild(item);
  });
  uploadLabel.classList.toggle("disabled", photos.length >= MAX_PHOTOS);
}

async function handlePhotoAction(action, index) {
  if (action === "delete") {
    await deletePhoto(photos[index].id);
  } else {
    const destination = action === "left" ? index - 1 : index + 1;
    if (destination < 0 || destination >= photos.length) return;
    [photos[index], photos[destination]] = [photos[destination], photos[index]];
    await writeAllPhotos(photos);
  }
  await refreshPhotos();
}

async function handleFiles(fileList) {
  const available = MAX_PHOTOS - photos.length;
  const files = [...fileList].filter((file) => file.type.startsWith("image/")).slice(0, available);
  if (!files.length) {
    showToast(available ? "Choose image files." : "You can add up to 6 photos.");
    return;
  }
  try {
    for (let index = 0; index < files.length; index += 1) {
      const blob = await compressImage(files[index]);
      await addPhoto(blob, photos.length + index);
    }
    await refreshPhotos();
    showToast(`${files.length} photo${files.length > 1 ? "s" : ""} added.`);
  } catch {
    showToast("This photo could not be saved.");
  } finally {
    photoInput.value = "";
  }
}

function openEditor() {
  clearTimeout(slideshowTimer);
  editor.hidden = false;
  renderEditor();
}

function closeEditor() {
  editor.hidden = true;
  renderViewer(true);
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

document.getElementById("editButton").addEventListener("click", openEditor);
document.getElementById("addFirst").addEventListener("click", openEditor);
document.getElementById("doneButton").addEventListener("click", closeEditor);
document.getElementById("previousButton").addEventListener("click", () => showPhoto(currentIndex - 1));
document.getElementById("nextButton").addEventListener("click", () => showPhoto(currentIndex + 1));
photoInput.addEventListener("change", (event) => handleFiles(event.target.files));

intervalSelect.value = String(settings.interval);
fitSelect.value = settings.fit;
intervalSelect.addEventListener("change", () => {
  settings.interval = Number(intervalSelect.value);
  saveSettings();
});
fitSelect.addEventListener("change", () => {
  settings.fit = fitSelect.value;
  saveSettings();
  renderViewer(true);
});

openDatabase()
  .then(refreshPhotos)
  .catch(() => showToast("Photo storage is unavailable in this browser."));

window.addEventListener("beforeunload", releaseUrls);
