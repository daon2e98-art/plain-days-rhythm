const STORAGE_KEY =
    "plain-days-daily-mood";

const moods = {
    happy: {
        face: "⁽˙ᵕ˙⁾",
        weekFace: "˙ᵕ˙",
        monthFace: "ᵕ",
        label: "Feeling happy"
    },

    calm: {
        face: "( ˘͈ ᵕ ˘͈ )",
        weekFace: "˘ᵕ˘",
        monthFace: "˘",
        label: "Feeling calm"
    },

    tired: {
        face: "(－_－) zzZ",
        weekFace: "－_－",
        monthFace: "–",
        label: "Feeling tired"
    },

    sad: {
        face: "(｡•́︿•̀｡)",
        weekFace: "•́︿•̀",
        monthFace: "︿",
        label: "Feeling sad"
    },

    angry: {
        face: "( •̀⤙•́ )",
        weekFace: "•̀⤙•́",
        monthFace: "⤙",
        label: "Feeling angry"
    }
};

let viewedWeek = getMonday(new Date());

let viewedMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
);


/* 날짜 도구 */

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month =
        String(date.getMonth() + 1).padStart(2, "0");
    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getMonday(date) {
    const result = new Date(date);
    const weekday = result.getDay();
    const difference =
        weekday === 0 ? -6 : 1 - weekday;

    result.setDate(result.getDate() + difference);
    result.setHours(0, 0, 0, 0);

    return result;
}


function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);

    return result;
}


/* 저장 */

function readHistory() {
    try {
        const saved =
            localStorage.getItem(STORAGE_KEY);

        return saved
            ? JSON.parse(saved)
            : {};
    } catch {
        return {};
    }
}


function saveMood(moodName) {
    const history = readHistory();

    history[getDateKey()] = moodName;

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history)
    );
}


/* 오늘 날짜 */

function showCurrentDate() {
    const today = new Date();

    const day =
        String(today.getDate()).padStart(2, "0");

    const month =
        String(today.getMonth() + 1).padStart(2, "0");

    document.getElementById("currentDate").textContent =
        `${day} / ${month}`;
}


/* 오늘의 기분 */

function selectMood(
    moodName,
    animate = true,
    shouldSave = true
) {
    const mood = moods[moodName];

    if (!mood) return;

    const stage =
        document.getElementById("moodStage");

    document
        .querySelectorAll(".mood-option")
        .forEach((button) => {
            const selected =
                button.dataset.mood === moodName;

            button.classList.toggle(
                "selected",
                selected
            );

            button
                .querySelector(".mood-dot")
                .textContent =
                    selected ? "●" : "○";
        });

    stage.className = "mood-stage";

    document.getElementById("mainFace").textContent =
        mood.face;

    document.getElementById("moodLabel").textContent =
        mood.label;

    if (animate) {
        void stage.offsetWidth;
    }

    stage.classList.add(moodName);

    if (shouldSave) {
        saveMood(moodName);
    }
}


function loadTodayMood() {
    const history = readHistory();
    const todayMood = history[getDateKey()];

    if (todayMood) {
        selectMood(
            todayMood,
            false,
            false
        );
    }
}


/* 화면 전환 */

function changeView(viewName) {
    document
        .querySelectorAll(".view")
        .forEach((view) => {
            view.hidden =
                view.id !== `${viewName}View`;
        });

    document
        .querySelectorAll(".view-tab")
        .forEach((tab) => {
            tab.classList.toggle(
                "active",
                tab.dataset.view === viewName
            );
        });

    if (viewName === "week") {
        renderWeek();
    }

    if (viewName === "month") {
        renderMonth();
    }
}


document
    .querySelectorAll(".view-tab")
    .forEach((tab) => {
        tab.addEventListener("click", () => {
            changeView(tab.dataset.view);
        });
    });


/* 주간 기록 */

