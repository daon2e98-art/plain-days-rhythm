const quotes = [
    "Small steps still move you forward.",
    "Today is enough.",
    "Begin gently.",
    "Let the day unfold.",
    "Slow progress is still progress.",
    "Keep what feels simple.",
    "A quiet day still matters.",
    "Make room for yourself.",
    "One thing at a time.",
    "There is no need to rush.",
    "Rest belongs in the rhythm.",
    "Notice the little things.",
    "Start where you are.",
    "Choose a softer pace.",
    "Ordinary days are worth keeping.",
    "Breathe before beginning.",
    "A little is still something.",
    "Move through today gently.",
    "Your own pace is enough.",
    "Keep the day light."
];


function getDailyIndex(date) {
    const start =
        new Date(date.getFullYear(), 0, 0);

    const difference =
        date - start;

    const dayOfYear =
        Math.floor(
            difference / 86400000
        );

    return dayOfYear % quotes.length;
}


function updateQuote() {
    const today = new Date();

    const quoteIndex =
        getDailyIndex(today);

    document.getElementById("quote").textContent =
        quotes[quoteIndex];

    const day =
        String(today.getDate()).padStart(2, "0");

    const month =
        String(today.getMonth() + 1).padStart(2, "0");

    document.getElementById("date").textContent =
        `${day} / ${month}`;
}


updateQuote();

/* 날짜가 바뀌었는지 1분마다 확인 */

setInterval(updateQuote, 60000);
