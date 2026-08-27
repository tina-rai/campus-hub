const eventForm =
    document.getElementById("event-form");
    const eventMessage =
    document.getElementById("event-message");
const eventList =
    document.getElementById("admin-event-list");

const userList =
    document.getElementById("admin-user-list");

const logoutButton =
    document.getElementById("logout-btn");
    const submitButton =
    document.getElementById("event-submit-btn");
    const cancelEditButton =
    document.getElementById("cancel-edit-btn");

const toast =
    document.getElementById("toast");

const navButtons =
    document.querySelectorAll(".admin-nav-btn");

const quickActionButtons =
    document.querySelectorAll(".quick-action-btn");

const registrationList =
    document.getElementById(
        "admin-registration-list"
    );

let currentUserId = null;
let toastTimer = null;
let editingEventId = null;

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

        const sectionId =
            button.dataset.section;

        showSection(sectionId);

        if (
            sectionId ===
            "registrations-section"
        ) {
            loadAllRegistrations();
        }

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

        if (
            !response.ok ||
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
// TIME HELPERS
// =========================

function convertTo24Hour(hour, minute, period) {

    let hour24 =
        Number(hour);

    if (
        period === "AM" &&
        hour24 === 12
    ) {
        hour24 = 0;
    }

    if (
        period === "PM" &&
        hour24 !== 12
    ) {
        hour24 += 12;
    }

    return `${String(hour24).padStart(2, "0")}:${minute}`;
}


function parseTime(time) {

    if (!time) {
        return null;
    }

    const [
        hourString,
        minuteString
    ] = time.split(":");

    let hour =
        Number(hourString);

    const minute =
        minuteString;

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return {
        hour: String(hour).padStart(2, "0"),
        minute,
        period
    };
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
                    `<p>${data.message || "Failed to load events."}`;
            
                return;
            }
            
            allEvents = data.results || data;
            
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

        const capacity =
            event.capacity === null
                ? "Unlimited"
                : event.capacity;

        const registrationLink =
            event.registration_link;

        card.innerHTML = `

            <span class="event-category">
                ${event.category}
            </span>

            <h3>
                ${event.title}
            </h3>

            <p>
                ${event.description}
            </p>

            <strong>Location:</strong> ${event.location}
<strong>Date:</strong> ${event.date}
<strong>Time:</strong> ${formatDisplayTime(event.time)}
<strong>Capacity:</strong> ${capacity}

            ${
                registrationLink
                ?
                `
                <p class="external-registration-status">
                    🔗 External registration form added
                </p>
                `
                :
                ""
            }

            <div class="admin-actions">

                <button
                    class="edit-event-btn"
                    data-id="${event.id}"
                >
                    Edit
                </button>

                <button
                    class="view-registrations-btn"
                    data-id="${event.id}"
                >
                    View Registrations
                </button>

                <button
                    class="delete-event-btn"
                    data-id="${event.id}"
                >
                    Delete
                </button>

            </div>

            <div
                class="registrations"
                id="registrations-${event.id}"
            ></div>
        `;

        eventList.appendChild(card);
    });


    // Edit buttons

    document
        .querySelectorAll(".edit-event-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const event =
                        events.find(
                            item =>
                                String(item.id) ===
                                String(button.dataset.id)
                        );

                    if (event) {
                        startEditingEvent(event);
                    }
                }
            );

        });


    // Delete buttons

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


    // Registration buttons

    document
        .querySelectorAll(".view-registrations-btn")
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
// FORMAT DISPLAY TIME
// =========================

function formatDisplayTime(time) {

    if (!time) {
        return "";
    }

    const [
        hours,
        minutes
    ] = time
        .split(":")
        .map(Number);

    const period =
        hours >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hours % 12 || 12;

    return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}


// =========================
// START EDITING
// =========================

