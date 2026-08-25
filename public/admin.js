const eventForm =
    document.getElementById("event-form");

const eventList =
    document.getElementById("admin-event-list");

const userList =
    document.getElementById("admin-user-list");

const logoutButton =
    document.getElementById("logout-btn");

const toast =
    document.getElementById("toast");

const navButtons =
    document.querySelectorAll(".admin-nav-btn");

const quickActionButtons =
    document.querySelectorAll(".quick-action-btn");

let currentUserId = null;
let toastTimer = null;
let allEvents = [];
let allUsers = [];


// =========================
// TOAST NOTIFICATIONS
// =========================

function showToast(message, type = "success") {

    clearTimeout(toastTimer);

    toast.textContent = message;

    toast.className =
        `admin-toast show ${type}`;

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}


// =========================
// SECTION NAVIGATION
// =========================

function showSection(sectionId) {

    document
        .querySelectorAll(".admin-page-section")
        .forEach(section => {

            section.classList.toggle(
                "active",
                section.id === sectionId
            );

        });


    navButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.section === sectionId
        );

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


navButtons.forEach(button => {

    button.addEventListener("click", () => {

        showSection(
            button.dataset.section
        );

    });

});


quickActionButtons.forEach(button => {

    button.addEventListener("click", () => {

        showSection(
            button.dataset.section
        );

    });

});


// =========================
// ADMIN CHECK
// =========================

async function checkAdmin() {

    try {

        const response =
            await fetch("/api/auth/me");

        const data =
            await response.json();

        if (!response.ok ||
            !data.user ||
            data.user.role !== "admin"
        ) {

            window.location.href =
                "/login.html";

            return false;
        }

        currentUserId =
            data.user.id;

        return true;

    } catch (error) {

        console.error(error);

        window.location.href =
            "/login.html";

        return false;
    }
}


// =========================
// LOAD EVENTS
// =========================

async function loadEvents() {

    try {

        const response =
            await fetch("/events?limit=100");

        const data =
            await response.json();

        if (!response.ok) {

            eventList.innerHTML =
                `<p>${
                    data.message ||
                    "Failed to load events."
                }</p>`;

            return;
        }

        allEvents =
            data.results || data;

        displayEvents(allEvents);

        updateDashboardStats();

    } catch (error) {

        console.error(error);

        eventList.innerHTML =
            "<p>Failed to load events.</p>";
    }
}


