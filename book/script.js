const MAX_BOOKS = 16;
const params = new URLSearchParams(location.search);
const shelfName = (params.get("shelf") || "default").replace(/[^a-zA-Z0-9_-]/g, "") || "default";
const STORAGE_KEY = `plain-days-bookshelf:${shelfName}`;
const ETERNAL_KEY = `plain-days-eternal-shelf:${shelfName}`;

const starterBooks = [
  { id: makeId(), title: "Dark Skies", author: "", color: "silver", progress: 35 },
  { id: makeId(), title: "Iron Widow", author: "", color: "pearl", progress: 68 },
  { id: makeId(), title: "From Blood and Ash", author: "", color: "stone", progress: 42 },
  { id: makeId(), title: "The Decoy Girlfriend", author: "", color: "mist", progress: 80 },
  { id: makeId(), title: "The Legacy", author: "", color: "silver", progress: 20 },
  { id: makeId(), title: "The Deal", author: "", color: "pearl", progress: 92 },
  { id: makeId(), title: "Archer’s Voice", author: "", color: "smoke", progress: 56 }
];

const $ = (id) => document.getElementById(id);
const booksRoot = $("books");
const editButton = $("editButton");
const editor = $("editor");
const editorList = $("editorList");
const newTitle = $("newTitle");
const addBook = $("addBook");
const bookTemplate = $("bookTemplate");
const editorRowTemplate = $("editorRowTemplate");
const eternalItemTemplate = $("eternalItemTemplate");
const bookCard = $("bookCard");
const cardClose = $("cardClose");
const cardTitle = $("cardTitle");
const cardAuthor = $("cardAuthor");
const cardProgress = $("cardProgress");
const cardProgressText = $("cardProgressText");
const readingView = $("readingView");
const eternalView = $("eternalView");
const eternalList = $("eternalList");
const eternalCount = $("eternalCount");
const modalBackdrop = $("modalBackdrop");
const modalTitle = $("modalTitle");
const modalMessage = $("modalMessage");
const modalMark = $("modalMark");
const modalPrimary = $("modalPrimary");
const modalSecondary = $("modalSecondary");
const memoryNote = $("memoryNote");

