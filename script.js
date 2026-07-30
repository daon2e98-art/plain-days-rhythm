/* Plain Days Rhythm v14 */

const HISTORY_KEY = "plain-days-rhythm-history";
const LABEL_KEY = "plain-days-rhythm-labels";
const LEGACY_KEY = "plain-days-rhythm";

const DEFAULT_LABELS = [
    "Morning Routine",
    "Drink Water",
    "Move Body",
    "Read",
    "Journal"
];

const MAX_HABITS = 8;

let activeDateKey = getDateKey();
let editMode = false;

let viewedDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
);

const widget = document.querySelector(".widget");
const habitsContainer = document.querySelector(".habits");


/* 저장 데이터 읽기 */

function readStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}


/* 날짜 */

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function renderDate() {
    const today = new Date();

    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    document.getElementById("day").textContent =
        days[today.getDay()];

    document.getElementById("date").textContent =
        `${today.getDate()} ${today.toLocaleString("en", {
            month: "long",
            year: "numeric"
        })}`;
}


/* 습관 이름 */

function getLabels() {
    const labels = readStorage(LABEL_KEY, null);

    if (Array.isArray(labels) && labels.length) {
        return labels;
    }

    return [...DEFAULT_LABELS];
}


function saveLabels() {
    const labels = [
        ...document.querySelectorAll(".habit-label")
    ].map((label) => label.textContent.trim());

    localStorage.setItem(
        LABEL_KEY,
        JSON.stringify(labels)
    );
}


/* 습관 화면 만들기 */

function buildHabits() {
    const labels = getLabels();

    habitsContainer.innerHTML = "";

    labels.forEach((text, index) => {
        const habit = document.createElement("div");
        habit.className = "habit";
        habit.dataset.id = index;

        const label = document.createElement("span");
        label.className = "habit-label";
        label.textContent = text;
        label.contentEditable = "true";
        label.spellcheck = false;
        label.title = "Click to edit";

        const checkButton = document.createElement("button");
        checkButton.className = "habit-check";
        checkButton.type = "button";
        checkButton.textContent = "○";

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-habit";
        deleteButton.type = "button";
        deleteButton.textContent = "×";
        deleteButton.title = "Delete habit";

        habit.addEventListener("click", () => {
            if (!editMode) {
                toggleHabit(habit);
            }
        });

        label.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        label.addEventListener("input", () => {
            saveLabels();
        });

        label.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                label.blur();
            }
        });

        label.addEventListener("blur", () => {
            if (!label.textContent.trim()) {
                label.textContent = "New Habit";
            }

            saveLabels();
        });

        deleteButton.addEventListener("click", (event) => {
            event.stopPropagation();
            removeHabit(index);
        });

        habit.append(
            label,
            checkButton,
            deleteButton
        );

        habitsContainer.appendChild(habit);
    });

    habitsContainer.classList.toggle(
        "editing",
        editMode
    );

    loadHabits();
    updateControlButtons();
}


/* 습관 체크 */

function toggleHabit(habit) {
    const button =
        habit.querySelector(".habit-check");

    const checked =
        button.classList.toggle("checked");

    button.textContent =
        checked ? "●" : "○";

    updateProgress();
    saveHabits();
}


/* 완료율 */

function updateProgress() {
    const total =
        document.querySelectorAll(".habit").length;

    const checked =
        document.querySelectorAll(
            ".habit-check.checked"
        ).length;

    const percent = total
        ? Math.round((checked / total) * 100)
        : 0;

    document.getElementById("percent").textContent =
        `${percent}%`;
}


/* 날짜별 체크 기록 */

function saveHabits() {
    const history =
        readStorage(HISTORY_KEY, {});

    history[activeDateKey] = [
        ...document.querySelectorAll(".habit")
    ].map((habit) =>
        habit
            .querySelector(".habit-check")
            .classList.contains("checked")
    );

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );
}


function loadHabits() {
    const history =
        readStorage(HISTORY_KEY, {});

    const saved =
        history[activeDateKey] || [];

    document
        .querySelectorAll(".habit")
        .forEach((habit, index) => {
            const button =
                habit.querySelector(".habit-check");

            const checked =
                Boolean(saved[index]);

            button.classList.toggle(
                "checked",
                checked
            );

            button.textContent =
                checked ? "●" : "○";
        });

    updateProgress();
}


/* 기존 저장 기록 이전 */

function migrateOldHabits() {
    const oldData =
        readStorage(LEGACY_KEY, null);

    const history =
        readStorage(HISTORY_KEY, {});

    if (Array.isArray(oldData)) {
        if (!history[activeDateKey]) {
            history[activeDateKey] = oldData;

            localStorage.setItem(
                HISTORY_KEY,
                JSON.stringify(history)
            );
        }

        localStorage.removeItem(LEGACY_KEY);
    }
}


/* 습관 추가 */

function addHabit() {
    const labels = getLabels();

    if (labels.length >= MAX_HABITS) {
        return;
    }

    saveHabits();

    labels.push("New Habit");

    localStorage.setItem(
        LABEL_KEY,
        JSON.stringify(labels)
    );

    buildHabits();
    saveHabits();

    const newLabel =
        document.querySelector(
            ".habit:last-child .habit-label"
        );

    if (newLabel) {
        newLabel.focus();

        const selection = window.getSelection();
        const range = document.createRange();

        range.selectNodeContents(newLabel);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}


/* 습관 삭제 */

function removeHabit(index) {
    const labels = getLabels();

    if (labels.length <= 1) {
        return;
    }

    saveHabits();

    labels.splice(index, 1);

    localStorage.setItem(
        LABEL_KEY,
        JSON.stringify(labels)
    );

    const history =
        readStorage(HISTORY_KEY, {});

    const todayHabits =
        history[activeDateKey] || [];

    todayHabits.splice(index, 1);
    history[activeDateKey] = todayHabits;

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );

    buildHabits();
}


