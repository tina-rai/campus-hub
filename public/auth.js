const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");

if (signupForm) {
    signupForm.addEventListener("submit", async(event) => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("signup-message");

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                message.textContent = data.message;
                return;
            }

            window.location.href = "/";
        } catch (error) {
            console.error(error);

            message.textContent =
                "Something went wrong. Please try again.";
        }
    });
}


if (loginForm) {
    loginForm.addEventListener("submit", async(event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("login-message");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                message.textContent = data.message;
                return;
            }

            if (data.user.role === "admin") {
                window.location.href = "/admin.html";
            } else {
                window.location.href = "/";
            }
        } catch (error) {
            console.error(error);

            message.textContent =
                "Something went wrong. Please try again.";
        }
    });
}