let books = loadArray(STORAGE_KEY, starterBooks).slice(0, MAX_BOOKS).map(migrateBook);
let eternalBooks = loadArray(ETERNAL_KEY, []).map(migrateBook);
let editing = false;
let selectedId = null;
let activeView = "reading";
let pendingBookId = null;

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `book-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadArray(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}

function migrateBook(book) {
  const oldPalette = { powder: "silver", blush: "pearl", lilac: "stone", sage: "mist", cream: "stone" };
  return { ...book, progress: clamp(book.progress), color: oldPalette[book.color] || book.color || "pearl" };
}

function clamp(value) { return Math.round(Math.max(0, Math.min(100, Number(value) || 0))); }
function saveShelves() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  localStorage.setItem(ETERNAL_KEY, JSON.stringify(eternalBooks));
}

function getBookHeight(book, index) {
  return Math.round(119 + ((index * 13) % 22) + Math.min(book.title.length, 28) * .35);
}

function renderShelf() {
  booksRoot.innerHTML = "";
  books.forEach((book, index) => {
    const node = bookTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = book.id;
    node.dataset.color = book.color;
    node.style.setProperty("--book-height", `${getBookHeight(book, index)}px`);
    node.classList.toggle("selected", selectedId === book.id);
    node.querySelector(".spine-title").textContent = book.title;
    node.title = book.author ? `${book.title} — ${book.author}` : book.title;
    node.setAttribute("aria-label", `Select ${book.title}, ${book.progress}% read`);
    node.addEventListener("click", () => selectBook(book.id));
    booksRoot.appendChild(node);
  });
}

function selectBook(id) {
  selectedId = selectedId === id ? null : id;
  renderShelf();
  const book = books.find((item) => item.id === selectedId);
  if (!book) { bookCard.hidden = true; return; }
  cardTitle.textContent = book.title;
  cardAuthor.textContent = book.author || "A quiet reading moment";
  cardProgress.style.width = `${book.progress}%`;
  cardProgressText.textContent = `${book.progress}% read`;
  bookCard.hidden = false;
}

function renderEditor() {
  editorList.innerHTML = "";
  books.forEach((book, index) => {
    const row = editorRowTemplate.content.firstElementChild.cloneNode(true);
    const title = row.querySelector(".edit-title");
    const author = row.querySelector(".edit-author");
    const color = row.querySelector(".edit-color");
    const progress = row.querySelector(".edit-progress");
    const output = row.querySelector(".progress-output");
    const up = row.querySelector(".move-up");
    const down = row.querySelector(".move-down");
    title.value = book.title;
    author.value = book.author || "";
    color.value = book.color;
    progress.value = book.progress;
    output.value = `${book.progress}%`;
    up.disabled = index === 0;
    down.disabled = index === books.length - 1;

    title.addEventListener("input", () => updateBook(book.id, "title", title.value));
    title.addEventListener("blur", () => {
      if (!title.value.trim()) { title.value = "Untitled Book"; updateBook(book.id, "title", title.value); }
    });
    author.addEventListener("input", () => updateBook(book.id, "author", author.value));
    color.addEventListener("change", () => updateBook(book.id, "color", color.value));
    progress.addEventListener("input", () => {
      output.value = `${progress.value}%`;
      setProgress(book.id, progress.value, false);
    });
    progress.addEventListener("focus", () => { progress.dataset.start = String(book.progress); });
    progress.addEventListener("pointerdown", () => { progress.dataset.start = String(book.progress); });
    progress.addEventListener("change", () => {
      setProgress(book.id, progress.value, true, Number(progress.dataset.start));
      progress.dataset.start = progress.value;
    });
    up.addEventListener("click", () => moveBook(index, -1));
    down.addEventListener("click", () => moveBook(index, 1));
    row.querySelector(".delete-book").addEventListener("click", () => deleteBook(book.id));
    editorList.appendChild(row);
  });
  addBook.disabled = books.length >= MAX_BOOKS;
  addBook.textContent = books.length >= MAX_BOOKS ? "Shelf full" : "＋ Add";
}

function updateBook(id, property, value) {
  const book = books.find((item) => item.id === id);
  if (!book) return;
  book[property] = value;
  saveShelves();
  renderShelf();
}

function setProgress(id, value, mayCelebrate, startingProgress) {
  const book = books.find((item) => item.id === id);
  if (!book) return;
  const previous = book.progress;
  book.progress = clamp(value);
  saveShelves();
  renderShelf();
  if (selectedId === id) selectBook(id), selectBook(id);
  const beganBelowComplete = Number.isFinite(startingProgress) ? startingProgress < 100 : previous < 100;
  if (mayCelebrate && beganBelowComplete && book.progress === 100) showArchiveQuestion(id);
}

function moveBook(index, offset) {
  const next = index + offset;
  if (next < 0 || next >= books.length) return;
  [books[index], books[next]] = [books[next], books[index]];
  saveShelves(); renderShelf(); renderEditor();
}

function deleteBook(id) {
  books = books.filter((book) => book.id !== id);
  if (selectedId === id) selectedId = null;
  saveShelves(); bookCard.hidden = true; renderShelf(); renderEditor();
}

function addNewBook() {
  const title = newTitle.value.trim();
  if (!title || books.length >= MAX_BOOKS) return;
  const colors = ["pearl", "silver", "mist", "stone", "smoke"];
  books.push({ id: makeId(), title, author: "", color: colors[books.length % 5], progress: 0 });
  newTitle.value = "";
  saveShelves(); renderShelf(); renderEditor();
  editorList.scrollTop = editorList.scrollHeight;
}

function renderEternalShelf() {
  eternalList.innerHTML = "";
  eternalCount.textContent = `${eternalBooks.length} book${eternalBooks.length === 1 ? "" : "s"} remembered`;
  if (!eternalBooks.length) {
    eternalList.innerHTML = '<div class="eternal-empty">Finished books will rest here, gently.</div>';
    return;
  }
  eternalBooks.forEach((book) => {
    const node = eternalItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector("strong").textContent = book.title;
    node.querySelector(".eternal-meta").textContent = [book.author, formatDate(book.completedAt)].filter(Boolean).join(" · ");
    const note = node.querySelector("p");
    note.textContent = book.note || "No memory note yet.";
    node.querySelector(".return-book").addEventListener("click", () => returnToReading(book.id));
    eternalList.appendChild(node);
  });
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function returnToReading(id) {
  const book = eternalBooks.find((item) => item.id === id);
  if (!book || books.length >= MAX_BOOKS) return;
  eternalBooks = eternalBooks.filter((item) => item.id !== id);
  books.push({ ...book, progress: 100 });
  saveShelves(); renderEternalShelf(); renderShelf();
}

function showArchiveQuestion(id) {
  pendingBookId = id;
  const book = books.find((item) => item.id === id);
  modalMark.textContent = "○ → ●";
  modalTitle.textContent = "A book completed.";
  modalMessage.textContent = `Would you like to add “${book.title}” to your Eternal Shelf?`;
  memoryNote.hidden = true;
  modalSecondary.textContent = "Not yet";
  modalPrimary.textContent = "Yes, keep it";
  modalSecondary.onclick = closeModal;
  modalPrimary.onclick = archivePendingBook;
  modalBackdrop.hidden = false;
}

function archivePendingBook() {
  const book = books.find((item) => item.id === pendingBookId);
  if (!book) return closeModal();
  books = books.filter((item) => item.id !== pendingBookId);
  eternalBooks.unshift({ ...book, completedAt: new Date().toISOString(), note: "" });
  selectedId = null;
  saveShelves(); renderShelf(); renderEditor(); bookCard.hidden = true;

  modalMark.textContent = "●";
  modalTitle.textContent = "Congratulations—you finished it.";
  modalMessage.textContent = "Write a reading note for an eternal memory of this book.";
  memoryNote.value = "";
  memoryNote.hidden = false;
  modalSecondary.textContent = "Write later";
  modalPrimary.textContent = "Save memory";
  modalSecondary.onclick = finishArchive;
  modalPrimary.onclick = saveMemoryNote;
  setTimeout(() => memoryNote.focus(), 50);
}

function saveMemoryNote() {
  const book = eternalBooks.find((item) => item.id === pendingBookId);
  if (book) book.note = memoryNote.value.trim();
  saveShelves(); finishArchive();
}

function finishArchive() {
  closeModal();
  setView("eternal");
  renderEternalShelf();
}

function closeModal() {
  modalBackdrop.hidden = true;
  memoryNote.hidden = true;
  pendingBookId = null;
}

function setView(view) {
  activeView = view;
  readingView.hidden = view !== "reading";
  eternalView.hidden = view !== "eternal";
  document.querySelectorAll(".shelf-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  editButton.hidden = view !== "reading";
  editor.hidden = true;
  editing = false;
  editButton.textContent = "Edit";
  bookCard.hidden = true;
  selectedId = null;
  renderShelf();
  if (view === "eternal") renderEternalShelf();
}

editButton.addEventListener("click", () => {
  editing = !editing;
  editor.hidden = !editing;
  editButton.textContent = editing ? "Done" : "Edit";
  bookCard.hidden = true;
  selectedId = null;
  renderShelf();
  if (editing) renderEditor();
});
addBook.addEventListener("click", addNewBook);
newTitle.addEventListener("keydown", (event) => { if (event.key === "Enter") addNewBook(); });
cardClose.addEventListener("click", () => selectBook(selectedId));
document.querySelectorAll(".shelf-tab").forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
modalBackdrop.addEventListener("click", (event) => { if (event.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modalBackdrop.hidden) closeModal(); });

renderShelf();
renderEternalShelf();
