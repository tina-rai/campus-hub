const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const searchButton = document.getElementById("search-btn");
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
        const category = categoryFilter.value;

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

    if (events.length === 0) {

        eventList.innerHTML =
            "<p>No events found.</p>";

        return;
    }

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

searchButton.addEventListener("click", loadEvents);

setupAuthUI();
loadEvents();