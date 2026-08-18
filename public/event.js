const registrationForm =
    document.getElementById("registration-form");

const registrationMessage =
    document.getElementById("registration-message");
const registrationList =
    document.getElementById("registration-list");
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

<p>
    🎟️ <strong>Registered:</strong>
    ${event.registered}
</p>

<p>
    🪑 <strong>Seats remaining:</strong>
    ${event.remaining}
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
async function registerForEvent(eventId) {

    const studentName =
        document.getElementById("student-name").value.trim();

    const studentEmail =
        document.getElementById("student-email").value.trim();

    if (!studentName || !studentEmail) {
        registrationMessage.textContent =
            "Please enter your name and email.";

        return;
    }

    try {

        const response = await fetch(
            `/events/${eventId}/register`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    student_name: studentName,
                    student_email: studentEmail
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            registrationMessage.textContent =
                data.message || "Registration failed.";

            return;
        }

        registrationMessage.textContent =
            "Registration successful!";

        registrationForm.reset();

    } catch (error) {

        console.error(error);

        registrationMessage.textContent =
            "Something went wrong. Please try again.";

    }

}
async function loadRegistrations(eventId) {

    try {

        const response =
            await fetch(`/events/${eventId}/registrations`);

        const data =
            await response.json();

        if (!response.ok) {
            registrationList.innerHTML =
                `<p>${data.message}</p>`;
            return;
        }

        if (data.registrations.length === 0) {

            registrationList.innerHTML =
                "<p>No students registered yet.</p>";

            return;
        }

        registrationList.innerHTML = "";

        data.registrations.forEach((registration, index) => {

            const student =
                document.createElement("div");

            student.className = "registration-card";

            student.innerHTML = `
                <strong>
                    ${index + 1}. ${registration.student_name}
                </strong>

                <p>
                    ${registration.student_email}
                </p>
            `;

            registrationList.appendChild(student);

        });

    } catch (error) {

        console.error(error);

        registrationList.innerHTML =
            "<p>Failed to load registrations.</p>";

    }

}
registrationForm.addEventListener("submit", async(event) => {

    event.preventDefault();

    const params =
        new URLSearchParams(window.location.search);

    const eventId = params.get("id");

    await registerForEvent(eventId);

});
loadEvent();

const params =
    new URLSearchParams(window.location.search);

const eventId = params.get("id");

if (eventId) {
    loadRegistrations(eventId);
}