/* 추가·편집 버튼 */

const habitControls =
    document.createElement("div");

habitControls.className =
    "habit-controls";

habitControls.innerHTML = `
    <button
        class="habit-action add-habit"
        type="button"
    >
        + Add habit
    </button>

    <button
        class="habit-action edit-habits"
        type="button"
    >
        Edit list
    </button>
`;

habitsContainer.after(habitControls);

const addHabitButton =
    habitControls.querySelector(".add-habit");

const editHabitsButton =
    habitControls.querySelector(".edit-habits");


addHabitButton.addEventListener("click", (event) => {
    event.stopPropagation();
    addHabit();
});


editHabitsButton.addEventListener("click", (event) => {
    event.stopPropagation();

    editMode = !editMode;

    habitsContainer.classList.toggle(
        "editing",
        editMode
    );

    editHabitsButton.textContent =
        editMode ? "Done" : "Edit list";
});


function updateControlButtons() {
    const count =
        document.querySelectorAll(".habit").length;

    addHabitButton.disabled =
        count >= MAX_HABITS;

    addHabitButton.textContent =
        count >= MAX_HABITS
            ? "Maximum 8"
            : "+ Add habit";
}


/* 월간 화면 생성 */

const historyButton =
    document.createElement("button");

historyButton.className =
    "history-toggle";

historyButton.type =
    "button";

historyButton.textContent =
    "View month";


const historyPanel =
    document.createElement("section");

historyPanel.className =
    "history-panel";

historyPanel.hidden = true;

historyPanel.innerHTML = `
    <div class="month-header">
        <button
            class="month-nav prev-month"
            type="button"
        >
            ‹
        </button>

        <strong id="monthTitle"></strong>

        <button
            class="month-nav next-month"
            type="button"
        >
            ›
        </button>
    </div>

    <div class="weekdays">
        <span>S</span>
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
    </div>

    <div
        class="heatmap-grid"
        id="heatmapGrid"
    ></div>
`;

widget.append(
    historyButton,
    historyPanel
);


/* 오늘 화면과 월간 화면 전환 */

historyButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const monthMode =
        widget.classList.toggle("month-mode");

    historyPanel.hidden =
        !monthMode;

    historyButton.textContent =
        monthMode
            ? "Back to today"
            : "View month";

    if (monthMode) {
        viewedDate = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        );

        renderHeatmap();
    }
});


historyPanel
    .querySelector(".prev-month")
    .addEventListener("click", (event) => {
        event.stopPropagation();

        viewedDate.setMonth(
            viewedDate.getMonth() - 1
        );

        renderHeatmap();
    });


historyPanel
    .querySelector(".next-month")
    .addEventListener("click", (event) => {
        event.stopPropagation();

        viewedDate.setMonth(
            viewedDate.getMonth() + 1
        );

        renderHeatmap();
    });


/* 월간 히트맵 */

function renderHeatmap() {
    const year = viewedDate.getFullYear();
    const month = viewedDate.getMonth();

    const firstWeekday =
        new Date(year, month, 1).getDay();

    const numberOfDays =
        new Date(year, month + 1, 0).getDate();

    const history =
        readStorage(HISTORY_KEY, {});

    const grid =
        document.getElementById("heatmapGrid");

    const title =
        document.getElementById("monthTitle");

    title.textContent =
        viewedDate.toLocaleString("en", {
            month: "long",
            year: "numeric"
        });

    grid.innerHTML = "";

    for (let i = 0; i < firstWeekday; i++) {
        const empty =
            document.createElement("span");

        empty.className =
            "heatmap-empty";

        grid.appendChild(empty);
    }

    for (let day = 1; day <= numberOfDays; day++) {
        const date =
            new Date(year, month, day);

        const dateKey =
            getDateKey(date);

        const hasRecord =
            Array.isArray(history[dateKey]);

        const habits =
            hasRecord
                ? history[dateKey]
                : [];

        const completed =
            habits.filter(Boolean).length;

        const total =
            habits.length || getLabels().length;

        const percent =
            completed / total;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isFuture =
            date > today;

        const cell =
            document.createElement("span");

        cell.className =
            "heatmap-day";

        cell.textContent =
            day;

        cell.title = hasRecord
            ? `${dateKey} · ${completed}/${total}`
            : `${dateKey} · No record`;

        if (isFuture) {
            cell.classList.add("future");

        } else if (!hasRecord) {
            cell.classList.add("no-record");

        } else if (percent === 0) {
            cell.classList.add("level-0");

        } else if (percent <= 0.25) {
            cell.classList.add("level-1");

        } else if (percent <= 0.5) {
            cell.classList.add("level-2");

        } else if (percent < 1) {
            cell.classList.add("level-3");

        } else {
            cell.classList.add("level-4");
        }

        if (dateKey === getDateKey()) {
            cell.classList.add("today");
        }

        grid.appendChild(cell);
    }
}


/* 날짜 변경 확인 */

function checkForNewDay() {
    const newDateKey = getDateKey();

    if (newDateKey !== activeDateKey) {
        activeDateKey = newDateKey;

        renderDate();
        loadHabits();
    }
}

setInterval(checkForNewDay, 60000);


/* 시작 */

renderDate();
migrateOldHabits();
buildHabits();