// =========================
// DISPLAY EVENTS
// =========================

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

        card.className =
            "admin-event-card";


        card.innerHTML = `

            <div class="admin-event-info">

                <span class="event-category">
                    ${event.category}
                </span>

                <h3>
                    ${event.title}
                </h3>

                <p>
                    ${event.description}
                </p>

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

            </div>


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

            button.addEventListener(
                "click",
                () => {

                    deleteEvent(
                        button.dataset.id
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".view-registrations-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    loadRegistrations(
                        button.dataset.id
                    );

                }
            );

        });
}


// =========================
// CREATE EVENT
// =========================

eventForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const submitButton =
            eventForm.querySelector(
                "button[type='submit']"
            );

        submitButton.disabled = true;

        submitButton.textContent =
            "Creating...";


        // =========================
        // GET EVENT TIME
        // =========================

        const hour =
            document.getElementById("event-hour").value;

        const minute =
            document.getElementById("event-minute").value;

        const period =
            document.getElementById("event-period").value;


        if (!hour || !minute || !period) {

            showToast(
                "Please select a valid event time.",
                "error"
            );

            submitButton.disabled = false;

            submitButton.textContent =
                "Create Event";

            return;
        }


        // Convert 12-hour time to 24-hour time

        let hour24 =
            Number(hour);

        if (period === "AM" && hour24 === 12) {
            hour24 = 0;
        }

        if (period === "PM" && hour24 !== 12) {
            hour24 += 12;
        }


        const eventTime =
            `${String(hour24).padStart(2, "0")}:${minute}`;


        // =========================
        // EVENT DATA
        // =========================
        const capacityValue =
            document.getElementById("capacity").value;
        const eventData = {

            title: document
                .getElementById("title")
                .value
                .trim(),

            description: document
                .getElementById("description")
                .value
                .trim(),

            category: document
                .getElementById("category")
                .value,

            location: document
                .getElementById("location")
                .value
                .trim(),

            date: document
                .getElementById("date")
                .value,

            time: eventTime,

            capacity: capacityValue ?
                Number(capacityValue) :
                null
        };


        // =========================
        // CREATE EVENT
        // =========================

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

                showToast(
                    data.message ||
                    "Failed to create event.",
                    "error"
                );

                return;
            }


            eventForm.reset();

            showToast(
                "Event created successfully!",
                "success"
            );


            await loadEvents();


        } catch (error) {

            console.error(error);

            showToast(
                "Something went wrong.",
                "error"
            );

        } finally {

            submitButton.disabled = false;

            submitButton.textContent =
                "Create Event";
        }

    }
);
// =========================
// DELETE EVENT
// =========================

async function deleteEvent(eventId) {

    const event =
        allEvents.find(
            item =>
            String(item.id) ===
            String(eventId)
        );


    const eventName =
        event ?
        event.title :
        "this event";


    const confirmed =
        confirm(
            `Delete "${eventName}"?\n\n` +
            `This action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/events/${eventId}`, {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            showToast(
                data.message ||
                "Failed to delete event.",
                "error"
            );

            return;
        }


        showToast(
            "Event deleted successfully!",
            "success"
        );


        await loadEvents();


    } catch (error) {

        console.error(error);

        showToast(
            "Something went wrong.",
            "error"
        );
    }
}


// =========================
// REGISTRATIONS
// =========================

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
                `<p>${
                    data.message ||
                    "Failed to load registrations."
                }</p>`;

            return;
        }


        if (!data.registrations.length) {

            container.innerHTML =
                "<p>No registrations yet.</p>";

            return;
        }


        container.innerHTML = `
            <h4>
                Registered Students
                (${data.count})
            </h4>
        `;


        data.registrations.forEach(
            registration => {

                const student =
                    document.createElement(
                        "div"
                    );


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


                container.appendChild(
                    student
                );

            }
        );


    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Failed to load registrations.</p>";
    }
}


// =========================
// USERS
// =========================

async function loadUsers() {

    try {

        const response =
            await fetch(
                "/api/admin/users"
            );


        const data =
            await response.json();


        if (!response.ok) {

            userList.innerHTML =
                `<p>${
                    data.message ||
                    "Failed to load users."
                }</p>`;

            return;
        }


        allUsers =
            data.users || [];

        displayUsers(allUsers);

        updateDashboardStats();


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


                card.className =
                    "admin-user-card";


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

                <span
                    class="user-role ${user.role}">
                    ${user.role}
                </span>

            </div>


            <div
                class="admin-user-actions">

                ${
                    isCurrentUser

                    ?

                    `<span
                        class="current-user-label">
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
        .querySelectorAll(
            ".promote-user-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeUserRole(
                        button.dataset.id,
                        "admin"
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".demote-user-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeUserRole(
                        button.dataset.id,
                        "student"
                    );

                }
            );

        });
}


// =========================
// CHANGE USER ROLE
// =========================

async function changeUserRole(
    userId,
    role
) {

    const action =
        role === "admin"
            ? "promote this user to admin"
            : "remove admin access from this user";


    const confirmed =
        confirm(
            `Are you sure you want to ${action}?`
        );


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
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            role
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            showToast(
                data.message ||
                "Failed to change user role.",
                "error"
            );

            return;
        }


        showToast(
            data.message ||
            "User role updated.",
            "success"
        );


        await loadUsers();


    } catch (error) {

        console.error(error);

        showToast(
            "Something went wrong.",
            "error"
        );
    }
}


// =========================
// DASHBOARD STATS
// =========================

function updateDashboardStats() {

    const usersElement =
        document.getElementById(
            "total-users"
        );

    const eventsElement =
        document.getElementById(
            "total-events"
        );

    if (usersElement) {

        usersElement.textContent =
            allUsers.length;
    }


    if (eventsElement) {

        eventsElement.textContent =
            allEvents.length;
    }
}


// =========================
// LOGOUT
// =========================

logoutButton.addEventListener(
    "click",
    async event => {

        event.preventDefault();


        try {

            await fetch(
                "/api/auth/logout",
                {
                    method: "POST"
                }
            );

        } catch (error) {

            console.error(error);

        }


        window.location.href =
            "/login.html";
    }
);


// =========================
// INITIALIZE
// =========================

(async () => {

    const isAdmin =
        await checkAdmin();


    if (isAdmin) {

        await Promise.all([
            loadEvents(),
            loadUsers()
        ]);

    }

})();