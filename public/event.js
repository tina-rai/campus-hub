const eventDetails =
    document.getElementById("event-details");

async function loadEvent() {

    try {

        const params =
            new URLSearchParams(window.location.search);

        const id = params.get("id");

        if (!id) {
            eventDetails.innerHTML =
                "<p>Event ID is missing.</p>";
            return;
        }

        const response =
            await fetch(`/events/${id}`);

        const event =
            await response.json();

        if (!response.ok) {

            eventDetails.innerHTML =
                `<p>${event.message}</p>`;

            return;
        }

        eventDetails.innerHTML = `

            <span class="event-category">
                ${event.category}
            </span>

            <h2>${event.title}</h2>

            <p>${event.description}</p>

            <p>
                📍 <strong>Location:</strong>
                ${event.location}
            </p>

            <p>
                📅 <strong>Date:</strong>
                ${event.date}
            </p>

            <p>
                🕐 <strong>Time:</strong>
                ${event.time}
            </p>

            <p>
                👥 <strong>Capacity:</strong>
                ${event.capacity}
            </p>

            <button
                class="back-button"
                onclick="window.location.href='/'">
                ← Back to Events
            </button>

        `;

    } catch (error) {

        console.error(error);

        eventDetails.innerHTML =
            "<p>Failed to load event.</p>";

    }

}

loadEvent();