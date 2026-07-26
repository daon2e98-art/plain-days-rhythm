const HABIT_STORAGE_KEY = "plain-days-rhythm";
const LABEL_STORAGE_KEY = "plain-days-rhythm-labels";

/* 오늘 날짜 표시 */

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
        Math.round((checked / total) * 100);

    document.getElementById("percent").textContent =
        `${percent}%`;
}


/* 체크 상태 저장 */

function saveHabits() {
    const habits = [];

    document.querySelectorAll(".habit").forEach((habit) => {
        habits.push(
            habit
                .querySelector("button")
                .classList.contains("checked")
        );
    });

    localStorage.setItem(
        HABIT_STORAGE_KEY,
        JSON.stringify(habits)
    );
}


/* 체크 상태 불러오기 */

function loadHabits() {
    const saved = localStorage.getItem(HABIT_STORAGE_KEY);

    if (!saved) return;

    const habits = JSON.parse(saved);

    document.querySelectorAll(".habit").forEach((habit, index) => {
        const button = habit.querySelector("button");
        const isChecked = Boolean(habits[index]);

        button.classList.toggle("checked", isChecked);
        button.textContent = isChecked ? "●" : "○";
    });

    updateProgress();
}


/* 습관 이름 저장 */

function saveHabitLabels() {
    const labels = [];

    document.querySelectorAll(".habit span").forEach((label) => {
        labels.push(label.textContent.trim());
    });

    localStorage.setItem(
        LABEL_STORAGE_KEY,
        JSON.stringify(labels)
    );
}


/* 습관 이름 불러오기 */

function loadHabitLabels() {
    const saved = localStorage.getItem(LABEL_STORAGE_KEY);

    if (!saved) return;

    const labels = JSON.parse(saved);

    document.querySelectorAll(".habit span").forEach((label, index) => {
        if (labels[index]) {
            label.textContent = labels[index];
        }
    });
}


/* 이름 직접 편집 설정 */

document.querySelectorAll(".habit span").forEach((label) => {
    label.setAttribute("contenteditable", "true");
    label.setAttribute("spellcheck", "false");
    label.setAttribute("title", "Click to edit");

    /* 이름을 눌렀을 때 동그라미가 체크되지 않도록 막기 */
    label.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    label.addEventListener("input", () => {
        saveHabitLabels();
    });

    /* Enter를 누르면 편집 종료 */
    label.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            label.blur();
        }
    });

    /* 빈 이름 방지 */
    label.addEventListener("blur", () => {
        if (!label.textContent.trim()) {
            label.textContent = "New Habit";
        }

        saveHabitLabels();
    });
});


loadHabitLabels();
loadHabits();
updateProgress();
