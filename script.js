const HISTORY_STORAGE_KEY = "plain-days-rhythm-history";
const LABEL_STORAGE_KEY = "plain-days-rhythm-labels";
const LEGACY_STORAGE_KEY = "plain-days-rhythm";

let activeDateKey = getDateKey();


/* 날짜 키 만들기: 2026-07-26 */

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* 저장 데이터 안전하게 불러오기 */

function readStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);

        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}


/* 오늘 날짜 표시 */

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


/* 동그라미 체크 */

function toggleHabit(item) {
    const button = item.querySelector("button");
    const isChecked = button.classList.toggle("checked");

    button.textContent = isChecked ? "●" : "○";

    updateProgress();
    saveHabits();
}


/* 완료율 계산 */

function updateProgress() {
    const total =
        document.querySelectorAll(".habit").length;

    const checked =
        document.querySelectorAll("button.checked").length;

    const percent =
        total === 0
            ? 0
            : Math.round((checked / total) * 100);

    document.getElementById("percent").textContent =
        `${percent}%`;
}


/* 오늘 체크 기록 저장 */

function saveHabits() {
    const history = readStorage(HISTORY_STORAGE_KEY, {});

    history[activeDateKey] =
        [...document.querySelectorAll(".habit")].map((habit) =>
            habit
                .querySelector("button")
                .classList.contains("checked")
        );

    localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(history)
    );
}


/* 오늘 체크 기록 불러오기 */

function loadHabits() {
    const history = readStorage(HISTORY_STORAGE_KEY, {});
    const todayHabits = history[activeDateKey] || [];

    document.querySelectorAll(".habit").forEach((habit, index) => {
        const button = habit.querySelector("button");
        const isChecked = Boolean(todayHabits[index]);

        button.classList.toggle("checked", isChecked);
        button.textContent = isChecked ? "●" : "○";
    });

    updateProgress();
}


/* 기존 체크 기록을 오늘 기록으로 옮기기 */

function migrateOldHabits() {
    const oldHabits =
        readStorage(LEGACY_STORAGE_KEY, null);

    const history =
        readStorage(HISTORY_STORAGE_KEY, {});

    if (
        Array.isArray(oldHabits) &&
        !history[activeDateKey]
    ) {
        history[activeDateKey] = oldHabits;

        localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify(history)
        );
    }
}


/* 습관 이름 저장 */

function saveHabitLabels() {
    const labels =
        [...document.querySelectorAll(".habit span")].map(
            (label) => label.textContent.trim()
        );

    localStorage.setItem(
        LABEL_STORAGE_KEY,
        JSON.stringify(labels)
    );
}


/* 습관 이름 불러오기 */

function loadHabitLabels() {
    const labels =
        readStorage(LABEL_STORAGE_KEY, []);

    document.querySelectorAll(".habit span").forEach(
        (label, index) => {
            if (labels[index]) {
                label.textContent = labels[index];
            }
        }
    );
}


/* 습관 이름 직접 편집 */

document.querySelectorAll(".habit span").forEach((label) => {
    label.setAttribute("contenteditable", "true");
    label.setAttribute("spellcheck", "false");
    label.setAttribute("title", "Click to edit");

    label.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    label.addEventListener("input", () => {
        saveHabitLabels();
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

        saveHabitLabels();
    });
});


/* 날짜가 바뀌었는지 확인 */

function checkForNewDay() {
    const newDateKey = getDateKey();

    if (newDateKey !== activeDateKey) {
        activeDateKey = newDateKey;

        renderDate();
        loadHabits();
    }
}

/* 위젯을 켜둔 상태에서도 1분마다 날짜 확인 */

setInterval(checkForNewDay, 60000);


/* 시작 */

renderDate();
loadHabitLabels();
migrateOldHabits();
loadHabits();

/* 월간 리듬 히트맵 */

let viewedDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
);

const historyButton = document.createElement("button");
historyButton.className = "history-toggle";
historyButton.type = "button";
historyButton.textContent = "View month";

const historyPanel = document.createElement("section");
historyPanel.className = "history-panel";
historyPanel.hidden = true;

historyPanel.innerHTML = `
    <div class="month-header">
        <button class="month-nav prev-month" type="button">‹</button>
        <strong id="monthTitle"></strong>
        <button class="month-nav next-month" type="button">›</button>
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

    <div class="heatmap-grid" id="heatmapGrid"></div>
`;

document.querySelector(".widget").append(
    historyButton,
    historyPanel
);


/* 월간 기록 열고 닫기 */

historyButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const widget = document.querySelector(".widget");
    const isMonthMode =
        widget.classList.toggle("month-mode");

    historyPanel.hidden = !isMonthMode;

    historyButton.textContent =
        isMonthMode
            ? "Back to today"
            : "View month";

    if (isMonthMode) {
        viewedDate = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        );

        renderHeatmap();
    }
});


/* 이전 달과 다음 달 */

historyPanel
    .querySelector(".prev-month")
    .addEventListener("click", (event) => {
        event.stopPropagation();

        viewedDate.setMonth(viewedDate.getMonth() - 1);
        renderHeatmap();
    });

historyPanel
    .querySelector(".next-month")
    .addEventListener("click", (event) => {
        event.stopPropagation();

        viewedDate.setMonth(viewedDate.getMonth() + 1);
        renderHeatmap();
    });


/* 히트맵 그리기 */

function renderHeatmap() {
    const year = viewedDate.getFullYear();
    const month = viewedDate.getMonth();

    const firstWeekday =
        new Date(year, month, 1).getDay();

    const numberOfDays =
        new Date(year, month + 1, 0).getDate();

    const history =
        readStorage(HISTORY_STORAGE_KEY, {});

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
        const empty = document.createElement("span");
        empty.className = "heatmap-empty";
        grid.appendChild(empty);
    }

    for (let day = 1; day <= numberOfDays; day++) {
        const date = new Date(year, month, day);
        const dateKey = getDateKey(date);

        const habits = history[dateKey] || [];
        const completed = habits.filter(Boolean).length;
        const total = habits.length || 5;
        const percent = completed / total;

        const cell = document.createElement("span");

        cell.className = "heatmap-day";
        cell.textContent = day;
        cell.title = `${dateKey} · ${completed}/${total}`;

        if (percent === 0) {
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


/* 체크할 때 히트맵도 갱신 */

document.querySelectorAll(".habit").forEach((habit) => {
    habit.addEventListener("click", () => {
        if (!historyPanel.hidden) {
            setTimeout(renderHeatmap, 0);
        }
    });
});

