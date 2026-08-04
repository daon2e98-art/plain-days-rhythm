const MAX_BOOKS = 9;
const params = new URLSearchParams(location.search);
const shelfName = (params.get("shelf") || "default").replace(/[^a-zA-Z0-9_-]/g, "") || "default";
const STORAGE_KEY = `plain-days-bookshelf:${shelfName}`;

const starterBooks = [
  { id: makeId(), title: "Dark Skies", author: "", color: "silver", progress: 35 },
  { id: makeId(), title: "Iron Widow", author: "", color: "pearl", progress: 68 },
  { id: makeId(), title: "From Blood and Ash", author: "", color: "stone", progress: 42 },
  { id: makeId(), title: "The Decoy Girlfriend", author: "", color: "mist", progress: 80 },
  { id: makeId(), title: "The Legacy", author: "", color: "silver", progress: 20 },
  { id: makeId(), title: "The Deal", author: "", color: "pearl", progress: 100 },
  { id: makeId(), title: "Archer’s Voice", author: "", color: "smoke", progress: 56 }
];

const booksRoot = document.getElementById("books");
const editButton = document.getElementById("editButton");
const editor = document.getElementById("editor");
const editorList = document.getElementById("editorList");
const newTitle = document.getElementById("newTitle");
const addBook = document.getElementById("addBook");
const bookTemplate = document.getElementById("bookTemplate");
const editorRowTemplate = document.getElementById("editorRowTemplate");
const bookCard = document.getElementById("bookCard");
const cardClose = document.getElementById("cardClose");
const cardTitle = document.getElementById("cardTitle");
const cardAuthor = document.getElementById("cardAuthor");
const cardProgress = document.getElementById("cardProgress");
const cardProgressText = document.getElementById("cardProgressText");

let books = loadBooks();
let editing = false;
let selectedId = null;

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `book-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadBooks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return starterBooks;

    const oldPalette = {
      powder: "silver",
      blush: "pearl",
      lilac: "stone",
      sage: "mist",
      cream: "stone"
    };

    return saved.slice(0, MAX_BOOKS).map((book) => ({
      ...book,
      color: oldPalette[book.color] || book.color || "pearl"
    }));
  } catch {
    return starterBooks;
  }
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function getBookHeight(book, index) {
  const titleWeight = Math.min(book.title.length, 28) * .35;
  return Math.round(103 + ((index * 13) % 22) + titleWeight);
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
    node.setAttribute("aria-label", `Select ${book.title}`);
    node.title = book.author ? `${book.title} — ${book.author}` : book.title;
    node.addEventListener("click", () => selectBook(book.id));
    booksRoot.appendChild(node);
  });
}

function selectBook(id) {
  selectedId = selectedId === id ? null : id;
  renderShelf();

  if (!selectedId) {
    bookCard.hidden = true;
    return;
  }

  const book = books.find(({ id: bookId }) => bookId === selectedId);
  if (!book) return;
  cardTitle.textContent = book.title;
  cardAuthor.textContent = book.author || "A quiet reading moment";
  cardProgress.style.width = `${Math.max(0, Math.min(100, Number(book.progress) || 0))}%`;
  cardProgressText.textContent = `${Math.max(0, Math.min(100, Number(book.progress) || 0))}% read`;
  bookCard.hidden = false;
}

function renderEditor() {
  editorList.innerHTML = "";

  books.forEach((book, index) => {
    const row = editorRowTemplate.content.firstElementChild.cloneNode(true);
    const title = row.querySelector(".edit-title");
    const author = row.querySelector(".edit-author");
    const color = row.querySelector(".edit-color");
    const up = row.querySelector(".move-up");
    const down = row.querySelector(".move-down");
    const remove = row.querySelector(".delete-book");

    title.value = book.title;
    author.value = book.author || "";
    color.value = book.color;
    up.disabled = index === 0;
    down.disabled = index === books.length - 1;

    title.addEventListener("input", () => updateBook(book.id, "title", title.value));
    title.addEventListener("blur", () => {
      if (!title.value.trim()) {
        title.value = "Untitled Book";
        updateBook(book.id, "title", title.value);
      }
    });
    author.addEventListener("input", () => updateBook(book.id, "author", author.value));
    color.addEventListener("change", () => updateBook(book.id, "color", color.value));
    up.addEventListener("click", () => moveBook(index, -1));
    down.addEventListener("click", () => moveBook(index, 1));
    remove.addEventListener("click", () => deleteBook(book.id));
    editorList.appendChild(row);
  });

  addBook.disabled = books.length >= MAX_BOOKS;
  addBook.textContent = books.length >= MAX_BOOKS ? "Shelf full" : "＋ Add";
}

function updateBook(id, property, value) {
  const book = books.find(({ id: bookId }) => bookId === id);
  if (!book) return;
  book[property] = value;
  saveBooks();
  renderShelf();
}

function moveBook(index, offset) {
  const next = index + offset;
  if (next < 0 || next >= books.length) return;
  [books[index], books[next]] = [books[next], books[index]];
  saveBooks();
  renderShelf();
  renderEditor();
}

function deleteBook(id) {
  books = books.filter((book) => book.id !== id);
  if (selectedId === id) selectedId = null;
  saveBooks();
  bookCard.hidden = true;
  renderShelf();
  renderEditor();
}

function addNewBook() {
  const title = newTitle.value.trim();
  if (!title || books.length >= MAX_BOOKS) return;
  const colors = ["pearl", "silver", "mist", "stone", "smoke"];
  books.push({
    id: makeId(),
    title,
    author: "",
    color: colors[books.length % colors.length],
    progress: 0
  });
  newTitle.value = "";
  saveBooks();
  renderShelf();
  renderEditor();
  editorList.scrollTop = editorList.scrollHeight;
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
newTitle.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addNewBook();
});
cardClose.addEventListener("click", () => selectBook(selectedId));

renderShelf();
