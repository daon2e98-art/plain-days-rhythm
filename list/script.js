const MAX_ITEMS = 8;

const params =
  new URLSearchParams(location.search);

const listName =
  (params.get("list") || "default")
    .replace(/[^a-zA-Z0-9_-]/g, "");

const STORAGE_KEY =
  `plain-days-little-list:${listName || "default"}`;


/* Starter tasks */

const starterItems = [
  {
    id: crypto.randomUUID(),
    text: "Take my lunch box",
    done: false
  },
  {
    id: crypto.randomUUID(),
    text: "Call the studio",
    done: false
  },
  {
    id: crypto.randomUUID(),
    text: "Buy vitamins",
    done: false
  }
];


/* Elements */

const list =
  document.getElementById("list");

const template =
  document.getElementById("itemTemplate");

const editButton =
  document.getElementById("editButton");

const addButton =
  document.getElementById("addButton");

const progress =
  document.getElementById("progress");


let editing = false;
let items = readItems();


/* Load saved tasks */

function readItems() {
  try {
    const saved =
      JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      );

    return Array.isArray(saved)
      ? saved.slice(0, MAX_ITEMS)
      : starterItems;

  } catch {
    return starterItems;
  }
}


/* Save tasks */

function saveItems() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items)
  );
}


/* Render the list */

function render(focusId = null) {
  list.innerHTML = "";

  list.classList.toggle(
    "editing",
    editing
  );


  /* Empty state */

  if (!items.length) {
    const empty =
      document.createElement("div");

    empty.className = "empty-state";

    empty.textContent =
      "A little space for what matters.";

    list.appendChild(empty);
  }


  /* Create task rows */

  items.forEach((item, index) => {
    const node =
      template.content
        .firstElementChild
        .cloneNode(true);

    const check =
      node.querySelector(".check");

    const input =
      node.querySelector(".item-text");

    const up =
      node.querySelector(".move-up");

    const down =
      node.querySelector(".move-down");

    const remove =
      node.querySelector(".remove");


    node.dataset.id = item.id;

    node.classList.toggle(
      "done",
      item.done
    );

    check.textContent =
      item.done ? "●" : "○";

    check.setAttribute(
      "aria-label",
      item.done
        ? "Mark incomplete"
        : "Mark complete"
    );

    input.value = item.text;

    up.disabled =
      index === 0;

    down.disabled =
      index === items.length - 1;


    /* Complete task */

    check.addEventListener("click", () => {
      item.done = !item.done;

      saveItems();
      render();

      if (item.done) {
        const fresh =
          list.querySelector(
            `[data-id="${item.id}"]`
          );

        fresh?.classList.add(
          "just-done"
        );
      }
    });


    /* Edit task text */

    input.addEventListener("input", () => {
      item.text = input.value;

      saveItems();
    });


    /* Finish editing with Enter */

    input.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          input.blur();
        }
      }
    );


    /* Prevent empty task names */

    input.addEventListener("blur", () => {
      item.text =
        item.text.trim()
        || "Something to remember";

      saveItems();

      input.value = item.text;
    });


    /* Move and delete */

    up.addEventListener(
      "click",
      () => moveItem(index, -1)
    );

    down.addEventListener(
      "click",
      () => moveItem(index, 1)
    );

    remove.addEventListener(
      "click",
      () => {
        items =
          items.filter(
            ({ id }) => id !== item.id
          );

        saveItems();
        render();
      }
    );


    list.appendChild(node);
  });


  /* Progress */

  const completed =
    items.filter(
      (item) => item.done
    ).length;

  progress.textContent =
    `${completed} / ${items.length}`;


  /* Add button state */

  addButton.disabled =
    items.length >= MAX_ITEMS;

  addButton.textContent =
    items.length >= MAX_ITEMS
      ? "List is full"
      : "＋ Add something";


  /* Edit button state */

  editButton.textContent =
    editing ? "Done" : "Edit";


  /* Focus newly created task */

  if (focusId) {
    requestAnimationFrame(() => {
      const input =
        list.querySelector(
          `[data-id="${focusId}"] .item-text`
        );

      input?.focus();
      input?.select();
    });
  }
}


/* Move task */

function moveItem(index, offset) {
  const destination =
    index + offset;

  if (
    destination < 0
    || destination >= items.length
  ) {
    return;
  }

  [
    items[index],
    items[destination]
  ] = [
    items[destination],
    items[index]
  ];

  saveItems();
  render();
}


/* Edit mode */

editButton.addEventListener(
  "click",
  () => {
    editing = !editing;

    render();
  }
);


/* Add a task */

addButton.addEventListener(
  "click",
  () => {
    if (items.length >= MAX_ITEMS) {
      return;
    }

    const item = {
      id: crypto.randomUUID(),
      text: "Something to remember",
      done: false
    };

    items.push(item);

    saveItems();
    render(item.id);

    list.scrollTop =
      list.scrollHeight;
  }
);


/* Start */

render();
