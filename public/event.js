const eventDetails =
    document.getElementById("event-details");

const registrationSection =
    document.getElementById("registration-section");

const registrationStatus =
    document.getElementById("registration-status");

const registerButton =
    document.getElementById("register-button");

const registrationMessage =
    document.getElementById("registration-message");

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
async function setupAuthUI() {

    const user = await getCurrentUser();

    const authArea =
        document.getElementById("auth-area");

    const adminLink =
        document.getElementById("admin-link");

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

        if (user.role === "admin") {

            adminLink.hidden = false;

            registrationStatus.textContent =
                "You are logged in as an administrator.";

            registerButton.hidden = false;

        } else {

            registrationStatus.textContent =
                `Logged in as ${user.name}.`;

            registerButton.hidden = false;
        }

    } else {

        registrationStatus.innerHTML = `
            Please
            <a href="/login.html">log in</a>
            to register for this event.
        `;

        registerButton.hidden = true;
    }
}


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
    <strong>Location:</strong>
    ${event.location}
</p>

<p>
    <strong>Date:</strong>
    ${event.date}
</p>

<p>
    <strong>Time:</strong>
    ${formatTime(event.time)}
</p>

<p>
    <strong>Capacity:</strong>
    ${event.capacity ?? "Unlimited"}
</p>
            <p>
                 <strong>Registered:</strong>
                ${event.registered}
            </p>

            <p>
                 <strong>Seats remaining:</strong>
                ${event.remaining}
            </p>

            <button
                class="back-button"
                onclick="window.location.href='/'"
            >
                ← Back to Events
            </button>
        `;

    } catch (error) {

        console.error(error);

        eventDetails.innerHTML =
            "<p>Failed to load event.</p>";
    }
}


async function registerForEvent() {

    const params =
        new URLSearchParams(window.location.search);

    const eventId =
        params.get("id");

    registerButton.disabled = true;

    registrationMessage.textContent =
        "Registering...";

    try {

        const response =
            await fetch(`/events/${eventId}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            });

        const data =
            await response.json();

        if (!response.ok) {

            registrationMessage.textContent =
                data.message || "Registration failed.";

            registerButton.disabled = false;

            return;
        }

        registrationMessage.textContent =
            "Registration successful!";

        registerButton.textContent =
            "Registered ✓";

    } catch (error) {

        console.error(error);

        registrationMessage.textContent =
            "Something went wrong. Please try again.";

        registerButton.disabled = false;
    }
}


registerButton.addEventListener(
    "click",
    registerForEvent
);


setupAuthUI();
loadEvent();