function startEditingEvent(event) {

    editingEventId =
        event.id;

    document.getElementById("title").value =
        event.title;

    document.getElementById("description").value =
        event.description;

    document.getElementById("category").value =
        event.category;

    document.getElementById("location").value =
        event.location;

    document.getElementById("date").value =
        event.date;

    document.getElementById("capacity").value =
        event.capacity ?? "";

    document.getElementById("registration-link").value =
        event.registration_link ?? "";


    const parsedTime =
        parseTime(event.time);

    if (parsedTime) {

        document.getElementById("event-hour").value =
            parsedTime.hour;

        document.getElementById("event-minute").value =
            parsedTime.minute;

        document.getElementById("event-period").value =
            parsedTime.period;
    }


    submitButton.textContent =
        "Save Changes";

    cancelEditButton.hidden =
        false;

    eventMessage.textContent =
        `Editing "${event.title}"`;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =========================
// CANCEL EDIT
// =========================

cancelEditButton.addEventListener(
    "click",
    () => {

        resetEventForm();

    }
);


function resetEventForm() {

    editingEventId =
        null;

    eventForm.reset();

    submitButton.textContent =
        "Create Event";

    cancelEditButton.hidden =
        true;

    eventMessage.textContent = "";
}


// =========================
// CREATE / UPDATE EVENT
// =========================

eventForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        submitButton.disabled =
            true;

        submitButton.textContent =
            editingEventId
                ? "Saving..."
                : "Creating...";


        const hour =
            document.getElementById(
                "event-hour"
            ).value;

        const minute =
            document.getElementById(
                "event-minute"
            ).value;

        const period =
            document.getElementById(
                "event-period"
            ).value;


        if (
            !hour ||
            !minute ||
            !period
        ) {

            showToast(
                "Please select a valid event time.",
                "error"
            );

            submitButton.disabled =
                false;

            submitButton.textContent =
                editingEventId
                    ? "Save Changes"
                    : "Create Event";

            return;
        }


        const eventTime =
            convertTo24Hour(
                hour,
                minute,
                period
            );


        const capacityValue =
            document.getElementById(
                "capacity"
            ).value.trim();


        const registrationLink =
            document.getElementById(
                "registration-link"
            ).value.trim();


        const eventData = {

            title:
                document
                    .getElementById("title")
                    .value
                    .trim(),

            description:
                document
                    .getElementById("description")
                    .value
                    .trim(),

            category:
                document
                    .getElementById("category")
                    .value,

            location:
                document
                    .getElementById("location")
                    .value
                    .trim(),

            date:
                document
                    .getElementById("date")
                    .value,

            time:
                eventTime,

            capacity:
                capacityValue
                    ? Number(capacityValue)
                    : null,

            registration_link:
                registrationLink || null
        };


        try {

            const url =
                editingEventId
                    ? `/events/${editingEventId}`
                    : "/events";


            const method =
                editingEventId
                    ? "PUT"
                    : "POST";


            const response =
                await fetch(url, {

                    method,

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            eventData
                        )
                });


            const data =
                await response.json();


            if (!response.ok) {

                showToast(
                    data.message ||
                    "Failed to save event.",
                    "error"
                );

                return;
            }


            resetEventForm();


            showToast(
                editingEventId
                    ? "Event updated successfully!"
                    : "Event created successfully!",
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

            submitButton.disabled =
                false;

            if (editingEventId) {
                submitButton.textContent =
                    "Save Changes";
            }
        }

    }
);


// =========================
// DELETE EVENT
// =========================

async function deleteEvent(eventId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this event?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/events/${eventId}`,
                {
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
            "Event deleted successfully.",
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

        displayUsers(data.users);
        allUsers = data.users;

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
// =========================
// ADMIN DASHBOARD SECTION
// =========================
async function loadAllRegistrations() {

    registrationList.innerHTML =
        "<p>Loading registrations...</p>";

    try {

        const response =
            await fetch("/events?limit=100");

        const data =
            await response.json();

        if (!response.ok) {
            registrationList.innerHTML =
                "<p>Failed to load events.</p>";

            return;
        }

        const events =
            data.results || data;

        registrationList.innerHTML = "";

        if (!events.length) {
            registrationList.innerHTML =
                "<p>No events found.</p>";

            return;
        }

        events.forEach(event => {

            const eventContainer =
                document.createElement("div");

            eventContainer.className =
                "admin-registration-event";

                eventContainer.innerHTML = `
                <div class="registration-event-header">
            
                    <h3>${event.title}</h3>
            
                    <span class="registration-count">
                        Loading...
                    </span>
            
                </div>
            
                <div
                    id="admin-registrations-${event.id}"
                >
                    <p>Loading students...</p>
                </div>
            `;

            registrationList.appendChild(
                eventContainer
            );

            loadEventRegistrations(event.id);
        });

    } catch (error) {

        console.error(error);

        registrationList.innerHTML =
            "<p>Failed to load registrations.</p>";
    }
}
async function loadEventRegistrations(eventId) {

    const container =
        document.getElementById(
            `admin-registrations-${eventId}`
        );

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
                "<p>No students registered yet.</p>";

            return;
        }

        const eventCard =
        container.closest(
            ".admin-registration-event"
        );
    
    const countBadge =
        eventCard.querySelector(
            ".registration-count"
        );
    
    countBadge.textContent =
        `${data.count} student${data.count === 1 ? "" : "s"}`;
        
    container.innerHTML = "";

        data.registrations.forEach(
            registration => {

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
            }
        );

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Failed to load registrations.</p>";
    }
}
const dashboardStatCards =
    document.querySelectorAll(".dashboard-stat");

dashboardStatCards.forEach(card => {

    card.addEventListener("click", event => {

        const targetSection =
            card.getAttribute("href");

        if (!targetSection) {
            return;
        }

        event.preventDefault();

        const sectionId =
            targetSection.substring(1);

        showSection(sectionId);

    });

});