async function getCurrentUser() {
    try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error("Failed to get current user:", error);
        return null;
    }
}


async function logout() {
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST"
        });

        if (response.ok) {
            window.location.href = "/";
        }
    } catch (error) {
        console.error("Logout failed:", error);
    }
}


const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");


if (signupForm) {

    signupForm.addEventListener("submit", async(event) => {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("signup-message");

        message.textContent = "Creating account...";

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
                message.textContent = data.message || "Signup failed.";
                return;
            }

            message.textContent = "Account created! Redirecting...";

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

        message.textContent = "Logging in...";

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
                message.textContent =
                    data.message || "Invalid email or password.";
                return;
            }

            message.textContent = "Login successful! Redirecting...";

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