function renderWeek() {
    const history = readHistory();
    const weekGrid =
        document.getElementById("weekGrid");

    const weekEnd =
        addDays(viewedWeek, 6);

    document.getElementById("weekTitle").textContent =
        `${viewedWeek.getDate()} ${viewedWeek.toLocaleString(
            "en",
            { month: "short" }
        )} – ${weekEnd.getDate()} ${weekEnd.toLocaleString(
            "en",
            { month: "short" }
        )}`;

    weekGrid.innerHTML = "";

    const weekdayNames =
        ["M", "T", "W", "T", "F", "S", "S"];

    for (let index = 0; index < 7; index++) {
        const date =
            addDays(viewedWeek, index);

        const dateKey =
            getDateKey(date);

        const moodName =
            history[dateKey];

        const cell =
            document.createElement("div");

        cell.className = "week-day";

        if (dateKey === getDateKey()) {
            cell.classList.add("today");
        }

        if (!moodName) {
            cell.classList.add("empty");
        }

        cell.innerHTML = `
            <span class="week-name">
                ${weekdayNames[index]}
            </span>

            <span class="week-face">
                ${moodName
                    ? moods[moodName].weekFace
                    : "—"}
            </span>

            <span class="week-date">
                ${date.getDate()}
            </span>
        `;

        if (moodName) {
            cell.title =
                `${dateKey} · ${moods[moodName].label}`;
        }

        weekGrid.appendChild(cell);
    }
}


document
    .getElementById("previousWeek")
    .addEventListener("click", () => {
        viewedWeek =
            addDays(viewedWeek, -7);

        renderWeek();
    });


document
    .getElementById("nextWeek")
    .addEventListener("click", () => {
        viewedWeek =
            addDays(viewedWeek, 7);

        renderWeek();
    });


/* 월간 기록 */

function renderMonth() {
    const history = readHistory();

    const year =
        viewedMonth.getFullYear();

    const month =
        viewedMonth.getMonth();

    const firstDate =
        new Date(year, month, 1);

    const daysInMonth =
        new Date(year, month + 1, 0).getDate();

    const firstWeekday =
        (firstDate.getDay() + 6) % 7;

    const grid =
        document.getElementById("monthGrid");

    document.getElementById("monthTitle").textContent =
        viewedMonth.toLocaleString("en", {
            month: "long",
            year: "numeric"
        });

    grid.innerHTML = "";

    for (let index = 0; index < firstWeekday; index++) {
        const empty =
            document.createElement("span");

        empty.className = "month-empty";
        grid.appendChild(empty);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const date =
            new Date(year, month, day);

        const dateKey =
            getDateKey(date);

        const moodName =
            history[dateKey];

        const cell =
            document.createElement("span");

        cell.className = "month-cell";

        if (date > today) {
            cell.classList.add("future");
        }

        if (dateKey === getDateKey()) {
            cell.classList.add("today");
        }

        if (moodName) {
            cell.innerHTML = `
                <span class="month-expression">
                    ${moods[moodName].monthFace}
                </span>
            `;

            cell.title =
                `${dateKey} · ${moods[moodName].label}`;
        } else {
            cell.classList.add("no-record");
            cell.textContent = day;
            cell.title = `${dateKey} · No record`;
        }

        grid.appendChild(cell);
    }
}


document
    .getElementById("previousMonth")
    .addEventListener("click", () => {
        viewedMonth.setMonth(
            viewedMonth.getMonth() - 1
        );

        renderMonth();
    });


document
    .getElementById("nextMonth")
    .addEventListener("click", () => {
        viewedMonth.setMonth(
            viewedMonth.getMonth() + 1
        );

        renderMonth();
    });


/* 기분 선택 버튼 */

document
    .querySelectorAll(".mood-option")
    .forEach((button) => {
        button.addEventListener("click", () => {
            selectMood(button.dataset.mood);
        });
    });


/* 시작 */

showCurrentDate();
loadTodayMood();

setInterval(() => {
    showCurrentDate();
}, 60000);
