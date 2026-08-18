const searchForm =
    document.getElementById("registration-search-form");

const emailInput =
    document.getElementById("student-email");

const registrationsContainer =
    document.getElementById("my-registrations");


searchForm.addEventListener("submit", async(event) => {

    event.preventDefault();

    const email =
        emailInput.value.trim();

    if (!email) {
        return;
    }

    registrationsContainer.innerHTML =
        "<p>Loading...</p>";

    try {

        const response =
            await fetch(
                `/registrations?email=${encodeURIComponent(email)}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            registrationsContainer.innerHTML =
                `<p>${data.message}</p>`;

            return;
        }

        if (data.registrations.length === 0) {

            registrationsContainer.innerHTML =
                "<p>No registered events found.</p>";

            return;
        }

        registrationsContainer.innerHTML = "";

        data.registrations.forEach((registration) => {

            const card =
                document.createElement("div");

            card.className = "registration-card";

            card.innerHTML = `

                <h3>${registration.title}</h3>

                <p>
                    <strong>Category:</strong>
                    ${registration.category}
                </p>

                <p>
                    📍 ${registration.location}
                </p>

                <p>
                    📅 ${registration.date}
                </p>

                <p>
                    🕐 ${registration.time}
                </p>

            `;

            registrationsContainer.appendChild(card);

        });

    } catch (error) {

        console.error(error);

        registrationsContainer.innerHTML =
            "<p>Failed to load registrations.</p>";

    }

});