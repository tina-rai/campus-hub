const searchInput =
    document.getElementById("search-input");

const sortFilter =
    document.getElementById("sort-filter");

const clearFilters =
    document.getElementById("clear-filters");

const resultsCount =
    document.getElementById("results-count");

const eventList =
    document.getElementById("event-list");

const categoryChips =
    document.querySelectorAll(".chip");

let selectedCategory = "";
let searchTimer;


async function setupAuthUI() {

    const user = await getCurrentUser();

    const authArea =
        document.getElementById("auth-area");

    const adminLink =
        document.getElementById("admin-link");

    if (!authArea) {
        return;
    }

    if (user) {

        authArea.innerHTML = `
            <span class="user-greeting">
                Hi, ${user.name}
            </span>

            <button
                id="logout-btn"
                class="logout-button"
            >
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

    eventList.innerHTML =
        "<p>Loading events...</p>";

    try {

        const search =
            searchInput.value.trim();

        const params =
            new URLSearchParams();

        if (search) {
            params.append("search", search);
        }

        if (selectedCategory) {
            params.append(
                "category",
                selectedCategory
            );
        }

        const query =
            params.toString();

        const response =
            await fetch(
                query ?
                `/events?${query}` :
                "/events"
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to load events."
            );
        }

        currentEvents =
            data.results || data;

        displayEvents(currentEvents);

    } catch (error) {

        console.error(error);

        resultsCount.textContent = "";

        eventList.innerHTML = `
            <p>
                Failed to load events.
                Please try again.
            </p>
        `;
    }
}

function formatTime(time) {

    if (!time) {
        return "";
    }

    const [hours, minutes] =
    time.split(":").map(Number);

    const period =
        hours >= 12 ? "PM" : "AM";

    const displayHour =
        hours % 12 || 12;

    return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function displayEvents(events) {

    eventList.innerHTML = "";

    const sortedEvents = [...events].sort((a, b) => {

        const first =
            new Date(`${a.date} ${a.time}`);

        const second =
            new Date(`${b.date} ${b.time}`);

        if (sortFilter.value === "oldest") {
            return first - second;
        }

        return first - second;
    });


    resultsCount.textContent =
        `Showing ${sortedEvents.length} event${
            sortedEvents.length === 1 ? "" : "s"
        }${
            selectedCategory
                ? ` in ${selectedCategory}`
                : ""
        }`;


    if (sortedEvents.length === 0) {

        eventList.innerHTML = `
            <div class="empty-state">
                <h3>No events found</h3>
                <p>
                    Try a different search or category.
                </p>
            </div>
        `;

        return;
    }


    sortedEvents.forEach(event => {

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

           <p><strong>Location:</strong> ${event.location}</p>
<p><strong>Date:</strong> ${event.date}</p>
<p><strong>Time:</strong> ${formatTime(event.time)}</p>
<p><strong>Capacity:</strong> ${event.capacity ?? "Unlimited"}</p>        `;

        eventList.appendChild(card);
    });
}


let currentEvents = [];

categoryChips.forEach(chip => {

    chip.addEventListener("click", () => {

        categoryChips.forEach(button => {
            button.classList.remove("active");
        });

        chip.classList.add("active");

        selectedCategory =
            chip.dataset.category;

        loadEvents();
    });

});


searchInput.addEventListener("input", () => {

    clearTimeout(searchTimer);

    searchTimer =
        setTimeout(loadEvents, 300);

});


sortFilter.addEventListener("change", () => {

    displayEvents(currentEvents);

});


clearFilters.addEventListener("click", () => {

    searchInput.value = "";

    selectedCategory = "";

    sortFilter.value = "upcoming";

    categoryChips.forEach(button => {
        button.classList.remove("active");
    });

    categoryChips[0].classList.add("active");

    loadEvents();

});


setupAuthUI();
loadEvents();