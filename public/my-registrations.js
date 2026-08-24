const registrationsContainer =
    document.getElementById("my-registrations");


async function setupAuthUI() {

    const user = await getCurrentUser();

    const authArea =
        document.getElementById("auth-area");

    const adminLink =
        document.getElementById("admin-link");

    if (!user) {

        registrationsContainer.innerHTML = `
            <div class="empty-state">
                <h3>You are not logged in</h3>
                <p>Log in to see your registered events.</p>

                <a
                    class="auth-button"
                    href="/login.html"
                >
                    Log In
                </a>
            </div>
        `;

        return false;
    }

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
    }

    return true;
}


async function loadRegistrations() {

    registrationsContainer.innerHTML =
        "<p>Loading your registrations...</p>";

    try {

        const response =
            await fetch("/registrations");

        const data =
            await response.json();

        if (!response.ok) {

            registrationsContainer.innerHTML =
                `<p>${data.message || "Failed to load registrations."}</p>`;

            return;
        }

        if (data.registrations.length === 0) {

            registrationsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No registrations yet</h3>
                    <p>Browse upcoming events and register for one.</p>

                    <a
                        class="auth-button"
                        href="/"
                    >
                        Browse Events
                    </a>
                </div>
            `;

            return;
        }

        registrationsContainer.innerHTML = "";

        data.registrations.forEach(registration => {

            const card =
                document.createElement("div");

            card.className = "registration-card";

            card.innerHTML = `
                <h3>${registration.title}</h3>

                <p>
                    <strong>Category:</strong>
                    ${registration.category}
                </p>

                <p>📍 ${registration.location}</p>

                <p>📅 ${registration.date}</p>

                <p>🕐 ${registration.time}</p>

                <p>
                    Registered on:
                    ${new Date(
                        registration.registered_at
                    ).toLocaleString()}
                </p>

                <button
                    class="cancel-registration-btn"
                    data-registration-id="${registration.id}"
                >
                    Cancel Registration
                </button>
            `;

            registrationsContainer.appendChild(card);

            card
                .querySelector(".cancel-registration-btn")
                .addEventListener("click", () => {

                    cancelRegistration(
                        registration.id
                    );

                });

        });

    } catch (error) {

        console.error(error);

        registrationsContainer.innerHTML =
            "<p>Failed to load registrations.</p>";
    }
}


async function cancelRegistration(registrationId) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this registration?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/registrations/${registrationId}`, {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Failed to cancel registration."
            );

            return;
        }

        await loadRegistrations();

    } catch (error) {

        console.error(error);

        alert(
            "Something went wrong."
        );
    }
}


async function initialize() {

    const authenticated =
        await setupAuthUI();

    if (authenticated) {
        await loadRegistrations();
    }
}


initialize();