const searchInput = document.getElementById("search-input");
const sortFilter = document.getElementById("sort-filter");

const clearFilters = document.getElementById("clear-filters");

const resultsCount = document.getElementById("results-count");

const categoryChips =
    document.querySelectorAll(".chip");

let selectedCategory = "";
const eventList = document.getElementById("event-list");

async function setupAuthUI() {

    const user = await getCurrentUser();

    const authArea = document.getElementById("auth-area");
    const adminLink = document.getElementById("admin-link");

    if (!authArea) {
        return;
    }

    if (user) {

        authArea.innerHTML = `
            <span class="user-greeting">
                Hi, ${user.name}
            </span>

            <button id="logout-btn" class="logout-button">
                Log Out
            </button>
        `;

        document
            .getElementById("logout-btn")
            .addEventListener("click", logout);

        if (user.role === "admin" && adminLink) {
            adminLink.hidden = false;
        }

    }
}

async function loadEvents() {

    try {

        const search = searchInput.value.trim();
        const category = selectedCategory;
        const params = new URLSearchParams();

        if (search) {
            params.append("search", search);
        }

        if (category) {
            params.append("category", category);
        }

        const response =
            await fetch(`/events?${params.toString()}`);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load events.");
        }

        displayEvents(data.results || data);

    } catch (error) {

        console.error(error);

        eventList.innerHTML =
            "<p>Failed to load events.</p>";
    }
}

function displayEvents(events) {

    eventList.innerHTML = "";
    resultsCount.textContent =
        `Showing ${events.length} event${events.length === 1 ? "" : "s"}` +
        (selectedCategory ? ` in ${selectedCategory}` : "");

    if (events.length === 0) {

        eventList.innerHTML =
            "<p>No events found.</p>";

        return;
    }
    events.sort((a, b) => {

        const first = new Date(`${a.date} ${a.time}`);
        const second = new Date(`${b.date} ${b.time}`);

        if (sortFilter.value === "oldest") {
            return first - second;
        }

        return second - first;
    });
    events.forEach(event => {

        const card =
            document.createElement("div");

        card.className = "event-card";

        card.addEventListener("click", () => {
            window.location.href =
                `/event.html?id=${event.id}`;
        });

        card.innerHTML = `
            <span class="event-category">
                ${event.category}
            </span>

            <h3>${event.title}</h3>

            <p>${event.description}</p>

            <p>📍 ${event.location}</p>

            <p>📅 ${event.date}</p>

            <p>🕐 ${event.time}</p>

            <p>👥 Capacity: ${event.capacity}</p>
        `;

        eventList.appendChild(card);
    });
}

let timer;

searchInput.addEventListener("input", () => {

    clearTimeout(timer);

    timer = setTimeout(loadEvents, 300);

});
categoryChips.forEach(chip => {

    chip.addEventListener("click", () => {

        categoryChips.forEach(button =>
            button.classList.remove("active")
        );

        chip.classList.add("active");

        selectedCategory = chip.dataset.category;

        loadEvents();

    });

});
sortFilter.addEventListener(
    "change",
    loadEvents
);
clearFilters.addEventListener("click", () => {

    searchInput.value = "";

    selectedCategory = "";

    sortFilter.value = "newest";

    categoryChips.forEach(button =>
        button.classList.remove("active")
    );

    categoryChips[0].classList.add("active");

    loadEvents();

});
setupAuthUI();
loadEvents();