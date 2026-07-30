function updateClock() {
    const now = new Date();

    const hours =
        String(now.getHours()).padStart(2, "0");

    const minutes =
        String(now.getMinutes()).padStart(2, "0");

    const seconds =
        String(now.getSeconds()).padStart(2, "0");

    document.getElementById("time").textContent =
        `${hours}:${minutes}`;

    document.getElementById("seconds").textContent =
        seconds;

    document.getElementById("date").textContent =
        now.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });
}

updateClock();

setInterval(updateClock, 1000);
