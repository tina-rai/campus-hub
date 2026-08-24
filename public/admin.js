const eventForm =
    document.getElementById("event-form");

const eventMessage =
    document.getElementById("event-message");

const eventList =
    document.getElementById("admin-event-list");

const logoutButton =
    document.getElementById("logout-btn");


async function checkAdmin() {

    try {

        const response =
            await fetch("/api/auth/me");

        const data =
            await response.json();

        if (!response.ok || data.user.role !== "admin") {

            window.location.href = "/login.html";

            return false;
        }

        return true;

    } catch (error) {

        console.error(error);

        window.location.href = "/login.html";

        return false;
    }
}


async function loadEvents() {

    try {

        const response =
            await fetch("/events?limit=100");

        const data =
            await response.json();

        if (!response.ok) {

            eventList.innerHTML =
                `<p>${data.message || "Failed to load events."}</p>`;

            return;
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

    if (!events.length) {

        eventList.innerHTML =
            "<p>No events found.</p>";

        return;
    }

    events.forEach(event => {

        const card =
            document.createElement("div");

        card.className = "admin-event-card";

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

            <div class="admin-actions">

                <button
                    class="view-registrations-btn"
                    data-id="${event.id}">
                    View Registrations
                </button>

                <button
                    class="delete-event-btn"
                    data-id="${event.id}">
                    Delete
                </button>

            </div>

            <div
                class="registrations"
                id="registrations-${event.id}">
            </div>
        `;

        eventList.appendChild(card);
    });


    document
        .querySelectorAll(".delete-event-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                deleteEvent(button.dataset.id);

            });

        });


    document
        .querySelectorAll(".view-registrations-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                loadRegistrations(button.dataset.id);

            });

        });
}


eventForm.addEventListener("submit", async(event) => {

    event.preventDefault();

    eventMessage.textContent =
        "Creating event...";


    const eventData = {

        title: document.getElementById("title").value.trim(),

        description: document.getElementById("description").value.trim(),

        category: document.getElementById("category").value,

        location: document.getElementById("location").value.trim(),

        date: document.getElementById("date").value,

        time: document.getElementById("time").value,

        capacity: Number(document.getElementById("capacity").value)
    };


    try {

        const response =
            await fetch("/events", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(eventData)
            });


        const data =
            await response.json();


        if (!response.ok) {

            eventMessage.textContent =
                data.message || "Failed to create event.";

            return;
        }


        eventMessage.textContent =
            "Event created successfully!";

        eventForm.reset();

        loadEvents();


    } catch (error) {

        console.error(error);

        eventMessage.textContent =
            "Something went wrong.";
    }

});


async function deleteEvent(eventId) {

    const confirmed =
        confirm("Are you sure you want to delete this event?");

    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(`/events/${eventId}`, {
                method: "DELETE"
            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Failed to delete event."
            );

            return;
        }


        alert("Event deleted successfully.");

        loadEvents();


    } catch (error) {

        console.error(error);

        alert("Something went wrong.");
    }
}


async function loadRegistrations(eventId) {

    const container =
        document.getElementById(
            `registrations-${eventId}`
        );


    container.innerHTML =
        "<p>Loading registrations...</p>";


    try {

        const response =
            await fetch(
                `/events/${eventId}/registrations`
            );


        const data =
            await response.json();


        if (!response.ok) {

            container.innerHTML =
                `<p>${data.message || "Failed to load registrations."}</p>`;

            return;
        }


        if (!data.registrations.length) {

            container.innerHTML =
                "<p>No registrations yet.</p>";

            return;
        }


        container.innerHTML = `
            <h4>
                Registered Students (${data.count})
            </h4>
        `;


        data.registrations.forEach(registration => {

            const student =
                document.createElement("div");

            student.className =
                "admin-registration";

            student.innerHTML = `
                <strong>
                    ${registration.student_name}
                </strong>

                <span>
                    ${registration.student_email}
                </span>
            `;

            container.appendChild(student);
        });


    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Failed to load registrations.</p>";
    }
}


logoutButton.addEventListener("click", async(event) => {

    event.preventDefault();

    try {

        await fetch("/api/auth/logout", {
            method: "POST"
        });

    } catch (error) {

        console.error(error);

    }

    window.location.href = "/login.html";
});


(async() => {

    const isAdmin =
        await checkAdmin();

    if (isAdmin) {
        loadEvents();
    }

})();