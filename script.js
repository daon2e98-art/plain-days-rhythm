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


