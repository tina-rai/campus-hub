const eventForm =
    document.getElementById("event-form");

const eventMessage =
    document.getElementById("event-message");

const eventList =
    document.getElementById("admin-event-list");

const logoutButton =
    document.getElementById("logout-btn");

let currentUserId = null;
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

        currentUserId = data.user.id;

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
        loadUsers();

    }

})();
// =========================
// ADMIN USER MANAGEMENT
// =========================

const userList =
    document.getElementById("admin-user-list");


async function loadUsers() {

    try {

        const response =
            await fetch("/api/admin/users");

        const data =
            await response.json();

        if (!response.ok) {

            userList.innerHTML =
                `<p>${data.message || "Failed to load users."}</p>`;

            return;
        }

        displayUsers(data.users);

    } catch (error) {

        console.error(error);

        userList.innerHTML =
            "<p>Failed to load users.</p>";
    }
}


function displayUsers(users) {

    userList.innerHTML = "";

    if (!users.length) {

        userList.innerHTML =
            "<p>No users found.</p>";

        return;
    }

    users.forEach(user => {

                const card =
                    document.createElement("div");

                card.className = "admin-user-card";

                const isCurrentUser =
                    user.id === currentUserId;

                card.innerHTML = `
            <div class="admin-user-info">

                <strong>
                    ${user.name}
                </strong>

                <span>
                    ${user.email}
                </span>

                <span class="user-role ${user.role}">
                    ${user.role}
                </span>

            </div>

            <div class="admin-user-actions">

                ${
                    isCurrentUser
                    ?
                    `<span class="current-user-label">
                        You
                    </span>`
                    :
                    user.role === "student"
                    ?
                    `<button
                        class="promote-user-btn"
                        data-id="${user.id}">
                        Make Admin
                    </button>`
                    :
                    `<button
                        class="demote-user-btn"
                        data-id="${user.id}">
                        Remove Admin
                    </button>`
                }

            </div>
        `;

        userList.appendChild(card);
    });


    document
        .querySelectorAll(".promote-user-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                changeUserRole(
                    button.dataset.id,
                    "admin"
                );

            });

        });


    document
        .querySelectorAll(".demote-user-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                changeUserRole(
                    button.dataset.id,
                    "student"
                );

            });

        });
}


async function changeUserRole(userId, role) {

    const action =
        role === "admin"
        ? "promote this user to admin"
        : "remove admin access from this user";

    const confirmed =
        confirm(`Are you sure you want to ${action}?`);

    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/admin/users/${userId}/role`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        role
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Failed to change user role."
            );

            return;
        }


        alert(data.message);

        loadUsers();


    } catch (error) {

        console.error(error);

        alert(
            "Something went wrong."
        );
    }
}