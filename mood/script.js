const STORAGE_KEY =
    "plain-days-daily-mood";

const moods = {
    happy: {
        face: "⁽˙ᵕ˙⁾",
        label: "Feeling happy"
    },

    calm: {
        face: "( ˘͈ ᵕ ˘͈ )",
        label: "Feeling calm"
    },

    tired: {
        face: "(－_－) zzZ",
        label: "Feeling tired"
    },

    sad: {
        face: "(｡•́︿•̀｡)",
        label: "Feeling sad"
    },

    angry: {
        face: "( •̀⤙•́ )",
        label: "Feeling angry"
    }
};


function getDateKey(date = new Date()) {
    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


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

    history[getDateKey()] =
        moodName;

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history)
    );
}


function showDate() {
    const today = new Date();

    const day =
        String(today.getDate())
            .padStart(2, "0");

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    document.getElementById("today").textContent =
        `${day} / ${month}`;
}


function selectMood(moodName, animate = true) {
    const mood =
        moods[moodName];

    if (!mood) return;

    const stage =
        document.getElementById("moodStage");

    const face =
        document.getElementById("mainFace");

    const label =
        document.getElementById("moodLabel");


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


    stage.className =
        "mood-stage";

    face.textContent =
        mood.face;

    label.textContent =
        mood.label;


    if (animate) {
        void stage.offsetWidth;
    }

    stage.classList.add(
        moodName
    );

    saveMood(moodName);
}


document
    .querySelectorAll(".mood-option")
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                selectMood(
                    button.dataset.mood
                );
            }
        );
    });


function loadTodayMood() {
    const history =
        readHistory();

    const todayMood =
        history[getDateKey()];

    if (todayMood) {
        selectMood(
            todayMood,
            false
        );
    }
}


showDate();
loadTodayMood();
