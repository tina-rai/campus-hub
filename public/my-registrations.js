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

    <button
        class="cancel-registration-btn"
        data-registration-id="${registration.registration_id}">
        Cancel Registration
    </button>
`;

            registrationsContainer.appendChild(card);
            const cancelButton =
                card.querySelector(".cancel-registration-btn");

            cancelButton.addEventListener("click", () => {

                cancelRegistration(
                    registration.registration_id
                );

            });

        });

    } catch (error) {

        console.error(error);

        registrationsContainer.innerHTML =
            "<p>Failed to load registrations.</p>";

    }

});
async function cancelRegistration(registrationId) {

    const confirmed =
        confirm("Are you sure you want to cancel this registration?");

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `/registrations/${registrationId}`, {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.message || "Failed to cancel registration.");

            return;
        }

        alert("Registration cancelled successfully.");

        searchForm.dispatchEvent(
            new Event("submit")
        );

    } catch (error) {

        console.error(error);

        alert("Something went wrong.");

    }

}