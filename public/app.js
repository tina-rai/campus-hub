const searchInput =
    document.getElementById("search-input");

const categoryFilter =
    document.getElementById("category-filter");

const searchButton =
    document.getElementById("search-btn");
const eventList = document.getElementById("event-list");

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

        const data =
            await response.json();

        displayEvents(data.results || data);

    } catch (error) {

        console.error(error);

        eventList.innerHTML =
            "<p>Failed to load events.</p>";

    }

}

searchButton.addEventListener("click", loadEvents);

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

        card.innerHTML = `
            <span class="event-category">
                ${event.category}
            </span>

            <h3>${event.title}</h3>

            <p>${event.description}</p>

            <p>
                📍 ${event.location}
            </p>

            <p>
                📅 ${event.date}
            </p>

            <p>
                🕐 ${event.time}
            </p>

            <p>
                👥 Capacity: ${event.capacity}
            </p>
        `;

        eventList.appendChild(card);

    });

}

loadEvents();