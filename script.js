/* ================================================================
   LOCALEASE - FRONTEND JAVASCRIPT
   Backend: Node.js + Express + MongoDB
   Authentication: JWT

   Backend URL:
   http://localhost:5000

   Integrated APIs:
   /api/auth
   /api/notifications
   /api/reviews
================================================================ */


/* ================================================================
   GLOBAL API CONFIGURATION
================================================================ */

const API_BASE_URL = "http://localhost:5000/api";

const TOKEN_KEY = "localeaseToken";
const USER_KEY = "localeaseUser";
const CURRENT_BOOKING_KEY = "localeaseCurrentBooking";
const SELECTED_SERVICE_KEY = "localeaseSelectedService";
const SELECTED_PROVIDER_KEY = "localeaseSelectedProvider";


/* ================================================================
   API RESPONSE HANDLER
   Validates the server response and returns parsed JSON data.
================================================================ */

async function getApiResponse(response) {

    let data = null;

    try {

        data = await response.json();

    } catch (error) {

        console.error(
            "Invalid JSON response:",
            error
        );

        const customError = new Error(
            "Invalid response from server."
        );

        customError.status = response.status;

        throw customError;
    }


    if (!response.ok) {

        const error = new Error(
            data && data.message
                ? data.message
                : `Request failed with status ${response.status}`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }


    return data;
}


/* ================================================================
   AUTHENTICATION STORAGE HELPERS
================================================================ */

function getToken() {

    return localStorage.getItem(
        TOKEN_KEY
    );
}


function getStoredUser() {

    try {

        const user = localStorage.getItem(
            USER_KEY
        );

        return user
            ? JSON.parse(user)
            : null;

    } catch (error) {

        console.error(
            "Unable to read stored user:",
            error
        );

        return null;
    }
}


function saveAuthData(token, user) {

    if (token) {

        localStorage.setItem(
            TOKEN_KEY,
            token
        );
    }


    if (user) {

        localStorage.setItem(
            USER_KEY,
            JSON.stringify(user)
        );
    }
}


function clearAuthData() {

    localStorage.removeItem(
        TOKEN_KEY
    );

    localStorage.removeItem(
        USER_KEY
    );
}


/* ================================================================
   GLOBAL PAGE AUTH GUARD
   Runs on every page that loads this script.
   Public pages remain accessible; protected pages require a valid
   local auth session. Role-specific admin/provider pages are also
   blocked for the wrong role.
================================================================ */

(function enforcePageAuthGuard() {

    const path =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const publicPages = new Set([
        "",
        "index.html",
        "login.html",
        "signup.html",
        "services.html",
        "service-details.html",
        "provider.html",
        "about.html",
        "contact.html",
        "404.html"
    ]);

    if (publicPages.has(path)) {
        return;
    }

    const token =
        localStorage.getItem(TOKEN_KEY);

    let user = null;

    try {
        user = JSON.parse(
            localStorage.getItem(USER_KEY) || "null"
        );
    } catch (error) {
        user = null;
    }

    if (!token || !user || !user.role) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.replace("login.html");
        return;
    }

    const adminPages = new Set([
        "admin-dashboard.html",
        "admin-users.html",
        "admin-bookings.html",
        "admin-services.html",
        "admin-reviews.html"
    ]);

    const providerPages = new Set([
        "provider-dashboard.html",
        "provider-services.html",
        "provider-booking-history.html"
    ]);

    if (adminPages.has(path) && user.role !== "admin") {
        window.location.replace("dashboard.html");
        return;
    }

    if (providerPages.has(path) && user.role !== "provider") {
        window.location.replace("dashboard.html");
        return;
    }

})();



/* ================================================================
   LOGOUT USER
   Clears authentication data and returns the user to the login page.
================================================================ */

function logoutUser() {

    clearAuthData();

    window.location.href =
        "login.html";
}


/* ================================================================
   AUTHORIZATION HEADER
   Adds the JWT token to authenticated API requests.
================================================================ */

function getAuthHeaders() {

    const token = getToken();

    const headers = {
        "Content-Type": "application/json"
    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }


    return headers;
}


/* ================================================================
   GENERIC API REQUEST
   Centralizes fetch configuration and API error handling.
================================================================ */

async function apiRequest(
    endpoint,
    options = {}
) {

    const url =
        API_BASE_URL + endpoint;


    const requestOptions = {
        ...options,

        headers: {
            ...getAuthHeaders(),
            ...(options.headers || {})
        }
    };


    try {

        const response =
            await fetch(
                url,
                requestOptions
            );


        return await getApiResponse(
            response
        );

    } catch (error) {

        console.error(
            `API request failed: ${endpoint}`,
            error
        );

        throw error;
    }
}


/* ================================================================
   HTML ESCAPE HELPER
   Prevents dynamic values from being inserted as raw HTML.
================================================================ */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ================================================================
   DATE FORMATTER
================================================================ */

function formatDate(dateValue) {

    if (!dateValue) {

        return "N/A";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(dateValue);
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* ================================================================
   DATE AND TIME FORMATTER
================================================================ */

function formatDateTime(dateValue) {

    if (!dateValue) {

        return "N/A";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(dateValue);
    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* ================================================================
   LOGIN REQUIREMENT
   Redirects unauthenticated users to the login page.
================================================================ */

function requireLogin() {

    const token =
        getToken();

    const user =
        getStoredUser();


    if (
        !token ||
        !user
    ) {

        alert(
            "Please login to continue."
        );

        window.location.href =
            "login.html";

        return false;
    }


    return true;
}


/* ================================================================
   UNAUTHORIZED SESSION HANDLER
   Clears authentication data when the session expires.
================================================================ */

function handleUnauthorized() {

    clearAuthData();

    alert(
        "Your session has expired. Please login again."
    );

    window.location.href =
        "login.html";
}


/* ================================================================
   POST-LOGIN REDIRECTION
   Sends users to the appropriate dashboard based on role.
================================================================ */

function redirectAfterLogin(user) {

    if (!user) {

        window.location.href =
            "index.html";

        return;
    }


    if (
        user.role === "admin"
    ) {

        window.location.href =
            "admin-dashboard.html";

        return;
    }


    if (
        user.role === "provider"
    ) {

        window.location.href =
            "provider-dashboard.html";

        return;
    }


    window.location.href =
        "dashboard.html";
}


/* ================================================================
   LOGIN PAGE
================================================================ */

const loginForm =
    document.querySelector(
        ".login-form"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const emailElement =
                document.getElementById(
                    "email"
                );


            const passwordElement =
                document.getElementById(
                    "password"
                );


            if (
                !emailElement ||
                !passwordElement
            ) {

                alert(
                    "Login form fields are missing."
                );

                return;
            }


            const email =
                emailElement.value
                    .trim()
                    .toLowerCase();


            const password =
                passwordElement.value;


            if (
                !email ||
                !password
            ) {

                alert(
                    "Please enter email and password."
                );

                return;
            }


            const loginButton =
                loginForm.querySelector(
                    'button[type="submit"]'
                );


            const originalButtonText =
                loginButton
                    ? loginButton.textContent
                    : "Login";


            if (loginButton) {

                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "Logging in...";
            }


            try {

                const response =
                    await fetch(
                        API_BASE_URL + "/auth/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email,
                                    password
                                })
                        }
                    );


                const data =
                    await getApiResponse(
                        response
                    );


                if (
                    !data.success ||
                    !data.token ||
                    !data.user
                ) {

                    throw new Error(
                        "Invalid login response from server."
                    );
                }


                saveAuthData(
                    data.token,
                    data.user
                );


                alert(
                    "Login successful! Welcome to LocalEase."
                );


                redirectAfterLogin(
                    data.user
                );

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                if (
                    error.status === 403
                ) {

                    alert(
                        error.message ||
                        "Your account is inactive."
                    );

                    return;
                }


                alert(
                    error.message ||
                    "Unable to login. Please try again."
                );

            } finally {

                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        originalButtonText;
                }
            }

        }
    );
}


/* ================================================================
   FORGOT PASSWORD
================================================================ */

const forgotPasswordLink =
    document.querySelector(
        '.login-options a[href="#"]'
    );


if (forgotPasswordLink) {

    forgotPasswordLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            alert(
                "Password reset through email verification is not configured yet.\n\n" +
                "For security, your password cannot be reset using email alone."
            );

        }
    );
}


/* ================================================================
   SIGNUP PAGE
================================================================ */

const signupForm =
    document.querySelector(
        ".signup-form"
    );


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const nameElement =
                document.getElementById(
                    "name"
                );


            const emailElement =
                document.getElementById(
                    "email"
                );


            const phoneElement =
                document.getElementById(
                    "phone"
                );


            const locationInput =
                document.getElementById(
                    "location"
                );


            const passwordElement =
                document.getElementById(
                    "password"
                );


            const confirmPasswordElement =
                document.getElementById(
                    "confirm-password"
                );


            const accountTypeElement =
                document.getElementById(
                    "account-type"
                );


            if (
                !nameElement ||
                !emailElement ||
                !phoneElement ||
                !passwordElement ||
                !confirmPasswordElement ||
                !accountTypeElement
            ) {

                alert(
                    "Signup form fields are missing."
                );

                return;
            }


            const name =
                nameElement.value.trim();


            const email =
                emailElement.value
                    .trim()
                    .toLowerCase();


            const phone =
            phoneElement.value.trim();
            
            const location =
            locationInput
            ? locationInput.value.trim()
            : "";
            
            const password =
            passwordElement.value;


            const confirmPassword =
                confirmPasswordElement.value;


            const accountType =
                accountTypeElement.value;


            const termsCheckbox =
                document.querySelector(
                    'input[name="terms"]'
                );


            /* ----------------------------------------------------
               BASIC FORM VALIDATION
            ---------------------------------------------------- */

            if (
                !name ||
                !email ||
                !phone ||
                !password ||
                !confirmPassword ||
                !accountType
            ) {

                alert(
                    "Please fill in all required fields."
                );

                return;
            }


            /* ----------------------------------------------------
               LOCATION VALIDATION
            ---------------------------------------------------- */

            if (
                locationInput &&
                !locationInput.value.trim()
            ) {

                alert(
                    "Please enter your location."
                );

                locationInput.focus();

                return;
            }


            /* ----------------------------------------------------
               PASSWORD VALIDATION
            ---------------------------------------------------- */

            if (
                password.length < 6
            ) {

                alert(
                    "Password must be at least 6 characters."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match!"
                );

                return;
            }


            /* ----------------------------------------------------
               TERMS AND CONDITIONS VALIDATION
            ---------------------------------------------------- */

            if (
                termsCheckbox &&
                !termsCheckbox.checked
            ) {

                alert(
                    "Please agree to the Terms & Conditions."
                );

                return;
            }


            /* ----------------------------------------------------
               PHONE NUMBER VALIDATION
            ---------------------------------------------------- */

            const phonePattern =
                /^[0-9+\-\s()]{10,15}$/;


            if (
                !phonePattern.test(
                    phone
                )
            ) {

                alert(
                    "Please enter a valid phone number."
                );

                return;
            }


            /* ----------------------------------------------------
               SUBMIT BUTTON STATE
            ---------------------------------------------------- */

            const signupButton =
                signupForm.querySelector(
                    'button[type="submit"]'
                );


            const originalButtonText =
                signupButton
                    ? signupButton.textContent
                    : "Create Account";


            if (signupButton) {

                signupButton.disabled =
                    true;

                signupButton.textContent =
                    "Creating Account...";
            }


            try {

                /*
                 * The current signup endpoint creates
                 * standard customer accounts.
                 *
                 * The selected account type is therefore
                 * not sent to the current backend endpoint.
                 */

                const response =
    await fetch(
        API_BASE_URL +
        "/auth/signup",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify({
                    name,
                    email,
                    phone,
                    location,
                    password
                })
        }
    );


                const data =
                    await getApiResponse(
                        response
                    );


                if (!data.success) {

                    throw new Error(
                        data.message ||
                        "Account creation failed."
                    );
                }


                alert(
                    "Account created successfully!\n\n" +
                    "Welcome to LocalEase, " +
                    name +
                    "!"
                );


                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Signup error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to create account. Please try again."
                );

            } finally {

                if (signupButton) {

                    signupButton.disabled =
                        false;

                    signupButton.textContent =
                        originalButtonText;
                }
            }

        }
    );
}


/* ================================================================
   PROVIDER REGISTRATION FORM
================================================================ */

const providerForm =
    document.querySelector(
        ".provider-form"
    );


if (providerForm) {

    providerForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const providerNameElement =
                document.getElementById(
                    "provider-name"
                );


            const providerPhoneElement =
                document.getElementById(
                    "provider-phone"
                );


            const providerEmailElement =
                document.getElementById(
                    "provider-email"
                );


            const providerServiceElement =
                document.getElementById(
                    "provider-service"
                );


            const experienceElement =
                document.getElementById(
                    "experience"
                );


            const priceElement =
                document.getElementById(
                    "price"
                );


            const descriptionElement =
                document.getElementById(
                    "description"
                );


            const providerName =
                providerNameElement
                    ? providerNameElement.value.trim()
                    : "";


            const providerPhone =
                providerPhoneElement
                    ? providerPhoneElement.value.trim()
                    : "";


            const providerEmail =
                providerEmailElement
                    ? providerEmailElement.value.trim()
                    : "";


            const providerService =
                providerServiceElement
                    ? providerServiceElement.value
                    : "";


            const experience =
                experienceElement
                    ? experienceElement.value
                    : "";


            const price =
                priceElement
                    ? priceElement.value
                    : "";


            const description =
                descriptionElement
                    ? descriptionElement.value.trim()
                    : "";


            const providerTerms =
                document.querySelector(
                    'input[name="provider-terms"]'
                );


            /* ----------------------------------------------------
               SERVICE CATEGORY VALIDATION
            ---------------------------------------------------- */

            if (!providerService) {

                alert(
                    "Please select your service category."
                );

                return;
            }


            /* ----------------------------------------------------
               EXPERIENCE VALIDATION
            ---------------------------------------------------- */

            if (
                experience !== "" &&
                Number(experience) < 0
            ) {

                alert(
                    "Experience cannot be negative."
                );

                return;
            }


            /* ----------------------------------------------------
               PRICE VALIDATION
            ---------------------------------------------------- */

            if (
                price !== "" &&
                Number(price) < 0
            ) {

                alert(
                    "Starting price cannot be negative."
                );

                return;
            }


            /* ----------------------------------------------------
   TERMS AND CONDITIONS VALIDATION
---------------------------------------------------- */

if (
    providerTerms &&
    !providerTerms.checked
) {

    alert(
        "Please agree to the LocalEase Terms & Conditions."
    );

    return;
}

}
);
}

/* ================================================================
   PROFILE PAGE
================================================================ */

const profilePage =
    document.querySelector(
        ".profile-card"
    ) ||
    document.getElementById(
        "profile-card"
    ) ||
    document.getElementById(
        "profile-name"
    );


if (profilePage) {

    (async function initializeProfilePage() {

        try {

            /*
            * Render cached user data immediately when available.
            * The API response below remains the source of truth.
            */
            let cachedUser = null;

            try {

                const cachedValue =
                    localStorage.getItem(
                        USER_KEY
                    );

                if (cachedValue) {
                    cachedUser =
                        JSON.parse(
                            cachedValue
                        );
                }

            } catch (cacheError) {

                console.warn(
                    "Unable to read cached profile:",
                    cacheError
                );
                }


            if (cachedUser) {
                renderProfile(cachedUser);
            }


            const user =
                await loadMyProfile();


            if (user) {
                renderProfile(user);
                await loadProfileActivity(user);
            }

        } catch (error) {

            console.error(
                "Profile page initialization error:",
                error
            );

        }

    })();


    const editButton =
        document.querySelector(
            ".edit-profile-btn"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            handleProfileEdit
        );
    }


    const changePasswordLink =
        document.querySelector(
            ".change-password-btn"
        );


    if (changePasswordLink) {

        changePasswordLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                handleChangePassword();

            }
        );
    }


    const notificationSettingsButton =
        document.querySelector(
            ".notification-settings-btn"
        );


    if (notificationSettingsButton) {

        notificationSettingsButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "notifications.html";

            }
        );
    }


    const logoutLink =
        document.querySelector(
            ".logout-btn"
        );


    if (logoutLink) {

        logoutLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (confirmLogout) {

                    logoutUser();
                }

            }
        );
    }

}


/* ================================================================
   LOAD PROFILE DATA
   Retrieves the authenticated user's profile from the backend.
================================================================ */

async function loadMyProfile() {

    if (typeof getToken !== "function") {
        return null;
    }


    const token =
        getToken();


    if (!token) {

        console.error(
            "Authentication token not found."
        );

        return null;
    }


    try {

        const data =
            await apiRequest(
                "/auth/me",
                {
                    method: "GET"
                }
            );


        const user =
            data?.user ||
            data?.data?.user ||
            null;


        if (!user) {

            throw new Error(
                data?.message ||
                "Unable to load profile."
            );
        }


        localStorage.setItem(
            USER_KEY,
            JSON.stringify(user)
        );


        console.log(
            "My profile:",
            user
        );


        renderProfile(user);

        return user;

    }

    catch (error) {

        console.error(
            "Load profile error:",
            error
        );


        if (
            error &&
            error.status === 401
        ) {

            handleUnauthorized();

        }


        return null;
    }
}


/* ================================================================
   RENDER PROFILE DATA
================================================================ */

function renderProfile(user) {

    const safeUser =
        user || {};


    const name =
        safeUser.name ||
        "Not provided";

    const email =
        safeUser.email ||
        "Not provided";

    const phone =
        safeUser.phone ||
        "Not provided";

    const location =
        safeUser.location ||
        safeUser.address ||
        safeUser.serviceLocation ||
        "Not provided";

    const role =
        String(
            safeUser.role || "customer"
        ).toLowerCase();

    const accountType =
        role === "provider"
            ? "Service Provider"
            : role === "admin"
                ? "Administrator"
                : "Customer";

    const memberSinceValue =
        safeUser.createdAt ||
        safeUser.created_at ||
        safeUser.joinedAt ||
        safeUser.dateCreated;

    const memberSince =
        memberSinceValue
            ? new Date(memberSinceValue).toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )
            : "Not available";


    const nameElement =
        document.getElementById(
            "profile-name"
        );

    const emailElement =
        document.getElementById(
            "profile-email"
        );

    const phoneElement =
        document.getElementById(
            "profile-phone"
        );

    const locationElement =
        document.getElementById(
            "profile-location"
        );

    const roleElement =
        document.getElementById(
            "profile-role"
        );

    const memberSinceElement =
        document.getElementById(
            "profile-member-since"
        );


    if (nameElement && !nameElement.matches("input")) {
        nameElement.textContent = name;
    }

    if (emailElement && !emailElement.matches("input")) {
        emailElement.textContent = email;
    }

    if (phoneElement && !phoneElement.matches("input")) {
        phoneElement.textContent = phone;
    }

    if (locationElement && !locationElement.matches("input")) {
        locationElement.textContent = location;
    }

    if (roleElement && !roleElement.matches("input")) {
        roleElement.textContent = accountType;
    }

    if (memberSinceElement && !memberSinceElement.matches("input")) {
        memberSinceElement.textContent = memberSince;
    }


    const profileTitle =
        document.querySelector(
            ".profile-title h2"
        );


    if (profileTitle) {

        profileTitle.textContent =
            safeUser.name ||
            "LocalEase User";
    }


    const profileSubtitle =
        document.querySelector(
            ".profile-title p"
        );


    if (profileSubtitle) {

        profileSubtitle.textContent =
            role === "provider"
                ? "LocalEase Service Provider"
                : role === "admin"
                    ? "LocalEase Administrator"
                    : "LocalEase Customer";
    }


    const avatar =
        document.querySelector(
            ".profile-avatar"
        );


    if (avatar) {

        const initials =
            String(
                safeUser.name || "User"
            )
                .split(" ")
                .filter(Boolean)
                .map(
                    word =>
                        word.charAt(0)
                )
                .join("")
                .substring(0, 2)
                .toUpperCase();


        avatar.textContent =
            initials ||
            "U";
    }
}



/* ================================================================
   LOAD PROFILE ACTIVITY
   Loads booking statistics for the authenticated user.
============================================================== */

async function loadProfileActivity(user) {

    if (!user) {
        return;
    }


    try {

        const endpoint =
            user.role === "provider"
                ? "/bookings/provider/my-bookings"
                : "/bookings/my-bookings";


        const data =
            await apiRequest(
                endpoint,
                {
                    method: "GET"
                }
            );


        const bookings =
            Array.isArray(data?.bookings)
                ? data.bookings
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data)
                        ? data
                        : [];


        const totalBookings =
            bookings.length;

        const activeBookings =
            bookings.filter(
                function (booking) {

                    const status =
                        normalizeBookingStatus(
                            booking?.status
                        );

                    return (
                        status === "pending" ||
                        status === "confirmed" ||
                        status === "in-progress"
                    );
                }
            ).length;

        const completedBookings =
            bookings.filter(
                function (booking) {

                    return (
                        normalizeBookingStatus(
                            booking?.status
                        ) === "completed"
                    );
                }
            ).length;


        const totalElement =
            document.getElementById(
                "profile-total-bookings"
            );

        const activeElement =
            document.getElementById(
                "profile-active-bookings"
            );

        const completedElement =
            document.getElementById(
                "profile-completed-bookings"
            );


        if (totalElement) {
            totalElement.textContent =
                totalBookings;
        }

        if (activeElement) {
            activeElement.textContent =
                activeBookings;
        }

        if (completedElement) {
            completedElement.textContent =
                completedBookings;
        }


        renderRecentProfileBooking(
            bookings
        );

    } catch (error) {

        console.error(
            "Load profile activity error:",
            error
        );


        if (
            error &&
            error.status === 401
        ) {

            handleUnauthorized();

            return;
        }


        const totalElement =
            document.getElementById(
                "profile-total-bookings"
            );

        const activeElement =
            document.getElementById(
                "profile-active-bookings"
            );

        const completedElement =
            document.getElementById(
                "profile-completed-bookings"
            );


        if (totalElement) {
            totalElement.textContent = "0";
        }

        if (activeElement) {
            activeElement.textContent = "0";
        }

        if (completedElement) {
            completedElement.textContent = "0";
        }


        renderRecentProfileBooking([]);
    }
}


function renderRecentProfileBooking(bookings) {

    const container =
        document.getElementById(
            "profile-recent-booking"
        );

    if (!container) {
        return;
    }


    const safeBookings =
        Array.isArray(bookings)
            ? bookings
            : [];


    if (safeBookings.length === 0) {

        container.innerHTML =
            "<p>No booking activity yet.</p>";

        return;
    }


    const sortedBookings =
        [...safeBookings].sort(
            function (first, second) {

                const firstDate =
                    new Date(
                        first?.createdAt ||
                        first?.updatedAt ||
                        first?.bookingDate ||
                        0
                    ).getTime();

                const secondDate =
                    new Date(
                        second?.createdAt ||
                        second?.updatedAt ||
                        second?.bookingDate ||
                        0
                    ).getTime();

                return secondDate - firstDate;
            }
        );


    const booking =
        sortedBookings[0];


    const serviceName =
        booking?.service?.name ||
        booking?.serviceName ||
        booking?.service?.title ||
        "Service";

    const providerName =
        booking?.provider?.name ||
        booking?.providerName ||
        "Not Assigned";

    const rawBookingDate =
        booking?.bookingDate ||
        booking?.preferredDate ||
        booking?.date ||
        "";

    const bookingDateObject =
        rawBookingDate
            ? new Date(rawBookingDate)
            : null;

    const bookingDate =
        rawBookingDate;

    const bookingTime =
        booking?.bookingTime ||
        booking?.preferredTime ||
        (
            bookingDateObject &&
            !Number.isNaN(
                bookingDateObject.getTime()
            )
                ? bookingDateObject.toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )
                : "Not provided"
        );

    const amount =
        booking?.totalPrice ??
        booking?.totalAmount ??
        booking?.amount ??
        booking?.price ??
        booking?.service?.price ??
        "0";

    const status =
        normalizeBookingStatus(
            booking?.status
        );

    const statusLabel =
        status
            ? status.charAt(0).toUpperCase() +
              status.slice(1)
            : "Unknown";

    const safeServiceName =
        typeof escapeHtml === "function"
            ? escapeHtml(String(serviceName))
            : String(serviceName);

    const safeProviderName =
        typeof escapeHtml === "function"
            ? escapeHtml(String(providerName))
            : String(providerName);

    const safeBookingTime =
        typeof escapeHtml === "function"
            ? escapeHtml(String(bookingTime))
            : String(bookingTime);

    const safeStatus =
        typeof escapeHtml === "function"
            ? escapeHtml(String(statusLabel))
            : String(statusLabel);

    const safeAmount =
        typeof escapeHtml === "function"
            ? escapeHtml(String(amount))
            : String(amount);

    const formattedDate =
        bookingDate
            ? new Date(bookingDate).toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )
            : "Not provided";


    container.innerHTML = `
        <article class="recent-booking-card-content">

            <h3>
                ${safeServiceName}
            </h3>

            <p>
                <strong>Provider:</strong>
                ${safeProviderName}
            </p>

            <p>
                <strong>Date:</strong>
                ${escapeHtml(String(formattedDate))}
            </p>

            <p>
                <strong>Time:</strong>
                ${safeBookingTime}
            </p>

            <p>
                <strong>Amount:</strong>
                ₹${safeAmount}
            </p>

            <p>
                <strong>Status:</strong>
                ${safeStatus}
            </p>

        </article>
    `;
}



/* ================================================================
   EDIT / SAVE PROFILE
================================================================ */

async function handleProfileEdit() {

    if (!requireLogin()) {

        return;
    }


    const editButton =
        document.querySelector(
            ".edit-profile-btn"
        );


    if (!editButton) {

        return;
    }


    const isEditing =
        editButton.dataset.editing === "true";


    if (!isEditing) {

        startProfileEditing();

        return;
    }


    await saveProfile();
}


/* ================================================================
   START PROFILE EDITING
================================================================ */

function startProfileEditing() {

    const editButton =
        document.querySelector(
            ".edit-profile-btn"
        );


    const profileDetails =
        document.querySelectorAll(
            ".profile-detail"
        );


    profileDetails.forEach(
        function (detail) {

            const labelElement =
                detail.querySelector(
                    "span"
                );


            const valueElement =
                detail.querySelector(
                    "strong"
                );


            if (
                !labelElement ||
                !valueElement
            ) {

                return;
            }


            const label =
                labelElement.textContent
                    .trim()
                    .toLowerCase();


            if (
                label !== "full name" &&
                label !== "phone number"
            ) {

                return;
            }


            const input =
                document.createElement(
                    "input"
                );


            input.type =
                "text";


            input.value =
                valueElement.textContent.trim();


            input.className =
                "profile-edit-input";


            input.required =
                true;


            valueElement.replaceWith(
                input
            );

        }
    );


    if (editButton) {

        editButton.textContent =
            "Save Profile ✓";

        editButton.dataset.editing =
            "true";
    }
}



/* ================================================================
   SAVE PROFILE
   Sends updated profile information to the backend.
================================================================ */

async function saveProfile() {

    const editButton =
        document.querySelector(
            ".edit-profile-btn"
        );


    if (!editButton) {
        return;
    }


    const profileInputs =
        document.querySelectorAll(
            ".profile-edit-input"
        );


    let name = "";
    let phone = "";


    profileInputs.forEach(
        function (input) {

            const parent =
                input.parentElement;

            if (!parent) {
                return;
            }

            const labelElement =
                parent.querySelector(
                    "span"
                );

            if (!labelElement) {
                return;
            }

            const label =
                labelElement.textContent
                    .trim()
                    .toLowerCase();

            if (label === "full name") {
                name = input.value.trim();
            }

            else if (label === "phone number") {
                phone = input.value.trim();
            }
        }
    );


    if (!name || !phone) {

        alert(
            "Name and phone are required."
        );

        return;
    }


    const phonePattern =
        /^[0-9+\-\s()]{10,15}$/;


    if (!phonePattern.test(phone)) {

        alert(
            "Please enter a valid phone number."
        );

        return;
    }


    editButton.disabled = true;
    editButton.textContent = "Saving...";


    try {

        const data =
            await apiRequest(
                "/auth/me",
                {
                    method: "PUT",
                    body: JSON.stringify({
                        name,
                        phone
                    })
                }
            );


        if (!data || !data.success || !data.user) {

            throw new Error(
                data?.message ||
                "Unable to update profile."
            );
        }


        localStorage.setItem(
            USER_KEY,
            JSON.stringify(data.user)
        );


        profileInputs.forEach(
            function (input) {

                const parent =
                    input.parentElement;

                if (!parent) {
                    return;
                }

                const labelElement =
                    parent.querySelector(
                        "span"
                    );

                if (!labelElement) {
                    return;
                }

                const valueElement =
                    document.createElement(
                        "strong"
                    );

                const label =
                    labelElement.textContent
                        .trim()
                        .toLowerCase();

                valueElement.textContent =
                    label === "full name"
                        ? data.user.name || ""
                        : data.user.phone || "";

                input.replaceWith(
                    valueElement
                );
            }
        );


        renderProfile(
            data.user
        );

        editButton.dataset.editing = "false";
        editButton.disabled = false;
        editButton.textContent = "Edit Profile";


        alert(
            "Profile updated successfully!"
        );

    } catch (error) {

        console.error(
            "Save profile error:",
            error
        );

        if (error.status === 401) {
            handleUnauthorized();
            return;
        }

        alert(
            error.message ||
            "Unable to update profile."
        );

        editButton.disabled = false;
        editButton.textContent = "Edit Profile";
    }
}






/* ================================================================
   CHANGE PASSWORD
================================================================ */

async function handleChangePassword() {

    if (!requireLogin()) {

        return;
    }


    const currentPassword =
        prompt(
            "Enter your current password:"
        );


    if (
        currentPassword === null
    ) {

        return;
    }


    if (!currentPassword) {

        alert(
            "Current password is required."
        );

        return;
    }


    const newPassword =
        prompt(
            "Enter your new password:"
        );


    if (
        newPassword === null
    ) {

        return;
    }


    if (!newPassword) {

        alert(
            "New password is required."
        );

        return;
    }


    if (
        newPassword.length < 6
    ) {

        alert(
            "New password must be at least 6 characters."
        );

        return;
    }


    const confirmPassword =
        prompt(
            "Confirm your new password:"
        );


    if (
        confirmPassword === null
    ) {

        return;
    }


    if (
        newPassword !==
        confirmPassword
    ) {

        alert(
            "New passwords do not match."
        );

        return;
    }


    try {

        const data =
            await apiRequest(
                "/auth/change-password",
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            currentPassword,
                            newPassword
                        })
                }
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to change password."
            );
        }


        alert(
            "Password changed successfully!"
        );

    } catch (error) {

        console.error(
            "Change password error:",
            error
        );


        if (
            error.status === 401
        ) {

            alert(
                error.message ||
                "Current password is incorrect."
            );

            return;
        }


        alert(
            error.message ||
            "Unable to change password."
        );
    }
}


/* ================================================================
   DASHBOARD PAGE
================================================================ */

const dashboardPage =
    document.querySelector(
        ".dashboard"
    );


if (dashboardPage) {

    loadDashboardData();
}


/* ================================================================
   LOAD DASHBOARD DATA
   Determines the logged-in user's role and loads
   the corresponding dashboard information.
================================================================ */

async function loadDashboardData() {

    if (!requireLogin()) {

        return;
    }


    try {

        const user =
            getStoredUser();


        if (!user) {

            return;
        }


        const welcomeTitle =
            document.querySelector(
                ".dashboard-welcome h1"
            );


        if (welcomeTitle) {

            welcomeTitle.textContent =
                `Welcome back, ${user.name || "User"}!`;
        }


        const dashboardSubtitle =
            document.querySelector(
                ".dashboard-welcome p"
            );


        if (dashboardSubtitle) {

            dashboardSubtitle.textContent =
                user.role === "provider"
                    ? "Manage your services and bookings"
                    : user.role === "admin"
                        ? "Manage LocalEase platform"
                        : "Manage your bookings and discover local services";
        }


        if (
            user.role === "provider"
        ) {

            await loadProviderDashboard();

            return;
        }


        if (
            user.role === "admin"
        ) {

            /*
             * Administrators use a dedicated dashboard,
             * so customer dashboard data is not loaded here.
             */

            return;
        }


        await loadCustomerDashboard();

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        if (
            error.status === 401
        ) {

            handleUnauthorized();

            return;
        }


        alert(
            error.message ||
            "Unable to load dashboard."
        );
    }
}


/* ================================================================
   CUSTOMER DASHBOARD
================================================================ */

async function loadCustomerDashboard() {

    try {

        const bookingData =
            await apiRequest(
                "/bookings/my-bookings",
                {
                    method: "GET"
                }
            );


        const bookings =
            bookingData.bookings ||
            [];


        updateCustomerDashboardStats(
            bookings
        );


        renderRecentBookings(
            bookings
        );

    } catch (error) {

        console.error(
            "Customer dashboard error:",
            error
        );


        if (
            error.status === 404
        ) {

            console.warn(
                "Customer bookings endpoint not found."
            );

            return;
        }


        throw error;
    }
}


/* ================================================================
   CUSTOMER DASHBOARD STATISTICS
   Calculates and displays booking counts by status.
================================================================ */

function updateCustomerDashboardStats(bookings) {

    const safeBookings =
        Array.isArray(bookings)
            ? bookings
            : [];


    const totalBookings =
        safeBookings.length;


    const activeBookings =
        safeBookings.filter(function (booking) {

            return (
                booking &&
                (
                    normalizeBookingStatus(booking?.status) === "pending" ||
                    normalizeBookingStatus(booking?.status) === "confirmed" ||
                    normalizeBookingStatus(booking?.status) === "in-progress"
                )
            );

        }).length;


    const completedBookings =
        safeBookings.filter(function (booking) {

            return (
                booking &&
                booking.status === "completed"
            );

        }).length;


    const cancelledBookings =
        safeBookings.filter(function (booking) {

            return (
                booking &&
                booking.status === "cancelled"
            );

        }).length;


    const statCards =
        document.querySelectorAll(
            ".stat-card"
        );


    statCards.forEach(function (card) {

        const labelElement =
            card.querySelector(
                "h3, .stat-label"
            );


        const valueElement =
            card.querySelector(
                "strong, .stat-number, .stat-value"
            );


        if (
            !labelElement ||
            !valueElement
        ) {

            return;
        }


        const label =
            labelElement.textContent
                .trim()
                .toLowerCase();


        if (
            label.includes("total")
        ) {

            valueElement.textContent =
                totalBookings;

        }


        else if (
            label.includes("active")
        ) {

            valueElement.textContent =
                activeBookings;

        }


        else if (
            label.includes("completed")
        ) {

            valueElement.textContent =
                completedBookings;

        }


        else if (
            label.includes("cancel")
        ) {

            valueElement.textContent =
                cancelledBookings;

        }

    });

}


/* ================================================================
   RECENT BOOKINGS
   Displays the latest five bookings on the dashboard.
================================================================ */

function renderRecentBookings(bookings) {

    const container =
        document.querySelector(
            ".recent-bookings"
        );


    if (!container) {

        return;
    }


    const safeBookings =
        Array.isArray(bookings)
            ? bookings
            : [];


    const recentBookings =
        safeBookings.slice(0, 5);


    if (
        recentBookings.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <p>No bookings yet.</p>

                <a href="services.html">
                    Find a Service
                </a>
            </div>
        `;

        return;
    }


    container.innerHTML =
        recentBookings
            .map(function (booking) {

                const service =
                    booking &&
                    booking.service
                        ? booking.service
                        : {};


                const serviceName =
                    service.name ||
                    "Service";


                const status =
                    booking &&
                    booking.status
                        ? booking.status
                        : "pending";


                return `
                    <div class="booking-item">

                        <div class="booking-info">

                            <h3>
                                ${escapeHtml(serviceName)}
                            </h3>

                            <p>
                                ${formatDate(
                                    booking.bookingDate
                                )}
                            </p>

                        </div>


                        <span
                            class="booking-status ${escapeHtml(
                                normalizeBookingStatus(status)
                            )}"
                        >
                            ${escapeHtml(
                                formatBookingStatus(status)
                            )}
                        </span>

                    </div>
                `;

            })
            .join("");

}


/* ================================================================
   BOOKING STATUS FORMATTER
================================================================ */

function formatBookingStatus(status) {

    if (!status) {

        return "Unknown";
    }


    const statusMap = {

        pending:
            "Pending",

        confirmed:
            "Confirmed",

        inProgress:
            "In Progress",

        completed:
            "Completed",

        cancelled:
            "Cancelled",

        canceled:
            "Cancelled"

    };


    const normalizedStatus =
        String(status)
            .trim();


    if (
        statusMap[normalizedStatus]
    ) {

        return statusMap[
            normalizedStatus
        ];

    }


    return normalizedStatus
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .replace(
            /\b\w/g,
            function (character) {

                return character.toUpperCase();

            }
        );

}


/* ========================================================================
   BOOKING STATUS NORMALIZATION
   Converts backend booking statuses into consistent application values.
   ======================================================================== */

/**
 * Normalizes booking status values for comparisons and CSS classes.
 *
 * @param {String} status - Raw booking status.
 * @returns {String} Normalized booking status.
 */
function normalizeBookingStatus(status) {

    if (!status) {
        return "pending";
    }

    const normalized =
        String(status)
            .trim()
            .toLowerCase();

    const statusMap = {
        pending: "pending",
        confirmed: "confirmed",
        inprogress: "in-progress",
        "in-progress": "in-progress",
        completed: "completed",
        cancelled: "cancelled",
        canceled: "cancelled"
    };

    return statusMap[normalized] ||
        normalized.replace(/[\s_]+/g, "-");
}


/* ========================================================================
   PROVIDER DASHBOARD
   ======================================================================== */

/**
 * Loads booking information for the currently logged-in provider
 * and updates the provider dashboard.
 *
 * Provider bookings are fetched from the backend and then used
 * to update dashboard statistics, booking requests and upcoming
 * bookings.
 */
async function loadProviderDashboard() {

    if (!requireLogin()) {
        return;
    }


    try {

        /*
         * Refresh the authenticated user profile so the dashboard
         * uses the latest role and account information.
         */
        const currentUser =
            await loadMyProfile();

        if (currentUser) {
            saveAuthData(
                getToken(),
                currentUser
            );
        }


        const user =
            currentUser ||
            getStoredUser();


        if (!user) {
            return;
        }


        const userRole =
            String(user.role || "")
                .trim()
                .toLowerCase();


        if (userRole !== "provider") {

            console.error(
                "Provider dashboard access denied. Current user role:",
                userRole || "unknown"
            );

            const requestsContainer =
                document.querySelector(
                    "#provider-booking-requests"
                );

            const upcomingContainer =
                document.querySelector(
                    "#provider-upcoming-bookings"
                );

            const message =
                "This dashboard is available only to approved service providers.";

            if (requestsContainer) {
                requestsContainer.innerHTML = `
                    <div class="error-state">
                        <p>
                            ${escapeHtml(message)}
                        </p>
                    </div>
                `;
            }

            if (upcomingContainer) {
                upcomingContainer.innerHTML = `
                    <div class="error-state">
                        <p>
                            ${escapeHtml(message)}
                        </p>
                    </div>
                `;
            }

            return;
        }


        const data =
            await apiRequest(
                "/bookings/provider/my-bookings",
                {
                    method: "GET"
                }
            );


        const bookings =
            Array.isArray(data?.bookings)
                ? data.bookings
                : [];


        renderProviderDashboard(
            bookings
        );

    }

    catch (error) {

        console.error(
            "Provider dashboard error:",
            error
        );


        if (
            error &&
            error.status === 401
        ) {

            handleUnauthorized();

            return;
        }


        const requestsContainer =
            document.querySelector(
                "#provider-booking-requests"
            );

        const upcomingContainer =
            document.querySelector(
                "#provider-upcoming-bookings"
            );


        if (error && error.status === 403) {

            const message =
                "Your account is not authorized as a service provider. Please use an approved provider account.";

            if (requestsContainer) {
                requestsContainer.innerHTML = `
                    <div class="error-state">
                        <p>
                            ${escapeHtml(message)}
                        </p>
                    </div>
                `;
            }

            if (upcomingContainer) {
                upcomingContainer.innerHTML = `
                    <div class="error-state">
                        <p>
                            ${escapeHtml(message)}
                        </p>
                    </div>
                `;
            }

            return;
        }


        if (requestsContainer) {
            requestsContainer.innerHTML = `
                <div class="error-state">
                    <p>
                        Unable to load booking requests.
                    </p>
                </div>
            `;
        }


        if (upcomingContainer) {
            upcomingContainer.innerHTML = `
                <div class="error-state">
                    <p>
                        Unable to load upcoming bookings.
                    </p>
                </div>
            `;
        }
    }
}


/* ========================================================================
   RENDER PROVIDER DASHBOARD
   ======================================================================== */

/**
 * Updates all provider dashboard sections using
 * the booking records returned by the backend.
 *
 * @param {Array} bookings - Provider booking records.
 */
function renderProviderDashboard(bookings) {

    const safeBookings =
        Array.isArray(bookings)
            ? bookings
            : [];


    /*
     * Separate bookings according to their current status.
     */
    const pendingBookings =
        safeBookings.filter(function (booking) {

            return (
                normalizeBookingStatus(
                    booking?.status
                ) === "pending"
            );

        });


    const confirmedBookings =
        safeBookings.filter(function (booking) {

            return (
                normalizeBookingStatus(
                    booking?.status
                ) === "confirmed"
            );

        });


    const inProgressBookings =
        safeBookings.filter(function (booking) {

            return (
                normalizeBookingStatus(
                    booking?.status
                ) === "in-progress"
            );

        });


    const completedBookings =
        safeBookings.filter(function (booking) {

            return (
                normalizeBookingStatus(
                    booking?.status
                ) === "completed"
            );

        });


    /*
     * Update dashboard statistics.
     */
    updateProviderDashboardStats(
        safeBookings
    );


    /*
     * Render new booking requests.
     */
    renderProviderBookingRequests(
        pendingBookings
    );


    /*
     * Render confirmed and in-progress bookings.
     */
    renderProviderUpcomingBookings(
        confirmedBookings.concat(
            inProgressBookings
        )
    );


    /*
     * Update provider name in the dashboard welcome section.
     */
    const providerWelcomeElement =
        document.querySelector(
            "#provider-welcome"
        );


    if (providerWelcomeElement) {

        let providerName =
            "Provider";


        /*
         * First try to get provider information
         * from the booking records.
         */
        const bookingWithProvider =
            safeBookings.find(function (booking) {

                return (
                    booking?.provider &&
                    booking.provider.name
                );

            });


        if (
            bookingWithProvider &&
            bookingWithProvider.provider
        ) {

            providerName =
                bookingWithProvider.provider.name;

        }


        /*
         * Fall back to the locally stored user
         * when no booking has an assigned provider.
         */
        if (
            providerName === "Provider"
        ) {

            try {

                const storedUser =
                    JSON.parse(
                        localStorage.getItem(
                            USER_KEY
                        ) || "null"
                    );


                if (
                    storedUser &&
                    storedUser.name
                ) {

                    providerName =
                        storedUser.name;

                }

            }

            catch (error) {

                console.warn(
                    "Unable to read stored provider information.",
                    error
                );

            }

        }


        providerWelcomeElement.textContent =
            `Welcome, ${providerName}! 👋`;

    }

}


/* ========================================================================
   LOAD PROVIDER REVIEWS
   Loads customer reviews belonging to the logged-in provider.
   ======================================================================== */

async function loadProviderReviews() {

    const reviewsContainer =
        document.getElementById(
            "provider-reviews-list"
        );

    const reviewsMessage =
        document.getElementById(
            "provider-reviews-message"
        );

    const ratingElement =
        document.getElementById(
            "provider-rating"
        );

    if (!reviewsContainer) {
        return;
    }


    if (!getToken()) {

        if (reviewsMessage) {
            reviewsMessage.textContent =
                "Please login to view customer reviews.";
        }

        return;
    }


    if (reviewsMessage) {
        reviewsMessage.textContent =
            "Loading customer reviews...";
    }

    try {

        const storedUser =
            getStoredUser() || {};

        const providerId =
            storedUser._id ||
            storedUser.id ||
            storedUser.userId ||
            "";


        const endpoints = [
            "/reviews/provider/my-reviews"
        ];


        if (providerId) {
            endpoints.push(
                `/reviews/provider/${encodeURIComponent(
                    providerId
                )}`
            );
        }


        endpoints.push(
            "/admin/reviews"
        );


        let reviews = null;
        let lastError = null;


        for (const endpoint of endpoints) {

            try {

                const data =
                    await apiRequest(
                        endpoint,
                        {
                            method: "GET"
                        }
                    );


                if (
                    data &&
                    Array.isArray(data.reviews)
                ) {

                    reviews = data.reviews;
                    break;

                }

                lastError =
                    new Error(
                        "Invalid reviews response."
                    );

            } catch (error) {

                lastError = error;

            }
        }


        if (!Array.isArray(reviews)) {

            throw (
                lastError ||
                new Error(
                    "Unable to load customer reviews."
                )
            );
        }


        if (providerId) {

            const providerMatches =
                reviews.filter(
                    function (review) {

                        const reviewProvider =
                            review?.provider ||
                            review?.booking?.provider ||
                            {};

                        const reviewProviderId =
                            reviewProvider?._id ||
                            reviewProvider?.id ||
                            review?.providerId ||
                            "";

                        return (
                            !reviewProviderId ||
                            String(reviewProviderId) ===
                                String(providerId)
                        );
                    }
                );


            const hasProviderInformation =
                reviews.some(
                    function (review) {

                        return (
                            review?.provider ||
                            review?.booking?.provider ||
                            review?.providerId
                        );
                    }
                );


            if (hasProviderInformation) {
                reviews =
                    providerMatches;
            }
        }


        renderProviderReviews(
            reviews
        );

    } catch (error) {

        console.error(
            "Provider reviews error:",
            error
        );


        if (
            error &&
            error.status === 401
        ) {
            handleUnauthorized();
            return;
        }


        if (reviewsMessage) {
            reviewsMessage.textContent =
                "Unable to load customer reviews.";
        }

        reviewsContainer.innerHTML =
            `<div class="error-state">
                <p>
                    Unable to load customer reviews.
                </p>
            </div>`;


        if (ratingElement) {
            ratingElement.textContent =
                "0⭐";
        }
    }
}


/* ========================================================================
   RENDER PROVIDER REVIEWS
   ======================================================================== */

function renderProviderReviews(reviews) {

    const reviewsContainer =
        document.getElementById(
            "provider-reviews-list"
        );

    const reviewsMessage =
        document.getElementById(
            "provider-reviews-message"
        );

    const ratingElement =
        document.getElementById(
            "provider-rating"
        );

    if (!reviewsContainer) {
        return;
    }


    const safeReviews =
        Array.isArray(reviews)
            ? reviews
            : [];


    const validRatings =
        safeReviews
            .map(
                function (review) {
                    return Number(
                        review?.rating
                    );
                }
            )
            .filter(
                function (rating) {
                    return (
                        Number.isFinite(rating) &&
                        rating > 0
                    );
                }
            );


    const totalRating =
        validRatings.reduce(
            function (sum, rating) {
                return sum + rating;
            },
            0
        );


    const averageRating =
        validRatings.length > 0
            ? (
                totalRating /
                validRatings.length
            ).toFixed(1)
            : "0.0";


    if (ratingElement) {
        ratingElement.textContent =
            `${averageRating}⭐`;
    }


    if (safeReviews.length === 0) {

        if (reviewsMessage) {
            reviewsMessage.textContent =
                "No customer reviews yet.";
        }

        reviewsContainer.innerHTML =
            '<div class="review-empty">No customer reviews yet.</div>';

        return;
    }


    if (reviewsMessage) {
        reviewsMessage.textContent =
            `${safeReviews.length} customer review${
                safeReviews.length === 1 ? "" : "s"
            }`;
    }


    reviewsContainer.innerHTML =
        safeReviews
            .map(
                function (review) {

                    const customer =
                        review?.customer || {};

                    const service =
                        review?.service || {};

                    const booking =
                        review?.booking || {};

                    const customerName =
                        customer?.name ||
                        review?.customerName ||
                        "Customer";

                    const serviceName =
                        service?.name ||
                        review?.serviceName ||
                        booking?.service?.name ||
                        "Service";

                    const rating =
                        Math.max(
                            0,
                            Math.min(
                                5,
                                Number(
                                    review?.rating
                                ) || 0
                            )
                        );

                    const stars =
                        "★".repeat(
                            Math.floor(rating)
                        ) +
                        "☆".repeat(
                            5 -
                            Math.floor(rating)
                        );

                    const comment =
                        review?.comment ||
                        "No comment provided.";

                    const reviewDate =
                        review?.createdAt ||
                        review?.updatedAt ||
                        review?.date;


                    return `
                        <article class="review-card">

                            <div class="review-card-header">

                                <h3>
                                    ${escapeHtml(
                                        serviceName
                                    )}
                                </h3>

                                <div class="review-rating">
                                    ${stars}
                                </div>

                            </div>

                            <p>
                                <strong>Customer:</strong>
                                ${escapeHtml(
                                    customerName
                                )}
                            </p>

                            <p>
                                <strong>Rating:</strong>
                                ${rating}/5
                            </p>

                            <p>
                                <strong>Comment:</strong>
                                ${escapeHtml(
                                    comment
                                )}
                            </p>

                            <p>
                                <strong>Date:</strong>
                                ${escapeHtml(
                                    reviewDate
                                        ? formatDateTime(
                                            reviewDate
                                        )
                                        : "Not provided"
                                )}
                            </p>

                        </article>
                    `;
                }
            )
            .join("");
}


/* ========================================================================
   UPDATE PROVIDER DASHBOARD STATISTICS
   ======================================================================== */

/**
 * Calculates and updates provider dashboard statistics.
 *
 * Dashboard cards:
 * - New Requests
 * - Upcoming
 * - Completed
 * - Rating
 *
 * @param {Array} bookings - Provider booking records.
 */
function updateProviderDashboardStats(bookings) {

    const safeBookings =
        Array.isArray(bookings)
            ? bookings
            : [];


    const pendingCount =
        safeBookings.filter(function (booking) {

            return (
                normalizeBookingStatus(
                    booking?.status
                ) === "pending"
            );

        }).length;


    const upcomingCount =
        safeBookings.filter(function (booking) {

            const status =
                normalizeBookingStatus(
                    booking?.status
                );


            return (
                status === "confirmed" ||
                status === "in-progress"
            );

        }).length;


    const completedCount =
        safeBookings.filter(function (booking) {

            return (
                normalizeBookingStatus(
                    booking?.status
                ) === "completed"
            );

        }).length;


    /*
     * New booking requests.
     */
    const newRequestsElement =
        document.querySelector(
            "#provider-new-requests"
        );


    if (newRequestsElement) {

        newRequestsElement.textContent =
            pendingCount;

    }


    /*
     * Upcoming bookings.
     */
    const upcomingElement =
        document.querySelector(
            "#provider-upcoming"
        );


    if (upcomingElement) {

        upcomingElement.textContent =
            upcomingCount;

    }


    /*
     * Completed bookings.
     */
    const completedElement =
        document.querySelector(
            "#provider-completed"
        );


    if (completedElement) {

        completedElement.textContent =
            completedCount;

    }


    /*
     * Rating is not calculated from bookings.
     * Keep the existing dashboard value if available.
     */
    const ratingElement =
        document.querySelector(
            "#provider-rating"
        );


    if (
        ratingElement &&
        !ratingElement.textContent.trim()
    ) {

        ratingElement.textContent =
            "0⭐";

    }

}


/* ========================================================================
   RENDER PROVIDER BOOKING REQUESTS
   ======================================================================== */

/**
 * Renders all pending booking requests.
 *
 * Each request provides:
 * - Service name
 * - Customer name
 * - Address
 * - Booking date
 * - Booking time
 * - Price
 * - Accept button
 * - Reject button
 *
 * @param {Array} bookings - Pending provider bookings.
 */
function renderProviderBookingRequests(bookings) {

    const container =
        document.querySelector(
            "#provider-booking-requests"
        );


    if (!container) {
        return;
    }


    const safeBookings =
        Array.isArray(bookings)
            ? bookings
            : [];


    if (
        safeBookings.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <h3>
                    No New Booking Requests
                </h3>

                <p>
                    New customer booking requests will appear here.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        safeBookings
            .map(function (booking) {

                const service =
                    booking?.service || {};


                const customer =
                    booking?.customer || {};


                const bookingId =
                    booking?._id || "";


                const bookingDate =
                    booking?.bookingDate;


                const formattedDate =
                    formatDate(
                        bookingDate
                    );


                const formattedTime =
                    formatBookingTime(
                        bookingDate
                    );


                return `
                    <article
                        class="request-card"
                        data-booking-id="${escapeHTML(
                            bookingId
                        )}"
                    >

                        <div class="request-card-content">

                            <h3>
                                ${escapeHTML(
                                    service.name ||
                                    "Service"
                                )}
                            </h3>


                            <p>
                                Customer:
                                ${escapeHTML(
                                    customer.name ||
                                    "Customer"
                                )}
                            </p>


                            <p>
                                Location:
                                ${escapeHTML(
                                    booking?.address ||
                                    "N/A"
                                )}
                            </p>


                            <p>
                                Date:
                                ${escapeHTML(
                                    formattedDate
                                )}
                            </p>


                            <p>
                                Time:
                                ${escapeHTML(
                                    formattedTime
                                )}
                            </p>


                            <p>
                                Price:
                                ${formatPrice(
                                    booking?.totalPrice
                                )}
                            </p>

                        </div>


                        <div class="request-actions">

                            <button
                                type="button"
                                class="provider-accept-btn"
                                data-booking-id="${escapeHTML(
                                    bookingId
                                )}"
                            >
                                Accept
                            </button>


                            <button
                                type="button"
                                class="provider-reject-btn"
                                data-booking-id="${escapeHTML(
                                    bookingId
                                )}"
                            >
                                Reject
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");


    /*
     * Attach Accept button handlers.
     */
    container
        .querySelectorAll(
            ".provider-accept-btn"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const bookingId =
                        button.dataset.bookingId;


                    if (!bookingId) {

                        console.warn(
                            "Booking ID not found."
                        );

                        return;
                    }


                    acceptProviderBooking(
                        bookingId
                    );

                }
            );

        });


    /*
     * Attach Reject button handlers.
     */
    container
        .querySelectorAll(
            ".provider-reject-btn"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const bookingId =
                        button.dataset.bookingId;


                    if (!bookingId) {

                        console.warn(
                            "Booking ID not found."
                        );

                        return;
                    }


                    rejectProviderBooking(
                        bookingId
                    );

                }
            );

        });

}


/* ========================================================================
   ACCEPT PROVIDER BOOKING
   ======================================================================== */

/**
 * Accepts a pending booking request.
 *
 * Backend changes the booking status to confirmed
 * and assigns the currently logged-in provider.
 *
 * @param {String} bookingId - Booking ID.
 */
async function acceptProviderBooking(bookingId) {

    try {

        const data =
            await apiRequest(
                `/bookings/${encodeURIComponent(
                    bookingId
                )}/accept`,
                {
                    method: "PUT"
                }
            );


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                data?.message ||
                "Unable to accept booking."
            );

        }


        alert(
            "Booking accepted successfully."
        );


        await loadProviderDashboard();

    }

    catch (error) {

        console.error(
            "Accept booking error:",
            error
        );


        if (
            error &&
            error.status === 401
        ) {

            handleUnauthorized();

            return;
        }


        alert(
            error?.message ||
            "Unable to accept booking."
        );

    }

}


/* ========================================================================
   REJECT PROVIDER BOOKING
   ======================================================================== */

/**
 * Rejects a pending booking request by cancelling it.
 *
 * @param {String} bookingId - Booking ID.
 */
async function rejectProviderBooking(bookingId) {

    const confirmed =
        window.confirm(
            "Are you sure you want to reject this booking?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const data =
            await apiRequest(
                `/bookings/${encodeURIComponent(
                    bookingId
                )}/cancel`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        reason:
                            "Booking rejected by provider."
                    })
                }
            );


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                data?.message ||
                "Unable to reject booking."
            );

        }


        alert(
            "Booking rejected successfully."
        );


        await loadProviderDashboard();

    }

    catch (error) {

        console.error(
            "Reject booking error:",
            error
        );


        if (
            error &&
            error.status === 401
        ) {

            handleUnauthorized();

            return;
        }


        alert(
            error?.message ||
            "Unable to reject booking."
        );

    }

}


/* ========================================================================
   RENDER PROVIDER UPCOMING BOOKINGS
   ======================================================================== */

/**
 * Renders confirmed and in-progress bookings.
 *
 * Confirmed bookings display a Start Service button.
 * In-progress bookings display a Complete Service button.
 *
 * @param {Array} bookings - Confirmed/in-progress bookings.
 */
function renderProviderUpcomingBookings(bookings) {

    const container =
        document.querySelector(
            "#provider-upcoming-bookings"
        );


    if (!container) {
        return;
    }


    const safeBookings =
        Array.isArray(bookings)
            ? bookings
            : [];


    if (
        safeBookings.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <h3>
                    No Upcoming Bookings
                </h3>

                <p>
                    Accepted bookings will appear here.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        safeBookings
            .map(function (booking) {

                const service =
                    booking?.service || {};


                const customer =
                    booking?.customer || {};


                const status =
                    normalizeBookingStatus(
                        booking?.status
                    );


                const bookingId =
                    booking?._id || "";


                let actionButton = "";


                if (
                    status === "confirmed"
                ) {

                    actionButton = `
                        <button
                            type="button"
                            class="provider-start-btn"
                            data-booking-id="${escapeHTML(
                                bookingId
                            )}"
                        >
                            Start Service
                        </button>
                    `;

                }

                else if (
                    status === "in-progress"
                ) {

                    actionButton = `
                        <button
                            type="button"
                            class="provider-complete-btn"
                            data-booking-id="${escapeHTML(
                                bookingId
                            )}"
                        >
                            Complete Service
                        </button>
                    `;

                }


                return `
                    <article
                        class="upcoming-card"
                        data-booking-id="${escapeHTML(
                            bookingId
                        )}"
                    >

                        <div class="upcoming-card-content">

                            <h3>
                                ${escapeHTML(
                                    service.name ||
                                    "Service"
                                )}
                            </h3>


                            <p>
                                Customer:
                                ${escapeHTML(
                                    customer.name ||
                                    "Customer"
                                )}
                            </p>


                            <p>
                                Location:
                                ${escapeHTML(
                                    booking?.address ||
                                    "N/A"
                                )}
                            </p>


                            <p>
                                Date:
                                ${escapeHTML(
                                    formatDate(
                                        booking?.bookingDate
                                    )
                                )}
                            </p>


                            <p>
                                Time:
                                ${escapeHTML(
                                    formatBookingTime(
                                        booking?.bookingDate
                                    )
                                )}
                            </p>


                            <p>
                                Price:
                                ${formatPrice(
                                    booking?.totalPrice
                                )}
                            </p>

                        </div>


                        <div class="upcoming-card-actions">

                            <span
                                class="booking-status ${escapeHTML(
                                    status
                                )}"
                            >
                                ${escapeHTML(
                                    formatBookingStatus(
                                        status
                                    )
                                )}
                            </span>


                            ${actionButton}

                        </div>

                    </article>
                `;

            })
            .join("");


    /*
     * Start Service buttons.
     */
    container
        .querySelectorAll(
            ".provider-start-btn"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const bookingId =
                        button.dataset.bookingId;


                    if (!bookingId) {
                        return;
                    }


                    updateProviderBookingStatus(
                        bookingId,
                        "in-progress"
                    );

                }
            );

        });


    /*
     * Complete Service buttons.
     */
    container
        .querySelectorAll(
            ".provider-complete-btn"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const bookingId =
                        button.dataset.bookingId;


                    if (!bookingId) {
                        return;
                    }


                    updateProviderBookingStatus(
                        bookingId,
                        "completed"
                    );

                }
            );

        });

}


/* ========================================================================
   UPDATE PROVIDER BOOKING STATUS
   ======================================================================== */

/**
 * Updates the status of an accepted provider booking.
 *
 * Allowed transitions:
 * confirmed -> in-progress
 * in-progress -> completed
 *
 * @param {String} bookingId - Booking ID.
 * @param {String} status - New booking status.
 */
async function updateProviderBookingStatus(
    bookingId,
    status
) {

    try {

        const data =
            await apiRequest(
                `/bookings/${encodeURIComponent(
                    bookingId
                )}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        status: status
                    })
                }
            );


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                data?.message ||
                "Unable to update booking status."
            );

        }


        if (
            status === "in-progress"
        ) {

            alert(
                "Service started successfully."
            );

        }

        else if (
            status === "completed"
        ) {

            alert(
                "Service marked as completed."
            );

        }


        await loadProviderDashboard();

    }

    catch (error) {

        console.error(
            "Update provider booking status error:",
            error
        );


        if (
            error &&
            error.status === 401
        ) {

            handleUnauthorized();

            return;
        }


        alert(
            error?.message ||
            "Unable to update booking status."
        );

    }

}


/* ========================================================================
   FORMAT PROVIDER BOOKING TIME
   ======================================================================== */

/**
 * Formats a booking date into a readable time.
 *
 * @param {String|Date} bookingDate - Booking date/time.
 * @returns {String} Formatted time.
 */
function formatBookingTime(bookingDate) {

    if (!bookingDate) {
        return "Time not available";
    }


    const date =
        new Date(
            bookingDate
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Time not available";
    }


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* ========================================================================
   PROVIDER DASHBOARD INITIALIZATION
   ======================================================================== */

/*
 * Detect the provider dashboard using
 * the provider booking request container.
 */
const providerDashboardPage =
    document.querySelector(
        ".provider-dashboard-page"
    );


const providerBookingRequestsContainer =
    document.querySelector(
        "#provider-booking-requests"
    );


if (
    providerDashboardPage ||
    providerBookingRequestsContainer
) {

    loadProviderDashboard();

}


    /* ========================================================================
    BOOKING STATUS PAGE INITIALIZATION
    ======================================================================== */

    /*
    * Detect the booking status page and load its
    * booking information when the page is available.
    */
    const bookingStatusPage =
        document.querySelector(
            ".booking-status-page"
        );


    if (bookingStatusPage) {

        loadBookingStatusPage();

    }


    /* ========================================================================
    LOAD BOOKING STATUS
    ======================================================================== */

    /**
     * Retrieves the selected booking from the backend
     * and renders its current status.
     *
     * The booking ID is retrieved from localStorage using
     * CURRENT_BOOKING_KEY.
     */
    async function loadBookingStatusPage() {

        if (!requireLogin()) {
            return;
        }


        const bookingId =
            localStorage.getItem(
                CURRENT_BOOKING_KEY
            );


        /*
        * A booking must be selected before this page
        * can display booking details.
        */
        if (!bookingId) {

            alert(
                "No booking selected."
            );


            window.location.href =
                "my-bookings.html";


            return;
        }


        try {

            const data =
            await apiRequest(
                `/bookings/${encodeURIComponent(
                    bookingId
                )}`,
                {
            method: "GET"
        }
    );


            /*
            * Ensure that the backend returned both a
            * successful response and an actual booking object.
            */
            if (
                !data?.success ||
                !data?.booking
            ) {

                throw new Error(
                    data?.message ||
                    "Booking not found."
                );

            }


            renderBookingStatus(
                data.booking
            );

        }


        catch (error) {

            console.error(
                "Booking status error:",
                error
            );


            if (
                error &&
                error.status === 401
            ) {

                handleUnauthorized();

                return;
            }


            alert(
                error?.message ||
                "Unable to load booking."
            );

        }

    }


    /* ========================================================================
   RENDER BOOKING STATUS
   ======================================================================== */

/**
 * Updates all booking-related UI elements using
 * the booking object returned by the backend.
 *
 * @param {Object} booking - Booking record.
 */
function renderBookingStatus(booking) {

    if (!booking) {
        return;
    }


    const service =
        booking.service || {};


    const provider =
        booking.provider || {};


    const customer =
        booking.customer || {};


    const status =
        normalizeBookingStatus(
            booking.status
        );



    /*
     * Update service name everywhere.
     */
    document
        .querySelectorAll(
            ".booking-service-name-header, .booking-service-details"
        )
        .forEach(
            function (element) {

                element.textContent =
                    service.name ||
                    "Service";

            }
        );



    /*
     * Update current booking status.
     */
    document
        .querySelectorAll(
            ".booking-current-status"
        )
        .forEach(
            function (element) {

                element.textContent =
                    formatBookingStatus(
                        status
                    );

                element.className =
                    `booking-current-status ${status}`;

            }
        );



    /*
     * Update booking date everywhere.
     */
    document
        .querySelectorAll(
            ".booking-date"
        )
        .forEach(
            function (element) {

                element.textContent =
                    formatDate(
                        booking.bookingDate
                    );

            }
        );



    /*
     * Update booking time everywhere.
     */
    document
        .querySelectorAll(
            ".booking-time"
        )
        .forEach(
            function (element) {

                element.textContent =
                    formatBookingTime(
                        booking.bookingDate
                    );

            }
        );



    /*
     * Update service address everywhere.
     */
    document
        .querySelectorAll(
            ".booking-address"
        )
        .forEach(
            function (element) {

                element.textContent =
                    booking.address ||
                    "N/A";

            }
        );



    /*
     * Update customer phone everywhere.
     */
    document
        .querySelectorAll(
            ".booking-phone"
        )
        .forEach(
            function (element) {

                element.textContent =
                    booking.phone ||
                    customer.phone ||
                    "N/A";

            }
        );



    /*
     * Update assigned provider everywhere.
     */
    document
        .querySelectorAll(
            ".booking-provider"
        )
        .forEach(
            function (element) {

                element.textContent =
                    provider.name ||
                    "Not assigned";

            }
        );



    /*
     * Update booking price everywhere.
     */
    document
        .querySelectorAll(
            ".booking-total"
        )
        .forEach(
            function (element) {

                element.textContent =
                    formatPrice(
                        booking.totalPrice
                    );

            }
        );



    /*
     * Update booking ID everywhere.
     */
    document
        .querySelectorAll(
            ".booking-id"
        )
        .forEach(
            function (element) {

                element.textContent =
                    booking._id ||
                    "N/A";

            }
        );



    /*
     * Update booking creation date everywhere.
     */
    document
        .querySelectorAll(
            ".booking-created-date"
        )
        .forEach(
            function (element) {

                element.textContent =
                    booking.createdAt
                        ? formatDate(
                            booking.createdAt
                        )
                        : "N/A";

            }
        );



    /*
     * Update booking notes everywhere.
     */
    document
        .querySelectorAll(
            ".booking-notes"
        )
        .forEach(
            function (element) {

                element.textContent =
                    booking.notes ||
                    "No additional notes provided.";

            }
        );



    /*
     * Update provider location everywhere.
     */
    document
        .querySelectorAll(
            ".booking-provider-location"
        )
        .forEach(
            function (element) {

                element.textContent =
                    provider.location ||
                    provider.address ||
                    "Location not available";

            }
        );



    /*
     * Update provider rating everywhere.
     */
    document
        .querySelectorAll(
            ".booking-provider-rating"
        )
        .forEach(
            function (element) {

                element.textContent =
                    provider.rating !== undefined &&
                    provider.rating !== null
                        ? `${provider.rating} / 5 Rating`
                        : "Rating not available";

            }
        );



    /*
     * Update provider experience everywhere.
     */
    document
        .querySelectorAll(
            ".booking-provider-experience"
        )
        .forEach(
            function (element) {

                element.textContent =
                    provider.experience
                        ? `${provider.experience} Experience`
                        : "Experience not available";

            }
        );



    /*
     * Update provider service price everywhere.
     */
    document
        .querySelectorAll(
            ".booking-provider-price"
        )
        .forEach(
            function (element) {

                element.textContent =
                    service.price !== undefined &&
                    service.price !== null
                        ? `Starting From ₹${service.price}`
                        : "Price not available";

            }
        );



    /*
     * Synchronize the visual booking timeline
     * with the current booking status.
     */
    updateBookingTimeline(
        status
    );

}




/* ========================================================================
   UPDATE BOOKING TIMELINE
   ======================================================================== */

/**
 * Updates the visual booking progress timeline
 * according to the current booking status.
 *
 * @param {String} status - Current booking status.
 */
function updateBookingTimeline(status) {

    const normalizedStatus =
        String(status || "")
            .trim()
            .toLowerCase()
            .replace(/[\s_-]+/g, "-");


    let currentIndex = -1;


    /*
     * Determine the active timeline step
     * based on the current booking status.
     */
    if (normalizedStatus === "pending") {

        currentIndex = 0;

    }

    else if (normalizedStatus === "confirmed") {

        currentIndex = 1;

    }

    else if (
        normalizedStatus === "in-progress" ||
        normalizedStatus === "inprogress"
    ) {

        currentIndex = 2;

    }

    else if (normalizedStatus === "completed") {

        currentIndex = 3;

    }


    /*
     * Select all booking timeline items.
     */
    const timelineItems =
        document.querySelectorAll(
            ".booking-timeline-item"
        );


    timelineItems.forEach(
        function (item, index) {

            /*
             * Reset existing timeline states
             * before applying the current state.
             */
            item.classList.remove(
                "active",
                "completed"
            );


            /*
             * Mark all previous steps as completed.
             */
            if (
                currentIndex >= 0 &&
                index < currentIndex
            ) {

                item.classList.add(
                    "completed"
                );

            }


            /*
             * Mark the current step as active.
             */
            if (
                currentIndex >= 0 &&
                index === currentIndex
            ) {

                item.classList.add(
                    "active"
                );

            }

        }
    );

}


    /* ========================================================================
    SERVICE DETAILS → BOOKING PAGE LINK
    ======================================================================== */

    /*
    * Detect the booking link from the service details page.
    *
    * If no service has been selected, a fallback service
    * name is stored so the booking page can still operate.
    */
    const bookingLink =
        document.querySelector(
            'a[href="booking.html"]'
        );


    if (bookingLink) {

        bookingLink.addEventListener(
            "click",
            function () {

                const selectedService =
                    localStorage.getItem(
                        SELECTED_SERVICE_KEY
                    );


                if (!selectedService) {

                    localStorage.setItem(
                        SELECTED_SERVICE_KEY,
                        "Service"
                    );

                }

            }
        );

    }


    /* ========================================================================
    BOOKING PAGE INITIALIZATION
    ======================================================================== */

    /*
    * Detect the booking form and initialize the booking
    * page only when the form exists on the current page.
    */
    const bookingForm =
        document.querySelector(
            ".booking-form"
        );


    if (bookingForm) {

        initializeBookingPage();

    }


    /* ========================================================================
    INITIALIZE BOOKING PAGE
    ======================================================================== */

    /**
     * Initializes the booking form.
     *
     * The function:
     * 1. Verifies user authentication.
     * 2. Restores the selected service.
     * 3. Loads active services from the backend.
     * 4. Registers the booking form submit handler.
     */
    async function initializeBookingPage() {

        if (!requireLogin()) {
            return;
        }


        const selectedService =
            localStorage.getItem(
                SELECTED_SERVICE_KEY
            );


        const serviceNameElement =
            document.querySelector(
                ".booking-service-name"
            );


        if (
            serviceNameElement &&
            selectedService
        ) {

            serviceNameElement.textContent =
                selectedService;

        }


        const serviceSelect =
            bookingForm.querySelector(
                'select[name="service"]'
            );


        if (serviceSelect) {

            await loadServicesIntoSelect(
                serviceSelect
            );

        }


                /*
        * Update selected service name and price
        * whenever the customer changes the service.
        */
        if (serviceSelect) {

            function updateBookingServiceSummary() {

                const selectedOption =
                    serviceSelect.options[
                        serviceSelect.selectedIndex
                    ];

                const serviceNameElement =
                    document.querySelector(
                        ".booking-service-name"
                    );

                const priceInfoElement =
                    document.getElementById(
                        "booking-price-info"
                    );

                if (
                    !selectedOption ||
                    !selectedOption.value
                ) {

                    if (serviceNameElement) {
                        serviceNameElement.textContent =
                            "Select a service";
                    }

                    if (priceInfoElement) {
                        priceInfoElement.textContent =
                            "Starting From ₹0";
                    }

                    return;

                }

                const serviceName =
                    selectedOption.dataset.name ||
                    selectedOption.textContent
                        .split(" - ₹")[0]
                        .trim();

                const servicePrice =
                    Number(
                        selectedOption.dataset.price || 0
                    );

                if (serviceNameElement) {

                    serviceNameElement.textContent =
                        serviceName;

                }

                if (priceInfoElement) {

                    priceInfoElement.textContent =
                        `Starting From ₹${servicePrice.toLocaleString("en-IN")}`;

                }

            }

            serviceSelect.addEventListener(
                "change",
                updateBookingServiceSummary
            );

            updateBookingServiceSummary();

        }


        /*
        * Attach the submit handler only after the
        * booking page has been initialized.
        */
        bookingForm.addEventListener(
            "submit",
            handleBookingSubmit
        );

    }


    /* ========================================================================
    LOAD SERVICES INTO BOOKING SELECT
    ======================================================================== */

    /**
     * Fetches active services from the backend and populates
     * the booking form's service dropdown.
     *
     * @param {HTMLSelectElement} selectElement
     *        Service selection dropdown.
     */
    async function loadServicesIntoSelect(
        selectElement
    ) {

        if (!selectElement) {
            return;
        }


        try {

            const data =
                await apiRequest(
                    "/services",
                    {
                        method: "GET"
                    }
                );


            const services =
                Array.isArray(data?.services)
                    ? data.services
                    : [];


            if (
                services.length === 0
            ) {

                return;

            }


            /*
            * Preserve the current selection before
            * rebuilding the dropdown options.
            */
            const currentValue =
                selectElement.value;


            selectElement.innerHTML = `
                <option value="">
                    Select a service
                </option>
            `;


            /*
            * Only active services are made available
            * for new bookings.
            */
            services
                .filter(function (service) {

                    return (
                        service &&
                        service.isActive !== false
                    );

                })
                .forEach(function (service) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        service._id || "";


                    option.textContent =
                        `${service.name || "Service"} - ${formatPrice(
                            service.price
                        )}`;


                    /*
                    * Store the service price and name
                    * directly on the option for later use.
                    */
                    option.dataset.price =
                        String(
                            Number(service.price) || 0
                        );


                    option.dataset.name =
                        service.name ||
                        "Service";


                    selectElement.appendChild(
                        option
                    );

                });


            /*
            * Restore the previous selection when the
            * service still exists in the updated list.
            */
            if (currentValue) {

                const matchingOption =
                    Array.from(
                        selectElement.options
                    ).find(function (option) {

                        return (
                            option.value ===
                            currentValue
                        );

                    });


                if (matchingOption) {

                    selectElement.value =
                        currentValue;

                }

            }

        }


        catch (error) {

            console.error(
                "Load services error:",
                error
            );

        }

    }


    /* ========================================================================
    CREATE NEW BOOKING
    ======================================================================== */

    /**
     * Validates the booking form and submits a new booking
     * to the backend.
     *
     * Booking data includes:
     * - Service
     * - Booking date
     * - Address
     * - Phone number
     * - Additional notes
     * - Total price
     */
    async function handleBookingSubmit(event) {

        event.preventDefault();


        if (!requireLogin()) {
            return;
        }


        if (!bookingForm) {
            return;
        }


        /*
        * Locate all booking form fields.
        */
        const serviceSelect =
            bookingForm.querySelector(
                'select[name="service"]'
            );


        const dateInput =
            bookingForm.querySelector(
                'input[name="date"], input[name="bookingDate"]'
            );


            const timeInput =
            bookingForm.querySelector(
                'input[name="time"], input[name="bookingTime"]'
            );


        const addressInput =
            bookingForm.querySelector(
                'textarea[name="address"], input[name="address"]'
            );


        const phoneInput =
            bookingForm.querySelector(
                'input[name="phone"]'
            );


        const notesInput =
            bookingForm.querySelector(
                'textarea[name="notes"]'
            );


        /*
        * Read and clean user-provided values.
        */
        const serviceId =
            serviceSelect
                ? serviceSelect.value.trim()
                : "";


        const bookingDate =
            dateInput
                ? dateInput.value.trim()
                : "";


                const bookingTime =
                timeInput
                ? timeInput.value.trim()
                : "";


        const address =
            addressInput
                ? addressInput.value.trim()
                : "";


        const phone =
            phoneInput
                ? phoneInput.value.trim()
                : "";


        const notes =
            notesInput
                ? notesInput.value.trim()
                : "";


        /* --------------------------------------------------------------------
        FORM VALIDATION
        -------------------------------------------------------------------- */

        if (!serviceId) {

            alert(
                "Please select a service."
            );

            return;
        }


        if (!bookingDate) {

            alert(
                "Please select a booking date."
            );

            return;
        }


        if (!bookingTime) {
            
            alert(
                "Please select a preferred time."
            );
            
            return;
        }


        if (!address) {

            alert(
                "Please enter your address."
            );

            return;
        }


        if (!phone) {

            alert(
                "Please enter your phone number."
            );

            return;
        }


        /*
        * Convert the selected date into a Date object
        * and verify that it represents a valid date.
        */
        const selectedDate =
        new Date(
            `${bookingDate}T${bookingTime}:00`
        );


        if (
            Number.isNaN(
                selectedDate.getTime()
            )
        ) {

            alert(
                "Please select a valid booking date."
            );

            return;
        }


        /*
        * Temporarily disable the submit button to
        * prevent duplicate booking requests.
        */
        const submitButton =
            bookingForm.querySelector(
                'button[type="submit"]'
            );


        const originalText =
            submitButton
                ? submitButton.textContent.trim()
                : "Book Now";


        if (submitButton) {

            submitButton.disabled =
                true;


            submitButton.textContent =
                "Booking...";

        }


        try {

            /*
            * Retrieve the selected service option so that
            * the service price can be included in the request.
            */
            const selectedOption =
                serviceSelect
                    ? serviceSelect.options[
                        serviceSelect.selectedIndex
                    ]
                    : null;


            const price =
                selectedOption
                    ? Number(
                        selectedOption.dataset.price ||
                        0
                    )
                    : 0;


            /*
            * Send the booking request to the backend.
            */
            const data =
                await apiRequest(
                    "/bookings",
                    {

                        method: "POST",

                        body:
                            JSON.stringify({

                                service:
                                    serviceId,

                                bookingDate:
                                    selectedDate.toISOString(),

                                address:
                                    address,

                                phone:
                                    phone,

                                notes:
                                    notes,

                                totalPrice:
                                    price

                            })

                    }
                );


            /*
            * Verify that the backend successfully
            * created and returned the booking.
            */
            if (
                !data?.success ||
                !data?.booking
            ) {

                throw new Error(
                    data?.message ||
                    "Booking failed."
                );

            }


            const createdBookingId =
                data.booking._id;


            if (!createdBookingId) {

                throw new Error(
                    "Booking was created, but booking ID was not received."
                );

            }


            /*
            * Store the newly-created booking ID so
            * booking-status.html can load its details.
            */
            localStorage.setItem(
                CURRENT_BOOKING_KEY,
                createdBookingId
            );


            alert(
                "Booking created successfully!"
            );


            window.location.href =
                "booking-status.html";

        }


        catch (error) {

            console.error(
                "Booking submit error:",
                error
            );


            if (
                error &&
                error.status === 401
            ) {

                handleUnauthorized();

                return;
            }


            alert(
                error?.message ||
                "Unable to create booking."
            );

        }


        finally {

            /*
            * Always restore the submit button state,
            * regardless of whether the request succeeded
            * or failed.
            */
            if (submitButton) {

                submitButton.disabled =
                    false;


                submitButton.textContent =
                    originalText;

            }

        }

    }


    /* ========================================================================
ADMIN DASHBOARD
Retrieves dashboard statistics for an authenticated administrator.
======================================================================== */

async function loadAdminDashboard() {

    const token =
        getToken();

    if (!token) {

        console.error(
            "Admin token not found."
        );

        return null;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/admin/dashboard`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await parseJSONResponse(
                response
            );


        if (!response.ok) {

            console.error(
                "Admin dashboard error:",
                data?.message ||
                "Unable to load dashboard."
            );


            if (
                response.status === 401
            ) {

                handleUnauthorized();

            }


            return null;
        }


        console.log(
            "Admin dashboard loaded:",
            data?.stats
        );


        return data?.stats || null;

    }


    catch (error) {

        console.error(
            "Admin dashboard request failed:",
            error
        );

        return null;
    }
}


/* ========================================================================
ADMIN DASHBOARD INITIALIZATION
Loads dashboard statistics and updates the platform overview cards.
======================================================================== */

async function initializeAdminDashboard() {

    const bookingsElement =
        document.getElementById("admin-total-bookings");

    const usersElement =
        document.getElementById("admin-total-users");

    if (
        !bookingsElement &&
        !usersElement
    ) {
        return;
    }


    const dashboardStats =
        await loadAdminDashboard();


    if (!dashboardStats) {
        return;
    }


    if (usersElement) {

        usersElement.textContent =
            dashboardStats.users ?? 0;
    }


    if (bookingsElement) {

        bookingsElement.textContent =
            dashboardStats.bookings ?? 0;
    }


    console.log(
        "Admin dashboard statistics updated:",
        dashboardStats
    );
}


/* ========================================================================
START ADMIN DASHBOARD
======================================================================== */

if (
    document.getElementById("admin-total-bookings")
) {

    initializeAdminDashboard();
}


    /* ========================================================================
    ADMIN — GET ALL USERS
    ======================================================================== */

    /**
     * Retrieves all users from the admin API.
     *
     * @returns {Array} Array of users or an empty array on failure.
     */
    async function loadAdminUsers() {

        const token =
            getToken();


        if (!token) {

            console.error(
                "Admin token not found."
            );

            return [];

        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/users`,
                    {

                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        }

                    }
                );


            const data =
                await parseJSONResponse(
                    response
                );


            if (!response.ok) {

                console.error(
                    "Admin users error:",
                    data?.message ||
                    "Unable to load users."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                }


                return [];

            }


            console.log(
                "Admin users loaded:",
                data?.users
            );

            adminUsersCache =
        Array.isArray(data?.users)
            ? data.users
            : [];

            
            updateAdminUserStats(data?.users);

            const usersList =
        document.getElementById(
            "admin-users-list"
        );


    if (usersList) {

        const users =
            Array.isArray(data?.users)
                ? data.users
                : [];


        if (users.length === 0) {

            usersList.innerHTML = `
                <div class="empty-state">
                    <p>
                        No registered users found.
                    </p>
                </div>
            `;

        } else {

            usersList.innerHTML =
                users.map(user => {

                    const userId =
                        user._id ||
                        user.id ||
                        "";

                    const userName =
                        user.name ||
                        "Unknown User";

                    const userEmail =
                        user.email ||
                        "No email";

                    const userPhone =
                        user.phone ||
                        "Not provided";

                    const userRole =
                        user.role ||
                        "customer";

                    const isActive =
                        user.isActive !== false;

                    const roleLabel =
                        userRole.charAt(0).toUpperCase() +
                        userRole.slice(1);

                    const statusLabel =
                        isActive
                            ? "Active"
                            : "Inactive";


                    return `
                        <article
                            class="request-card admin-user-card"
                            data-user-id="${userId}"
                            data-role="${userRole}"
                        >

                            <h3>
                                ${userName}
                            </h3>

                            <p>
                                <strong>Email:</strong>
                                ${userEmail}
                            </p>

                            <p>
                                <strong>Phone:</strong>
                                ${userPhone}
                            </p>

                            <p>
                                <strong>Role:</strong>
                                ${roleLabel}
                            </p>

                            <p>
                                <strong>Status:</strong>

                                <span class="booking-status ${isActive ? "active" : "inactive"}">
                                ${statusLabel}
                                </span>
                            </p>

                            <div class="request-actions">

                                <button
                                    type="button"
                                    class="view-admin-user-btn"
                                    data-user-id="${userId}"
                                >
                                    View
                                </button>

                                ${
                                    userRole === "admin"
                                        ? ""
                                        : `
                                            <button
                                                type="button"
                                                class="toggle-admin-user-status-btn"
                                                data-user-id="${userId}"
                                                data-active="${isActive}"
                                            >
                                                ${
                                                    isActive
                                                        ? "Deactivate"
                                                        : "Activate"
                                                }
                                            </button>
                                        `
                                }

                            </div>

                        </article>
                    `;

                }).join("");

        }

    }


            return Array.isArray(
                data?.users
            )
                ? data.users
                : [];

        }


        catch (error) {

            console.error(
                "Admin users request failed:",
                error
            );


            return [];

        }

    }




    /* ========================================================================
    ADMIN — UPDATE USER STATISTICS
    ======================================================================== */

    function updateAdminUserStats(users) {

        const totalUsersElement =
            document.getElementById(
                "admin-total-users"
            );

        const customersElement =
            document.getElementById(
                "admin-total-customers"
            );

        const providersElement =
            document.getElementById(
                "admin-total-providers"
            );

        const adminsElement =
            document.getElementById(
                "admin-total-admins"
            );


        const userList =
            Array.isArray(users)
                ? users
                : [];


        const totalUsers =
            userList.length;


        const totalCustomers =
            userList.filter(
                user =>
                    String(
                        user.role || ""
                    ).toLowerCase() ===
                    "customer"
            ).length;


        const totalProviders =
            userList.filter(
                user =>
                    String(
                        user.role || ""
                    ).toLowerCase() ===
                    "provider"
            ).length;


        const totalAdmins =
            userList.filter(
                user =>
                    String(
                        user.role || ""
                    ).toLowerCase() ===
                    "admin"
            ).length;


        if (totalUsersElement) {

            totalUsersElement.textContent =
                totalUsers;

        }


        if (customersElement) {

            customersElement.textContent =
                totalCustomers;

        }


        if (providersElement) {

            providersElement.textContent =
                totalProviders;

        }


        if (adminsElement) {

            adminsElement.textContent =
                totalAdmins;

        }


        console.log(
            "Admin user statistics updated:",
            {
                totalUsers,
                totalCustomers,
                totalProviders,
                totalAdmins
            }
        );

    }





    /* ========================================================================
    ADMIN — GET SINGLE USER
    ======================================================================== */

    /**
     * Retrieves a specific user using their unique user ID.
     *
     * @param {string} userId - Unique user identifier.
     * @returns {Object|null} User object or null when unavailable.
     */
    async function loadAdminUser(userId) {

        if (!userId) {

            console.error(
                "User ID is required."
            );

            return null;

        }


        const token =
            getToken();


        if (!token) {

            console.error(
                "Admin token not found."
            );

            return null;

        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/users/${encodeURIComponent(
                        userId
                    )}`,
                    {

                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        }

                    }
                );


            const data =
                await parseJSONResponse(
                    response
                );


            if (!response.ok) {

                console.error(
                    "Get user error:",
                    data?.message ||
                    "Unable to load user."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                }


                return null;

            }


            console.log(
                "Admin user loaded:",
                data?.user
            );


            return data?.user || null;

        }


        catch (error) {

            console.error(
                "Get user request failed:",
                error
            );


            return null;

        }

    }


    /* ========================================================================
    ADMIN — ACTIVATE / DEACTIVATE USER
    ======================================================================== */

    /**
     * Updates the active status of a user.
     *
     * @param {string} userId - Unique user identifier.
     * @param {boolean} isActive - Desired account status.
     * @returns {Object|null} Updated user object or null on failure.
     */
    async function updateAdminUserStatus(userId, isActive) {

        if (!userId) {
        console.error("User ID is required.");
        return null;
    }

    const token = getToken();

    if (!token) {
        console.error("Admin token not found.");
        handleUnauthorized();
        return null;
    }

    try {

        console.log(
            "Updating user status:",
            userId,
            "isActive:",
            isActive
        );

        const response = await fetch(
            `${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}/status`,
            {
                method: "PUT",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    isActive: Boolean(isActive)
                })
            }
        );

        const data = await parseJSONResponse(response);

        console.log(
            "Update user status response:",
            response.status,
            data
        );

        if (!response.ok) {

            if (response.status === 401) {
                handleUnauthorized();
                return null;
            }

            alert(
                data?.message ||
                "Unable to update user status."
            );

            return null;
        }

        const updatedUser = data?.user || null;

        if (!updatedUser) {
            console.error(
                "Backend did not return updated user."
            );

            alert(
                "User status response was invalid."
            );

            return null;
        }

        const index =
            adminUsersCache.findIndex(
                function (item) {

                    return String(
                        item._id ||
                        item.id ||
                        ""
                    ) === String(userId);

                }
            );

        if (index !== -1) {
            adminUsersCache[index] = updatedUser;
        }

        console.log(
            "User status updated successfully:",
            updatedUser
        );

        alert(
            updatedUser.isActive === false
                ? "User deactivated successfully."
                : "User activated successfully."
        );

        return updatedUser;

    }
    catch (error) {

        console.error(
            "Update user status request failed:",
            error
        );

        alert(
            "Unable to update user status. Please try again."
        );

        return null;
    }

    }



    /* ========================================================================
    ADMIN — GET ALL BOOKINGS
    ======================================================================== */

    async function loadAdminBookings() {

        const token =
            getToken();

        if (!token) {

            console.error(
                "Admin token not found."
            );

            return [];

        }

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/bookings`,
                    {

                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        }

                    }
                );

            const data =
                await parseJSONResponse(
                    response
                );

            if (!response.ok) {

                console.error(
                    "Admin bookings error:",
                    data?.message ||
                    "Unable to load bookings."
                );

                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                }

                return [];

            }

            console.log(
                "Admin bookings loaded:",
                data?.bookings
            );

            return Array.isArray(
                data?.bookings
            )
                ? data.bookings
                : [];

        }

        catch (error) {

            console.error(
                "Admin bookings request failed:",
                error
            );

            return [];

        }

    }



    /* ========================================================================
    ADMIN — GET SINGLE BOOKING
    ======================================================================== */

    /**
     * Retrieves detailed information for a specific booking.
     *
     * @param {string} bookingId - Unique booking identifier.
     * @returns {Object|null} Booking object or null on failure.
     */
    async function loadAdminBooking(
        bookingId
    ) {

        if (!bookingId) {

            console.error(
                "Booking ID is required."
            );

            return null;

        }


        const token =
            getToken();


        if (!token) {

            console.error(
                "Admin token not found."
            );

            return null;

        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/bookings/${encodeURIComponent(
                        bookingId
                    )}`,
                    {

                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        }

                    }
                );


            const data =
                await parseJSONResponse(
                    response
                );


            if (!response.ok) {

                console.error(
                    "Get booking error:",
                    data?.message ||
                    "Unable to load booking."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                }


                return null;

            }


            console.log(
                "Admin booking loaded:",
                data?.booking
            );


            return data?.booking || null;

        }


        catch (error) {

            console.error(
                "Get booking request failed:",
                error
            );


            return null;

        }

    }


    /* ========================================================================
    ADMIN — GET ALL REVIEWS
    ======================================================================== */

    /**
     * Retrieves all customer reviews for administrative use.
     *
     * @returns {Array} Review collection or an empty array.
     */
    async function loadAdminReviews() {

        const token =
            getToken();


        if (!token) {

            console.error(
                "Admin token not found."
            );

            return [];

        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/reviews`,
                    {

                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        }

                    }
                );


            const data =
                await parseJSONResponse(
                    response
                );


            if (!response.ok) {

                console.error(
                    "Admin reviews error:",
                    data?.message ||
                    "Unable to load reviews."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                }


                return [];

            }


            console.log(
                "Admin reviews loaded:",
                data?.reviews
            );


            return Array.isArray(
                data?.reviews
            )
                ? data.reviews
                : [];

        }


        catch (error) {

            console.error(
                "Admin reviews request failed:",
                error
            );


            return [];

        }

    }

    /* ========================================================================
    ADMIN — GET ALL SERVICES
    ======================================================================== */

    /**
     * Retrieves all services for administrative management.
     *
     * @returns {Array} Service collection or an empty array.
     */
    async function loadAdminServices() {

        const token =
            getToken();


        /* ========================================================================
        CHECK ADMIN TOKEN
        ======================================================================== */

        if (!token) {

            console.error(
                "Admin token not found."
            );

            return [];

        }


        /* ========================================================================
        GET SERVICES FROM ADMIN API
        ======================================================================== */

        try {

            console.log(
                "🔄 Loading admin services..."
            );


            const response =
                await fetch(
                    `${API_BASE_URL}/admin/services`,
                    {

                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        }

                    }
                );


            /* ====================================================================
            PARSE API RESPONSE
            ==================================================================== */

            const data =
                await parseJSONResponse(
                    response
                );


            console.log(
                "Admin services API response:",
                data
            );


            /* ====================================================================
            HANDLE API ERROR
            ==================================================================== */

            if (!response.ok) {

                console.error(
                    "Admin services error:",
                    data?.message ||
                    "Unable to load services."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                }


                return [];

            }


            /* ====================================================================
            RETURN SERVICES
            ==================================================================== */

            const services =
                Array.isArray(
                    data?.services
                )
                    ? data.services
                    : [];


            console.log(
                "Admin services loaded:",
                services
            );


            return services;

        }


        catch (error) {

            console.error(
                "Admin services request failed:",
                error
            );


            return [];

        }

    }

    /* ========================================================================
    ADMIN — LOAD SERVICES BUTTON
    ======================================================================== */

    /* ========================================================================
    ADMIN — SERVICES PAGE INITIALIZATION
    ======================================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAdminServices
        );

    } else {

        initializeAdminServices();

    }


    /**
     * Initializes Admin Services page.
     */
    function initializeAdminServices() {

        const loadServicesButton =
            document.getElementById(
                "load-services-btn"
            );


        // If this is not the Admin Services page,
        // do nothing.
        if (!loadServicesButton) {
            return;
        }


        console.log(
            "Admin Services page initialized ✅"
        );


        loadServicesButton.addEventListener(
            "click",
            handleLoadAdminServices
        );


        /* ====================================================================
        INITIALIZE SERVICE FILTERS
        ==================================================================== */

        initializeAdminServiceFilters();


        /* ====================================================================
        INITIALIZE CREATE SERVICE FORM
        ==================================================================== */

        initializeAdminCreateService();


        /* ====================================================================
        INITIALIZE EDIT SERVICE FORM
        ==================================================================== */

        initializeAdminEditServiceForm();


        /* ====================================================================
        LOAD SERVICES
        ==================================================================== */

        handleLoadAdminServices()
            .then(function () {

                const params =
                    new URLSearchParams(
                        window.location.search
                    );

                const editServiceId =
                    params.get("edit");


                if (!editServiceId) {
                    return;
                }


                /*
                 * Wait until the service list and cache
                 * are populated before opening the edit form.
                 */

                setTimeout(
                    function () {

                        handleEditAdminService(
                            editServiceId
                        );

                    },
                    100
                );

            })
            .catch(function (error) {

                console.error(
                    "Admin Services initialization error:",
                    error
                );

            });

    }


    /* ========================================================================
    ADMIN — HANDLE LOAD SERVICES
    ======================================================================== */

    /**
     * Handles the Refresh Services button.
     */
    async function handleLoadAdminServices() {

        console.log(
            "Refresh Services clicked ✅"
        );


        const loadServicesButton =
            document.getElementById(
                "load-services-btn"
            );


        const servicesList =
            document.getElementById(
                "admin-services-list"
            );


        // ==================================================
        // PREVENT MULTIPLE CLICKS
        // ==================================================

        if (loadServicesButton) {

            loadServicesButton.disabled = true;

            loadServicesButton.textContent =
                "Loading...";

        }


        try {

            // ==================================================
            // LOAD SERVICES FROM BACKEND
            // ==================================================

            const services =
                await loadAdminServices();


            console.log(
                "Services received:",
                services
            );


            // ==================================================
            // UPDATE CATEGORY FILTER
            // ==================================================

            updateAdminServiceCategoryFilter(
                services
            );


            // ==================================================
            // SAVE SERVICES IN CACHE
            // ==================================================

            setAdminServicesCache(
                services
            );


            // ==================================================
            // UPDATE SERVICE STATISTICS
            // ==================================================

            updateAdminServiceStats(
                services
            );


            // ==================================================
            // DISPLAY SERVICES
            // ==================================================

            displayAdminServices(
                services
            );


            // ==================================================
            // SAFETY CHECK
            // ==================================================

            if (!servicesList) {

                console.error(
                    "Admin services list element not found."
                );

                return;

            }


        }


        catch (error) {

            console.error(
                "Unable to load admin services:",
                error
            );


            if (servicesList) {

                servicesList.innerHTML = `
                    <div class="empty-state">

                        <p>
                            Unable to load services.
                            Please try again.
                        </p>

                    </div>
                `;

            }

        }


        finally {

            // ==================================================
            // RESTORE BUTTON
            // ==================================================

            if (loadServicesButton) {

                loadServicesButton.disabled =
                    false;

                loadServicesButton.textContent =
                    "Refresh Services";

            }

        }

    }


    /* ========================================================================
    ADMIN — DELETE SERVICE
    ======================================================================== */

    /**
     * Deletes a service from the LocalEase platform.
     *
     * @param {string} serviceId - MongoDB service ID.
     */
    async function handleDeleteAdminService(
        serviceId
    ) {

        /* ====================================================================
        VALIDATE SERVICE ID
        ==================================================================== */

        if (!serviceId) {

            console.error(
                "Service ID not found."
            );

            alert(
                "Unable to delete service."
            );

            return;

        }


        /* ====================================================================
        FIND SERVICE NAME
        ==================================================================== */

        const service =
            adminServicesCache.find(
                item =>
                    String(
                        item._id ||
                        item.id ||
                        ""
                    ) ===
                    String(serviceId)
            );


        const serviceName =
            service?.name ||
            "this service";


        /* ====================================================================
        CONFIRM DELETE
        ==================================================================== */

        const confirmed =
            confirm(
                `Are you sure you want to delete "${serviceName}"?\n\nThis action cannot be undone.`
            );


        if (!confirmed) {

            console.log(
                "Service deletion cancelled."
            );

            return;

        }


        /* ====================================================================
        GET ADMIN TOKEN
        ==================================================================== */

        const token =
            getToken();


        if (!token) {

            console.error(
                "Admin token not found."
            );

            handleUnauthorized();

            return;

        }


        try {

            console.log(
                "🗑️ Deleting service:",
                serviceId
            );


            /* =================================================================
            DELETE SERVICE FROM BACKEND
            ================================================================= */

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/services/${serviceId}`,
                    {

                        method: "DELETE",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        }

                    }
                );


            /* =================================================================
            PARSE API RESPONSE
            ================================================================= */

            const data =
                await parseJSONResponse(
                    response
                );


            console.log(
                "Admin service delete response:",
                data
            );


            /* =================================================================
            HANDLE API ERROR
            ================================================================= */

            if (!response.ok) {

                console.error(
                    "Delete service error:",
                    data?.message ||
                    "Unable to delete service."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                    return;

                }


                alert(
                    data?.message ||
                    "Unable to delete service."
                );

                return;

            }


            /* =================================================================
            DELETE SUCCESS
            ================================================================= */

            console.log(
                "Service deleted successfully:",
                data?.service
            );


            alert(
                "Service deleted successfully ✅"
            );


            /* =================================================================
            REFRESH SERVICES
            ================================================================= */

            await handleLoadAdminServices();

        }


        catch (error) {

            console.error(
                "Delete service request failed:",
                error
            );


            alert(
                "Unable to delete service. Please try again."
            );

        }

    }

    /* ========================================================================
    ADMIN — UPDATE SERVICE STATISTICS
    ======================================================================== */

    function updateAdminServiceStats(services) {

        const totalElement =
            document.getElementById(
                "admin-total-services"
            );

        const activeElement =
            document.getElementById(
                "admin-active-services"
            );

        const inactiveElement =
            document.getElementById(
                "admin-inactive-services"
            );

        const categoriesElement =
            document.getElementById(
                "admin-total-categories"
            );


        const safeServices =
            Array.isArray(services)
                ? services
                : [];


        const total =
            safeServices.length;


        const active =
            safeServices.filter(
                service =>
                    service.isActive === true
            ).length;


        const inactive =
            safeServices.filter(
                service =>
                    service.isActive === false
            ).length;


        const categories =
            new Set(
                safeServices
                    .map(
                        service =>
                            String(
                                service.category || ""
                            )
                                .trim()
                                .toLowerCase()
                    )
                    .filter(Boolean)
            ).size;


        if (totalElement) {

            totalElement.textContent =
                total;

        }


        if (activeElement) {

            activeElement.textContent =
                active;

        }


        if (inactiveElement) {

            inactiveElement.textContent =
                inactive;

        }


        if (categoriesElement) {

            categoriesElement.textContent =
                categories;

        }

    }


        /* ========================================================================
    ADMIN — SERVICE SEARCH & CATEGORY FILTER
    ======================================================================== */

    let adminServicesCache = [];


    /**
     * Filters services using search text and category.
     */
    function filterAdminServices() {

        const searchInput =
            document.getElementById(
                "service-search"
            );

        const categoryFilter =
            document.getElementById(
                "service-category-filter"
            );


        if (
            !searchInput ||
            !categoryFilter
        ) {

            return;

        }


        const searchText =
            searchInput.value
                .trim()
                .toLowerCase();


        const selectedCategory =
            categoryFilter.value
                .trim()
                .toLowerCase();


        const filteredServices =
            adminServicesCache.filter(
                service => {

                    const name =
                        String(
                            service.name || ""
                        )
                            .trim()
                            .toLowerCase();


                    const category =
                        String(
                            service.category || ""
                        )
                            .trim()
                            .toLowerCase();


                    const matchesSearch =
                        !searchText ||
                        name.includes(searchText) ||
                        category.includes(searchText);


                    const matchesCategory =
                        selectedCategory === "all" ||
                        category === selectedCategory;


                    return (
                        matchesSearch &&
                        matchesCategory
                    );

                }
            );


        displayAdminServices(
            filteredServices
        );

    }


    /* ========================================================================
    ADMIN — DISPLAY SERVICES
    ======================================================================== */

    /**
     * Displays services on the Admin Services page.
     *
     * @param {Array} services
     */
    function displayAdminServices(services) {

        const servicesList =
            document.getElementById(
                "admin-services-list"
            );


        if (!servicesList) {

            console.error(
                "Admin services list element not found."
            );

            return;

        }


        const safeServices =
            Array.isArray(services)
                ? services
                : [];


        /* ====================================================================
        NO SERVICES
        ==================================================================== */

        if (!safeServices.length) {

            servicesList.innerHTML = `
                <div class="empty-state">

                    <p>
                        No services found.
                    </p>

                </div>
            `;

            return;

        }


        /* ====================================================================
        CREATE SERVICE CARDS
        ==================================================================== */

        servicesList.innerHTML =
            safeServices.map(
                service => {

                    const serviceId =
                        service._id ||
                        service.id ||
                        "";


                    const serviceName =
                        escapeHTML(
                            service.name ||
                            "Unnamed Service"
                        );


                    const serviceCategory =
                        escapeHTML(
                            service.category ||
                            "Uncategorized"
                        );


                    const serviceDescription =
                        escapeHTML(
                            service.description ||
                            "No description available."
                        );


                    const servicePrice =
                        Number(
                            service.price
                        );


                    const formattedPrice =
                        Number.isFinite(
                            servicePrice
                        )
                            ? `₹${servicePrice.toFixed(2)}`
                            : "₹0.00";


                    const statusText =
                        service.isActive === true
                            ? "Active ✅"
                            : "Inactive ❌";


                    const statusClass =
                        service.isActive === true
                            ? "active"
                            : "inactive";


                    return `
                        <article
                            class="admin-service-card"
                            data-service-id="${escapeHTML(serviceId)}"
                        >

                            <h3>
                                ${serviceName}
                            </h3>


                            <p>
                                <strong>Category:</strong>
                                ${serviceCategory}
                            </p>


                            <p>
                                <strong>Description:</strong>
                                ${serviceDescription}
                            </p>


                            <p>
                                <strong>Price:</strong>
                                ${formattedPrice}
                            </p>


                            <p>
                                <strong>Status:</strong>
                                <span class="service-status ${statusClass}">
                                    ${statusText}
                                </span>
                            </p>


                            <div class="admin-service-actions">
                            <button
                            type="button"
                            class="edit-service-btn"
                            data-service-id="${escapeHTML(serviceId)}"
                            >
                            <span class="service-action-icon">✎</span>
                            Edit
                            </button>
                            
                            <button
                            type="button"
                            class="delete-service-btn"
                            data-service-id="${escapeHTML(serviceId)}"
                            >
                            <span class="service-action-icon">🗑</span>
                            Delete
                            </button>

                            </div>

                        </article>
                    `;

                }
            ).join("");

    }

    /* ========================================================================
    ADMIN — SERVICE BUTTON ACTIONS
    ======================================================================== */

    /**
     * Handles clicks on Edit and Delete buttons.
     */
    function initializeAdminServiceActions() {

        const servicesList =
            document.getElementById(
                "admin-services-list"
            );


        if (!servicesList) {
            return;
        }


        /*
        * Event delegation is used because service cards
        * are created dynamically by JavaScript.
        */
        servicesList.addEventListener(
            "click",
            event => {

                /* ============================================================
                EDIT SERVICE
                ============================================================ */

                const editButton =
                    event.target.closest(
                        ".edit-service-btn"
                    );


                if (editButton) {

                    const serviceId =
                        editButton.dataset.serviceId;


                    handleEditAdminService(
                        serviceId
                    );

                    return;

                }


                /* ============================================================
                DELETE SERVICE
                ============================================================ */

                const deleteButton =
                    event.target.closest(
                        ".delete-service-btn"
                    );


                if (deleteButton) {

                    const serviceId =
                        deleteButton.dataset.serviceId;


                    handleDeleteAdminService(
                        serviceId
                    );

                    return;

                }

            }
        );

    }


/* ========================================================================
    ADMIN — EDIT SERVICE
    ======================================================================== */

    function handleEditAdminService(serviceId) {

        if (!serviceId) {

            console.error(
                "Service ID not found."
            );

            alert(
                "Unable to edit service."
            );

            return;

        }


        const service =
            adminServicesCache.find(
                item =>
                    String(
                        item._id ||
                        item.id ||
                        ""
                    ) ===
                    String(serviceId)
            );


        if (!service) {

            console.error(
                "Service not found:",
                serviceId
            );

            alert(
                "Service information not found."
            );

            return;

        }


        /*
         * Open the edit form directly when the
         * dedicated Admin Services page is open.
         */
        const editSection =
            document.getElementById(
                "edit-service-section"
            );

        const idInput =
            document.getElementById(
                "edit-service-id"
            );

        const nameInput =
            document.getElementById(
                "edit-service-name"
            );

        const categoryInput =
            document.getElementById(
                "edit-service-category"
            );

        const descriptionInput =
            document.getElementById(
                "edit-service-description"
            );

        const priceInput =
            document.getElementById(
                "edit-service-price"
            );

        const activeInput =
            document.getElementById(
                "edit-service-active"
            );


        if (
            editSection &&
            idInput &&
            nameInput &&
            categoryInput &&
            descriptionInput &&
            priceInput &&
            activeInput
        ) {

            idInput.value =
                service._id ||
                service.id ||
                serviceId;

            nameInput.value =
                service.name ||
                "";

            categoryInput.value =
                service.category ||
                "";

            descriptionInput.value =
                service.description ||
                "";

            priceInput.value =
                service.price ??
                "";

            activeInput.checked =
                service.isActive !== false;

            editSection.hidden =
                false;

            editSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            console.log(
                "Admin service edit form opened:",
                service
            );

            return;

        }


        /*
         * Open the dedicated Admin Services page
         * when the edit form is not available.
         */
        window.location.href =
            `admin-services.html?edit=${encodeURIComponent(
                service._id ||
                service.id ||
                serviceId
            )}`;

    }





    /* ========================================================================
    ADMIN — UPDATE EDITED SERVICE
    ======================================================================== */

    async function handleUpdateAdminService(event) {

        event.preventDefault();


        const idInput =
            document.getElementById(
                "edit-service-id"
            );

        const nameInput =
            document.getElementById(
                "edit-service-name"
            );

        const categoryInput =
            document.getElementById(
                "edit-service-category"
            );

        const descriptionInput =
            document.getElementById(
                "edit-service-description"
            );

        const priceInput =
            document.getElementById(
                "edit-service-price"
            );

        const activeInput =
            document.getElementById(
                "edit-service-active"
            );


        if (
            !idInput ||
            !nameInput ||
            !categoryInput ||
            !descriptionInput ||
            !priceInput ||
            !activeInput
        ) {

            console.error(
                "Edit Service form fields not found."
            );

            return;

        }


        const serviceId =
            idInput.value.trim();


        const name =
            nameInput.value.trim();


        const category =
            categoryInput.value.trim();


        const description =
            descriptionInput.value.trim();


        const price =
            Number(
                priceInput.value
            );


        const isActive =
            activeInput.checked;


        if (
            !serviceId ||
            !name ||
            !category ||
            !description
        ) {

            alert(
                "Please fill all required service fields."
            );

            return;

        }


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            alert(
                "Please enter a valid service price."
            );

            return;

        }


        const token =
            getToken();


        if (!token) {

            console.error(
                "Admin token not found."
            );

            handleUnauthorized();

            return;

        }


        const saveButton =
            document.getElementById(
                "save-edit-service-btn"
            );


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";

        }


        try {

            console.log(
                "✏️ Updating service:",
                serviceId
            );


            const response =
                await fetch(
                    `${API_BASE_URL}/admin/services/${serviceId}`,
                    {

                        method: "PUT",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                name,
                                category,
                                description,
                                price,
                                isActive

                            })

                    }
                );


            const data =
                await parseJSONResponse(
                    response
                );


            console.log(
                "Admin service update response:",
                data
            );


            if (!response.ok) {

                console.error(
                    "Update service error:",
                    data?.message ||
                    "Unable to update service."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                    return;

                }


                alert(
                    data?.message ||
                    "Unable to update service."
                );

                return;

            }


            console.log(
                "Service updated successfully:",
                data?.service
            );


            alert(
                "Service updated successfully ✅"
            );


            const editSection =
                document.getElementById(
                    "edit-service-section"
                );


            if (editSection) {

                editSection.hidden =
                    true;

            }


            await handleLoadAdminServices();

        }


        catch (error) {

            console.error(
                "Update service request failed:",
                error
            );


            alert(
                "Unable to update service. Please try again."
            );

        }


        finally {

            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "Save Changes";

            }

        }

    }




    /* ========================================================================
    ADMIN — EDIT SERVICE FORM INITIALIZATION
    ======================================================================== */

    function initializeAdminEditServiceForm() {

        const editForm =
            document.getElementById(
                "edit-service-form"
            );


        if (!editForm) {
            return;
        }


        /*
         * Prevent duplicate event listeners when
         * the Admin Services initialization runs
         * more than once.
         */
        if (
            editForm.dataset.initialized === "true"
        ) {
            return;
        }


        editForm.dataset.initialized =
            "true";


        editForm.addEventListener(
            "submit",
            handleUpdateAdminService
        );


        const cancelButton =
            document.getElementById(
                "cancel-edit-service-btn"
            );


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                function () {

                    cancelAdminServiceEdit();

                }
            );

        }


        console.log(
            "Admin Edit Service form initialized ✅"
        );

    }


    /* ========================================================================
    ADMIN — INITIALIZE EDIT SERVICE FORM
    ======================================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAdminEditServiceForm
        );

    } else {

        initializeAdminEditServiceForm();

    }


    /* ========================================================================
    ADMIN — CANCEL EDIT
    ======================================================================== */

    function cancelAdminServiceEdit() {

        const editSection =
            document.getElementById(
                "edit-service-section"
            );


        if (editSection) {

            editSection.hidden =
                true;

        }


        console.log(
            "Service editing cancelled."
        );

    }




    /* ========================================================================
    ADMIN — USER MANAGEMENT
    ======================================================================== */

    let adminUsersCache = [];


    /* ========================================================================
    RENDER ADMIN USERS
    ======================================================================== */

    function displayAdminUsers(users) {

        const usersList =
            document.getElementById(
                "admin-users-list"
            );

        if (!usersList) {
            return;
        }


        const safeUsers =
            Array.isArray(users)
                ? users
                : [];


        if (safeUsers.length === 0) {

            usersList.innerHTML = `
                <div class="empty-state">

                    <h3>
                        No users found
                    </h3>

                    <p>
                        No registered users match the current search or filter.
                    </p>

                </div>
            `;

            updateAdminUserStatistics([]);

            return;
        }


        usersList.innerHTML =
            safeUsers
                .map(function (user) {

                    const userId =
                        user._id ||
                        user.id ||
                        "";

                    const userName =
                        escapeHTML(
                            user.name ||
                            "Unknown User"
                        );

                    const userEmail =
                        escapeHTML(
                            user.email ||
                            "No email"
                        );

                    const userPhone =
                        escapeHTML(
                            user.phone ||
                            "Not provided"
                        );

                    const userRole =
                        String(
                            user.role ||
                            "customer"
                        ).toLowerCase();

                    const roleText =
                        userRole.charAt(0).toUpperCase() +
                        userRole.slice(1);

                    const isActive =
                        user.isActive !== false;

                    const statusText =
                        isActive
                            ? "Active"
                            : "Inactive";

                    const statusClass =
                        isActive
                            ? "active"
                            : "inactive";


                    return `
                        <article
                            class="admin-service-card"
                            data-user-id="${escapeHTML(String(userId))}"
                        >

                            <h3>
                                ${userName}
                            </h3>


                            <p>
                                <strong>Email:</strong>
                                ${userEmail}
                            </p>


                            <p>
                                <strong>Phone:</strong>
                                ${userPhone}
                            </p>


                            <p>
                                <strong>Role:</strong>
                                ${escapeHTML(roleText)}
                            </p>


                            <p>
                                <strong>Status:</strong>

                                <span class="service-status ${statusClass}">
                                    ${statusText}
                                </span>

                            </p>


                            <div class="admin-service-actions">

                                <button
                                    type="button"
                                    class="view-admin-user-btn"
                                    data-user-id="${escapeHTML(String(userId))}"
                                >
                                    View
                                </button>


                                <button
                                type="button"
                                class="toggle-admin-user-btn"
                                data-user-id="${escapeHTML(String(userId))}"
                                onclick="handleToggleAdminUser('${escapeHTML(String(userId))}')
                                </button>

                            </div>

                        </article>
                    `;

                })
                .join("");


        updateAdminUserStatistics(
            adminUsersCache
        );

    }


    /* ========================================================================
    UPDATE USER STATISTICS
    ======================================================================== */

    function updateAdminUserStatistics(users) {

        const safeUsers =
            Array.isArray(users)
                ? users
                : [];


        const totalUsers =
            safeUsers.length;


        const totalCustomers =
            safeUsers.filter(function (user) {

                return (
                    String(
                        user.role || ""
                    ).toLowerCase() ===
                    "customer"
                );

            }).length;


        const totalProviders =
            safeUsers.filter(function (user) {

                return (
                    String(
                        user.role || ""
                    ).toLowerCase() ===
                    "provider"
                );

            }).length;


        const totalAdmins =
            safeUsers.filter(function (user) {

                return (
                    String(
                        user.role || ""
                    ).toLowerCase() ===
                    "admin"
                );

            }).length;


        const totalElement =
            document.getElementById(
                "admin-total-users"
            );

        const customersElement =
            document.getElementById(
                "admin-total-customers"
            );

        const providersElement =
            document.getElementById(
                "admin-total-providers"
            );

        const adminsElement =
            document.getElementById(
                "admin-total-admins"
            );


        if (totalElement) {

            totalElement.textContent =
                totalUsers;

        }


        if (customersElement) {

            customersElement.textContent =
                totalCustomers;

        }


        if (providersElement) {

            providersElement.textContent =
                totalProviders;

        }


        if (adminsElement) {

            adminsElement.textContent =
                totalAdmins;

        }

    }


    /* ========================================================================
    APPLY USER SEARCH AND ROLE FILTER
    ======================================================================== */

    function applyAdminUserFilters() {

        const searchInput =
            document.getElementById(
                "user-search"
            );

        const roleFilter =
            document.getElementById(
                "user-role-filter"
            );


        const searchValue =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        const selectedRole =
            roleFilter
                ? roleFilter.value
                : "all";


        const filteredUsers =
            adminUsersCache.filter(
                function (user) {

                    const name =
                        String(
                            user.name || ""
                        ).toLowerCase();

                    const email =
                        String(
                            user.email || ""
                        ).toLowerCase();

                    const phone =
                        String(
                            user.phone || ""
                        ).toLowerCase();

                    const role =
                        String(
                            user.role || ""
                        ).toLowerCase();


                    const matchesSearch =
                        !searchValue ||
                        name.includes(searchValue) ||
                        email.includes(searchValue) ||
                        phone.includes(searchValue);


                    const matchesRole =
                        selectedRole === "all" ||
                        role === selectedRole;


                    return (
                        matchesSearch &&
                        matchesRole
                    );

                }
            );


        displayAdminUsers(
            filteredUsers
        );

    }


    /* ========================================================================
    VIEW USER DETAILS
    ======================================================================== */

    async function handleViewAdminUser(userId) {

        if (!userId) {
            return;
        }


        const detailsSection =
            document.getElementById(
                "admin-user-details-section"
            );

        const detailsContainer =
            document.getElementById(
                "admin-user-details"
            );


        if (
            !detailsSection ||
            !detailsContainer
        ) {
            return;
        }


        detailsContainer.innerHTML = `
            <p>
                Loading user details...
            </p>
        `;


        detailsSection.hidden =
            false;


        try {

            const user =
                await loadAdminUser(
                    userId
                );


            if (!user) {

                detailsContainer.innerHTML = `
                    <p>
                        User details could not be loaded.
                    </p>
                `;

                return;

            }


            detailsContainer.innerHTML = `

                <div class="user-details-card">

                    <h3>
                        ${escapeHTML(
                            user.name ||
                            "Unknown User"
                        )}
                    </h3>


                    <p>
                        <strong>Email:</strong>
                        ${escapeHTML(
                            user.email ||
                            "Not provided"
                        )}
                    </p>


                    <p>
                        <strong>Phone:</strong>
                        ${escapeHTML(
                            user.phone ||
                            "Not provided"
                        )}
                    </p>


                    <p>
                        <strong>Role:</strong>
                        ${escapeHTML(
                            user.role ||
                            "Not specified"
                        )}
                    </p>


                    <p>
                        <strong>Status:</strong>
                        ${user.isActive === false
                            ? "Inactive"
                            : "Active"}
                    </p>


                    <p>
                        <strong>User ID:</strong>
                        ${escapeHTML(
                            String(
                                user._id ||
                                user.id ||
                                ""
                            )
                        )}
                    </p>

                </div>

            `;


            detailsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });


        } catch (error) {

            console.error(
                "View admin user error:",
                error
            );


            detailsContainer.innerHTML = `
                <p>
                    Unable to load user details.
                </p>
            `;

        }

    }


    /* ========================================================================
    TOGGLE USER STATUS
    ======================================================================== */

    async function handleToggleAdminUser(userId) {
        
    console.log(
        "🔥 TOGGLE BUTTON CLICKED:",
        userId
    );

    alert("Toggle button clicked");

    if (!userId) {
        console.error("User ID is missing.");
        return;
    }

    const user =
        adminUsersCache.find(
            function (item) {

                return (
                    String(
                        item._id ||
                        item.id ||
                        ""
                    ) ===
                    String(userId)
                );

            }
        );

    if (!user) {

        console.error(
            "User not found:",
            userId
        );

        alert("User information not found.");

        return;
    }

    const currentStatus =
        user.isActive !== false;

    const newStatus =
        !currentStatus;

    const actionText =
        newStatus
            ? "activate"
            : "deactivate";

    const confirmed =
        confirm(
            `Are you sure you want to ${actionText} this user?`
        );

    if (!confirmed) {
        return;
    }

    const updatedUser =
        await updateAdminUserStatus(
            userId,
            newStatus
        );

    if (!updatedUser) {
        return;
    }

    await loadAdminUsers();

    }

    /* ========================================================================
    ADMIN USER BUTTON ACTIONS
    ======================================================================== */

    function initializeAdminUserActions() {

        const usersList =
        document.getElementById(
            "admin-users-list"
        );

    if (!usersList) {
        return;
    }

    usersList.addEventListener(
        "click",
        function (event) {

            const viewButton =
                event.target.closest(
                    ".view-admin-user-btn"
                );

            if (viewButton) {

                const userId =
                    viewButton.dataset.userId;

                handleViewAdminUser(
                    userId
                );

                return;
            }

            const toggleButton =
                event.target.closest(
                    ".toggle-admin-user-status-btn"
                );

            if (toggleButton) {

                const userId =
                    toggleButton.dataset.userId;

                handleToggleAdminUser(
                    userId
                );

                return;
            }

        }
    );

    }

    /* ========================================================================
    ADMIN USER SEARCH
    ======================================================================== */

    function initializeAdminUserSearch() {

        const searchInput =
            document.getElementById(
                "user-search"
            );

        const roleFilter =
            document.getElementById(
                "user-role-filter"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                applyAdminUserFilters
            );

        }


        if (roleFilter) {

            roleFilter.addEventListener(
                "change",
                applyAdminUserFilters
            );

        }


        console.log(
            "Admin user search initialized ✅"
        );

    }




    /* ========================================================================
    ADMIN USER DETAILS
    ======================================================================== */

    function initializeAdminUserDetails() {

        const usersList =
            document.getElementById(
                "admin-users-list"
            );


        const closeButton =
            document.getElementById(
                "close-user-details-btn"
            );


        const detailsSection =
            document.getElementById(
                "admin-user-details-section"
            );


        const detailsContainer =
            document.getElementById(
                "admin-user-details"
            );


        if (
            !usersList ||
            !closeButton ||
            !detailsSection ||
            !detailsContainer
        ) {

            return;

        }


        /* ================================================================
        VIEW USER
        ================================================================ */

        usersList.addEventListener(
            "click",
            async function (event) {

                const viewButton =
                    event.target.closest(
                        ".view-admin-user-btn"
                    );


                if (!viewButton) {
                    return;
                }


                const userId =
                    viewButton.dataset.userId;


                if (!userId) {

                    console.error(
                        "User ID not found."
                    );

                    alert(
                        "Unable to view user."
                    );

                    return;

                }


                detailsContainer.innerHTML = `
                    <p>
                        Loading user details...
                    </p>
                `;


                detailsSection.hidden =
                    false;


                detailsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


                const token =
                    getToken();


                if (!token) {

                    console.error(
                        "Admin token not found."
                    );

                    handleUnauthorized();

                    return;

                }


                try {

                    console.log(
                        "👤 Loading user details:",
                        userId
                    );


                    const response =
                        await fetch(
                            `${API_BASE_URL}/admin/users/${userId}`,
                            {

                                method: "GET",

                                headers: {

                                    "Authorization":
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json"

                                }

                            }
                        );


                    const data =
                        await parseJSONResponse(
                            response
                        );


                    console.log(
                        "Admin user details response:",
                        data
                    );


                    if (!response.ok) {

                        console.error(
                            "User details error:",
                            data?.message ||
                            "Unable to load user details."
                        );


                        if (
                            response.status === 401
                        ) {

                            handleUnauthorized();

                            return;

                        }


                        detailsContainer.innerHTML = `
                            <div class="empty-state">
                                <p>
                                    ${
                                        data?.message ||
                                        "Unable to load user details."
                                    }
                                </p>
                            </div>
                        `;

                        return;

                    }


                    const user =
                        data?.user;


                    if (!user) {

                        detailsContainer.innerHTML = `
                            <div class="empty-state">
                                <p>
                                    User information not found.
                                </p>
                            </div>
                        `;

                        return;

                    }


                    const userRole =
                        user.role ||
                        "customer";


                    const roleLabel =
                        userRole.charAt(0).toUpperCase() +
                        userRole.slice(1);


                    const isActive =
                        user.isActive !== false;


                    const statusLabel =
                        isActive
                            ? "Active"
                            : "Inactive";


                    const createdDate =
                        user.createdAt
                            ? new Date(
                                user.createdAt
                            ).toLocaleString()
                            : "Not available";


                    const updatedDate =
                        user.updatedAt
                            ? new Date(
                                user.updatedAt
                            ).toLocaleString()
                            : "Not available";


                    detailsContainer.innerHTML = `

                        <div class="request-card admin-user-details-card">

                            <h3>
                                ${user.name || "Unknown User"}
                            </h3>

                            <p>
                                <strong>Email:</strong>
                                ${user.email || "Not provided"}
                            </p>

                            <p>
                                <strong>Phone:</strong>
                                ${user.phone || "Not provided"}
                            </p>

                            <p>
                                <strong>Role:</strong>
                                ${roleLabel}
                            </p>

                            <p>
                                <strong>Status:</strong>
                                ${statusLabel}
                            </p>

                            <p>
                                <strong>User ID:</strong>
                                ${user._id || user.id || "Not available"}
                            </p>

                            <p>
                                <strong>Registered:</strong>
                                ${createdDate}
                            </p>

                            <p>
                                <strong>Last Updated:</strong>
                                ${updatedDate}
                            </p>

                        </div>

                    `;


                    console.log(
                        "Admin user details loaded:",
                        user
                    );

                }


                catch (error) {

                    console.error(
                        "Admin user details request failed:",
                        error
                    );


                    detailsContainer.innerHTML = `
                        <div class="empty-state">
                            <p>
                                Unable to load user details.
                            </p>
                        </div>
                    `;

                }

            }
        );


        /* ================================================================
        CLOSE USER DETAILS
        ================================================================ */

        closeButton.addEventListener(
            "click",
            function () {

                detailsSection.hidden =
                    true;

            }
        );

    }


    /* ========================================================================
    ADMIN USERS PAGE INITIALIZATION
    ======================================================================== */

    function initializeAdminUsersPage() {

        const usersList =
            document.getElementById(
                "admin-users-list"
            );


        if (!usersList) {
            return;
        }


        initializeAdminUserActions();

        initializeAdminUserSearch();

        initializeAdminUserDetails();


        const refreshButton =
            document.getElementById(
                "load-users-btn"
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                function () {

                    console.log(
                        "Refresh Users clicked ✅"
                    );

                    loadAdminUsers();

                }
            );

        }


        console.log(
            "Admin Users page initialized ✅"
        );


        loadAdminUsers();

    }


    /* ========================================================================
    ADMIN USERS PAGE START
    ======================================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAdminUsersPage
        );

    } else {

        initializeAdminUsersPage();

    }


    /* ========================================================================
    ADMIN — INITIALIZE CREATE SERVICE FORM
    ======================================================================== */

    /**
     * Connects the Create Service form with
     * the Admin Create Service handler.
     */
    function initializeAdminCreateService() {

        const createServiceForm =
            document.getElementById(
                "create-service-form"
            );


        // If this is not the Admin Services page,
        // do nothing.
        if (!createServiceForm) {
            return;
        }


        console.log(
            "Admin Create Service form initialized ✅"
        );


        createServiceForm.addEventListener(
            "submit",
            handleCreateAdminService
        );

    }


    /* ========================================================================
    ADMIN — CREATE SERVICE
    ======================================================================== */

    /**
     * Creates a new service through the Admin Services API.
     */
    async function handleCreateAdminService(event) {

        event.preventDefault();


        /* ====================================================================
        GET FORM ELEMENTS
        ==================================================================== */

        const form =
            document.getElementById(
                "create-service-form"
            );

        const createButton =
            document.getElementById(
                "create-service-btn"
            );


        if (!form) {

            console.error(
                "Create service form not found."
            );

            return;

        }


        /* ====================================================================
        GET INPUT VALUES
        ==================================================================== */

        const nameInput =
            document.getElementById(
                "create-service-name"
            );

        const categoryInput =
            document.getElementById(
                "create-service-category"
            );

        const descriptionInput =
            document.getElementById(
                "create-service-description"
            );

        const priceInput =
            document.getElementById(
                "create-service-price"
            );

        const activeInput =
            document.getElementById(
                "create-service-active"
            );


        const name =
            nameInput?.value.trim() || "";

        const category =
            categoryInput?.value.trim() || "";

        const description =
            descriptionInput?.value.trim() || "";

        const price =
            Number(
                priceInput?.value
            );

        const isActive =
            activeInput
                ? activeInput.checked
                : true;


        /* ====================================================================
        VALIDATE INPUT
        ==================================================================== */

        if (
            !name ||
            !category ||
            !description
        ) {

            alert(
                "Please fill all required fields."
            );

            return;

        }


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            alert(
                "Please enter a valid service price."
            );

            return;

        }


        /* ====================================================================
        GET ADMIN TOKEN
        ==================================================================== */

        const token =
            getToken();


        if (!token) {

            console.error(
                "Admin token not found."
            );

            handleUnauthorized();

            return;

        }


        /* ====================================================================
        PREVENT MULTIPLE SUBMISSIONS
        ==================================================================== */

        if (createButton) {

            createButton.disabled = true;

            createButton.textContent =
                "Creating...";

        }


        try {

            console.log(
                "➕ Creating service..."
            );


            /* ================================================================
            CREATE SERVICE API REQUEST
            ================================================================ */

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/services`,
                    {

                        method: "POST",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                name,
                                category,
                                description,
                                price,
                                isActive

                            })

                    }
                );


            /* ================================================================
            PARSE RESPONSE
            ================================================================ */

            const data =
                await parseJSONResponse(
                    response
                );


            console.log(
                "Admin service create response:",
                data
            );


            /* ================================================================
            HANDLE API ERROR
            ================================================================ */

            if (!response.ok) {

                console.error(
                    "Create service error:",
                    data?.message ||
                    "Unable to create service."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                    return;

                }


                alert(
                    data?.message ||
                    "Unable to create service."
                );

                return;

            }


            /* ================================================================
            SUCCESS
            ================================================================ */

            console.log(
                "Service created successfully:",
                data?.service
            );


            alert(
                "Service created successfully ✅"
            );


            /* ================================================================
            RESET FORM
            ================================================================ */

            form.reset();


            if (activeInput) {

                activeInput.checked =
                    true;

            }


            /* ================================================================
            REFRESH SERVICE LIST
            ================================================================ */

            await handleLoadAdminServices();

        }


        catch (error) {

            console.error(
                "Create service request failed:",
                error
            );


            alert(
                "Unable to create service. Please try again."
            );

        }


        finally {

            if (createButton) {

                createButton.disabled =
                    false;

                createButton.textContent =
                    "Create Service";

            }

        }

    }


    /* ========================================================================
    INITIALIZE ADMIN SERVICE ACTIONS
    ======================================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAdminServiceActions
        );

    } else {

        initializeAdminServiceActions();

    }

    /* ========================================================================
    ADMIN — UPDATE CATEGORY FILTER
    ======================================================================== */

    /**
     * Updates the category dropdown dynamically from
     * the services returned by the backend.
     */
    function updateAdminServiceCategoryFilter(
        services
    ) {

        const categoryFilter =
            document.getElementById(
                "service-category-filter"
            );


        if (!categoryFilter) {

            return;

        }


        const currentValue =
            categoryFilter.value;


        const categories =
            [
                ...new Set(
                    (
                        Array.isArray(services)
                            ? services
                            : []
                    )
                        .map(
                            service =>
                                String(
                                    service.category || ""
                                ).trim()
                        )
                        .filter(Boolean)
                )
            ]
            .sort(
                (a, b) =>
                    a.localeCompare(
                        b
                    )
            );


        /* ====================================================================
        KEEP "ALL CATEGORIES"
        ==================================================================== */

        categoryFilter.innerHTML = `
            <option value="all">
                All Categories
            </option>
        `;


        /* ====================================================================
        ADD REAL DATABASE CATEGORIES
        ==================================================================== */

        categories.forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category
                        .trim()
                        .toLowerCase();


                option.textContent =
                    category;


                categoryFilter.appendChild(
                    option
                );

            }
        );


        /* ====================================================================
        RESTORE PREVIOUS SELECTION
        ==================================================================== */

        const availableValues =
            Array.from(
                categoryFilter.options
            ).map(
                option =>
                    option.value
            );


        if (
            availableValues.includes(
                currentValue
            )
        ) {

            categoryFilter.value =
                currentValue;

        } else {

            categoryFilter.value =
                "all";

        }

    }


    /* ========================================================================
    ADMIN — INITIALIZE SEARCH & FILTER
    ======================================================================== */

    /**
     * Initializes Admin Services search and category filter.
     */
    function initializeAdminServiceFilters() {

        const searchInput =
            document.getElementById(
                "service-search"
            );

        const categoryFilter =
            document.getElementById(
                "service-category-filter"
            );


        /* ====================================================================
        SEARCH INPUT
        ==================================================================== */

        if (searchInput) {

            /*
            * Prevent duplicate event listeners.
            */
            if (searchInput._adminSearchInputHandler) {

                searchInput.removeEventListener(
                    "input",
                    searchInput._adminSearchInputHandler
                );

            }


            if (searchInput._adminSearchKeyHandler) {

                searchInput.removeEventListener(
                    "keydown",
                    searchInput._adminSearchKeyHandler
                );

            }


            /*
            * Filter while typing.
            */
            const searchInputHandler =
                function () {

                    filterAdminServices();

                };


            /*
            * Prevent Enter from submitting the page/form.
            */
            const searchKeyHandler =
                function (event) {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        filterAdminServices();

                    }

                };


            searchInput._adminSearchInputHandler =
                searchInputHandler;


            searchInput._adminSearchKeyHandler =
                searchKeyHandler;


            searchInput.addEventListener(
                "input",
                searchInputHandler
            );


            searchInput.addEventListener(
                "keydown",
                searchKeyHandler
            );

        }


        /* ====================================================================
        CATEGORY FILTER
        ==================================================================== */

        if (categoryFilter) {

            /*
            * Prevent duplicate category listeners.
            */
            if (
                categoryFilter._adminCategoryHandler
            ) {

                categoryFilter.removeEventListener(
                    "change",
                    categoryFilter._adminCategoryHandler
                );

            }


            const categoryHandler =
                function () {

                    filterAdminServices();

                };


            categoryFilter._adminCategoryHandler =
                categoryHandler;


            categoryFilter.addEventListener(
                "change",
                categoryHandler
            );

        }

    }


    /* ========================================================================
    ADMIN — UPDATE SERVICES CACHE
    ======================================================================== */

    /**
     * Stores the latest services returned by the backend.
     *
     * @param {Array} services
     */
    function setAdminServicesCache(
        services
    ) {

        adminServicesCache =
            Array.isArray(services)
                ? services
                : [];


        console.log(
            "Admin services cache updated:",
            adminServicesCache.length
        );

    }


    /* ========================================================================
    ADMIN — SERVICES PAGE SEARCH INITIALIZATION
    ======================================================================== */

    /**
     * Initializes search and category filtering
     * only when the related Admin Services elements exist.
     */
    function initializeAdminServiceSearch() {

        const searchInput =
            document.getElementById(
                "service-search"
            );

        const categoryFilter =
            document.getElementById(
                "service-category-filter"
            );


        /*
        * If neither element exists, this is not
        * the Admin Services page.
        */
        if (
            !searchInput &&
            !categoryFilter
        ) {

            return;

        }


        console.log(
            "Admin service search initialized ✅"
        );


        initializeAdminServiceFilters();

    }


    /*
    * Initialize after DOM is ready.
    */
    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAdminServiceSearch,
            {
                once: true
            }
        );

    } else {

        initializeAdminServiceSearch();

    }


    /* ========================================================================
    GET LOGGED-IN USER PROFILE
    ======================================================================== */

    /**
     * Retrieves the profile of the currently authenticated user.
     *
     * @returns {Object|null}
     */
    async function loadMyProfile() {

        const token =
            getToken();


        if (!token) {

            console.error(
                "Authentication token not found."
            );

            return null;

        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/auth/me`,
                    {

                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        }

                    }
                );


            const data =
                await parseJSONResponse(
                    response
                );


            if (!response.ok) {

                console.error(
                    "Profile error:",
                    data?.message ||
                    "Unable to load profile."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                }


                return null;

            }


            console.log(
                "My profile:",
                data?.user
            );


            return data?.user || null;

        }


        catch (error) {

            console.error(
                "Profile request failed:",
                error
            );


            return null;

        }

    }



    /* ========================================================================
    UPDATE MY PROFILE
    ======================================================================== */

    /**
     * Updates the authenticated user's name and phone number.
     *
     * @param {string} name
     * @param {string} phone
     * @returns {Object|null}
     */
    async function updateMyProfile(
        name,
        phone
    ) {

        const cleanName =
            typeof name === "string"
                ? name.trim()
                : "";


        const cleanPhone =
            typeof phone === "string"
                ? phone.trim()
                : "";


        if (
            !cleanName ||
            !cleanPhone
        ) {

            console.error(
                "Name and phone are required."
            );

            return null;

        }


        const token =
            getToken();


        if (!token) {

            console.error(
                "Authentication token not found."
            );

            return null;

        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/auth/me`,
                    {

                        method: "PUT",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                name:
                                    cleanName,

                                phone:
                                    cleanPhone

                            })

                    }
                );


            const data =
                await parseJSONResponse(
                    response
                );


            if (!response.ok) {

                console.error(
                    "Profile update error:",
                    data?.message ||
                    "Unable to update profile."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                }


                return null;

            }


            console.log(
                "Profile updated:",
                data?.user
            );


            if (data?.user) {

                saveUser(
                    data.user
                );

            }


            return data?.user || null;

        }


        catch (error) {

            console.error(
                "Profile update request failed:",
                error
            );


            return null;

        }

    }


    /* ========================================================================
    CHANGE PASSWORD
    ======================================================================== */

    /**
     * Changes the authenticated user's password.
     *
     * @param {string} currentPassword
     * @param {string} newPassword
     * @returns {Object|null}
     */
    async function changePassword(
        currentPassword,
        newPassword
    ) {

        if (
            !currentPassword ||
            !newPassword
        ) {

            console.error(
                "Current password and new password are required."
            );

            return null;

        }


        const token =
            getToken();


        if (!token) {

            console.error(
                "Authentication token not found."
            );

            return null;

        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/auth/change-password`,
                    {

                        method: "PUT",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                currentPassword,
                                newPassword

                            })

                    }
                );


            const data =
                await parseJSONResponse(
                    response
                );


            if (!response.ok) {

                console.error(
                    "Change password error:",
                    data?.message ||
                    "Unable to change password."
                );


                if (
                    response.status === 401
                ) {

                    handleUnauthorized();

                }


                return null;

            }


            console.log(
                "Password changed successfully."
            );


            return data;

        }


        catch (error) {

            console.error(
                "Change password request failed:",
                error
            );


            return null;

        }

    }


    /* ========================================================================
    AUTHENTICATION STATE CHECK
    ======================================================================== */

    /**
     * Checks whether an authentication token exists.
     *
     * @returns {boolean}
     */
    function isLoggedIn() {

        const token =
            getToken();


        return Boolean(
            token
        );

    }


    /* ========================================================================
    GET SAVED USER
    ======================================================================== */

    /**
     * Retrieves the locally stored user object.
     *
     * @returns {Object|null}
     */
    function getSavedUser() {

        try {

            const user =
                localStorage.getItem(
                    "localeaseUser"
                );


            if (!user) {

                return null;

            }


            const parsedUser =
                JSON.parse(
                    user
                );


            if (
                !parsedUser ||
                typeof parsedUser !== "object"
            ) {

                return null;

            }


            return parsedUser;

        }


        catch (error) {

            console.error(
                "Unable to read saved user:",
                error
            );


            return null;

        }

    }


    /* ========================================================================
    SAVE USER
    ======================================================================== */

    /**
     * Stores authenticated user information.
     *
     * @param {Object} user
     */
    function saveUser(user) {

        if (
            !user ||
            typeof user !== "object"
        ) {

            return;

        }


        try {

            localStorage.setItem(
                "localeaseUser",
                JSON.stringify(user)
            );

        }


        catch (error) {

            console.error(
                "Unable to save user:",
                error
            );

        }

    }


    /* ========================================================================
    CLEAR AUTHENTICATION DATA
    ======================================================================== */

    function clearAuthData() {

        localStorage.removeItem(
            "localeaseToken"
        );


        localStorage.removeItem(
            "localeaseUser"
        );

    }


    /* ========================================================================
    LOGOUT
    ======================================================================== */

    function logout() {

        clearAuthData();


        console.log(
            "Logged out successfully."
        );


        window.location.href =
            "login.html";

    }


    /* ========================================================================
    ROLE CHECK
    ======================================================================== */

    function hasRole(role) {

        if (!role) {

            return false;

        }


        const user =
            getSavedUser();


        if (!user) {

            return false;

        }


        return (
            String(user.role)
                .toLowerCase() ===
            String(role)
                .toLowerCase()
        );

    }


    /* ========================================================================
    ADMIN ROLE CHECK
    ======================================================================== */

    function isAdmin() {

        return hasRole(
            "admin"
        );

    }


    /* ========================================================================
    PROVIDER ROLE CHECK
    ======================================================================== */

    function isProvider() {

        return hasRole(
            "provider"
        );

    }


    /* ========================================================================
    CUSTOMER ROLE CHECK
    ======================================================================== */

    function isCustomer() {

        return hasRole(
            "customer"
        );

    }


    /* ========================================================================
    REQUIRE LOGIN
    ======================================================================== */

    function requireLogin() {

        if (!isLoggedIn()) {

            window.location.href =
                "login.html";


            return false;

        }


        return true;

    }


    /* ========================================================================
    REQUIRE ADMIN
    ======================================================================== */

    function requireAdmin() {

        if (!isLoggedIn()) {

            window.location.href =
                "login.html";


            return false;

        }


        if (!isAdmin()) {

            alert(
                "Access denied. Admin account required."
            );


            window.location.href =
                "index.html";


            return false;

        }


        return true;

    }


    /* ========================================================================
    FORMAT PRICE
    ======================================================================== */

    function formatPrice(price) {

        const amount =
            Number(price);


        if (
            !Number.isFinite(amount)
        ) {

            return "₹0";

        }


        return `₹${amount.toLocaleString(
            "en-IN"
        )}`;

    }


    /* ========================================================================
    FORMAT DATE
    ======================================================================== */

    function formatDate(dateValue) {

        if (!dateValue) {

            return "-";

        }


        const date =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";

        }


        return date.toLocaleDateString(
            "en-IN",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"

            }
        );

    }


    /* ========================================================================
    FORMAT DATE AND TIME
    ======================================================================== */

    function formatDateTime(dateValue) {

        if (!dateValue) {

            return "-";

        }


        const date =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";

        }


        return date.toLocaleString(
            "en-IN",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        );

    }


    /* ========================================================================
    CAPITALIZE TEXT
    ======================================================================== */

    function capitalizeText(text) {

        if (
            text === null ||
            text === undefined ||
            text === ""
        ) {

            return "";

        }


        const value =
            String(text);


        return (
            value.charAt(0).toUpperCase() +
            value.slice(1)
        );

    }


    /* ========================================================================
    SAFE HTML ESCAPING
    ======================================================================== */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* ========================================================================
    SAFE JSON RESPONSE PARSER
    ======================================================================== */

    async function parseJSONResponse(response) {

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            return await response.json();

        }


        const text =
            await response.text();


        if (!text) {

            return {};

        }


        try {

            return JSON.parse(
                text
            );

        }


        catch (error) {

            console.warn(
                "Server returned non-JSON response."
            );


            return {
                message:
                    text
            };

        }

    }


    /* ========================================================================
    ADMIN BOOKINGS PAGE INITIALIZATION
    ======================================================================== */

    async function initializeAdminBookingsPage() {

        const bookingsContainer =
            document.querySelector(
                "#admin-bookings-list"
            );

        if (!bookingsContainer) {
            return;
        }

        console.log(
            "Admin Bookings page initialized ✅"
        );

        const bookings =
            await loadAdminBookings();

        console.log(
            "Admin bookings received:",
            bookings
        );



            /* ================================================================
        UPDATE BOOKING STATISTICS
        ================================================================ */

        const totalBookings =
            bookings.length;

        const pendingBookings =
            bookings.filter(
                (booking) =>
                    booking.status === "pending"
            ).length;

        const confirmedBookings =
            bookings.filter(
                (booking) =>
                    booking.status === "confirmed"
            ).length;

        const completedBookings =
            bookings.filter(
                (booking) =>
                    booking.status === "completed"
            ).length;


        const totalBookingsElement =
            document.querySelector(
                "#admin-total-bookings"
            );

        const pendingBookingsElement =
            document.querySelector(
                "#admin-pending-bookings"
            );

        const confirmedBookingsElement =
            document.querySelector(
                "#admin-confirmed-bookings"
            );

        const completedBookingsElement =
            document.querySelector(
                "#admin-completed-bookings"
            );


        if (totalBookingsElement) {

            totalBookingsElement.textContent =
                totalBookings;

        }


        if (pendingBookingsElement) {

            pendingBookingsElement.textContent =
                pendingBookings;

        }


        if (confirmedBookingsElement) {

            confirmedBookingsElement.textContent =
                confirmedBookings;

        }


        if (completedBookingsElement) {

            completedBookingsElement.textContent =
                completedBookings;

        }


        console.log(
            "Admin booking statistics updated:",
            {
                total: totalBookings,
                pending: pendingBookings,
                confirmed: confirmedBookings,
                completed: completedBookings
            }
        );

        

        /* ================================================================
        RENDER BOOKINGS FROM DATABASE
        ================================================================ */

        bookingsContainer.innerHTML = "";


        if (!bookings.length) {

            bookingsContainer.innerHTML = `
                <article class="request-card">

                    <h3>
                        No Bookings Found
                    </h3>

                    <p>
                        There are currently no bookings available.
                    </p>

                </article>
            `;

            return;

        }


        bookings.forEach(
            (booking) => {

                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "request-card";


                /* ========================================================
                BOOKING DATA
                ======================================================== */

                const serviceName =
                    booking.service?.name ||
                    booking.service?.title ||
                    "Service";

                const customerName =
                    booking.customer?.name ||
                    "N/A";

                const providerName =
                    booking.provider?.name ||
                    "Not Assigned";

                const location =
                    booking.address ||
                    "N/A";

                const amount =
                    booking.totalPrice ??
                    0;

                const status =
                    booking.status ||
                    "pending";


                /* ========================================================
                DATE
                ======================================================== */

                let bookingDate =
                    "N/A";

                let bookingTime =
                    "N/A";


                if (booking.bookingDate) {

                    const date =
                        new Date(
                            booking.bookingDate
                        );

                    if (
                        !isNaN(
                            date.getTime()
                        )
                    ) {

                        bookingDate =
                            date.toLocaleDateString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric"
                                }
                            );


                        bookingTime =
                            date.toLocaleTimeString(
                                "en-IN",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            );

                    }

                }


                /* ========================================================
                STATUS DISPLAY
                ======================================================== */

                const formattedStatus =
                    status
                        .replace(
                            /-/g,
                            " "
                        )
                        .replace(
                            /\b\w/g,
                            (char) =>
                                char.toUpperCase()
                        );


                /* ========================================================
                CARD HTML
                ======================================================== */

                card.innerHTML = `

                    <h3>
                        ${serviceName}
                    </h3>

                    <p>
                        <strong>Customer:</strong>
                        ${customerName}
                    </p>

                    <p>
                        <strong>Provider:</strong>
                        ${providerName}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${location}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${bookingDate}
                    </p>

                    <p>
                        <strong>Time:</strong>
                        ${bookingTime}
                    </p>

                    <p>
                        <strong>Amount:</strong>
                        ₹${amount}
                    </p>

                    <p>
                        <strong>Status:</strong>

                        <span class="booking-status ${status}">
                        ${formattedStatus}
                        </span>

                    </p>

                    <div class="request-actions">

                        <button
                            type="button"
                            class="view-booking-btn"
                            data-booking-id="${booking._id}">
                            View
                        </button>

                        ${
                            status !== "completed" &&
                            status !== "cancelled"
                                ? `
                                    <button
                                        type="button"
                                        class="reject-btn cancel-booking-btn"
                                        data-booking-id="${booking._id}">
                                        Cancel
                                    </button>
                                `
                                : ""
                        }

                    </div>

                `;


                bookingsContainer.appendChild(
                    card
                );

            }
        );


        console.log(
            `Admin bookings rendered: ${bookings.length} ✅`
        );

    }


    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminBookingsPage
    );


    async function loadMyBookingsPage() {
    const bookingsContainer = document.querySelector(".bookings-list");

    if (!bookingsContainer) {
        return;
    }

    if (!requireLogin()) {
        return;
    }

    try {
        console.log("Loading customer bookings...");

        bookingsContainer.innerHTML = "<p>Loading your bookings...</p>";

        const data = await apiRequest("/bookings/my-bookings", {
            method: "GET"
        });

        console.log("Customer bookings response:", data);

        if (!data || !data.success) {
            throw new Error(
                data && data.message
                    ? data.message
                    : "Unable to load bookings."
            );
        }

        renderMyBookings(data.bookings || [], bookingsContainer);
    } catch (error) {
        console.error("Customer bookings error:", error);

        if (error && error.status === 401) {
            handleUnauthorized();
            return;
        }

        bookingsContainer.innerHTML =
            "<p>Unable to load your bookings. Please try again.</p>";
    }
}

function renderMyBookings(bookings, bookingsContainer) {
    if (!bookingsContainer) {
        return;
    }

    if (!Array.isArray(bookings) || bookings.length === 0) {
        bookingsContainer.innerHTML =
            "<p class=\"no-bookings\">You have no bookings yet.</p>";
        return;
    }

    let html = "";

    bookings.forEach(function (booking) {
        const service = booking.service || {};
        const provider = booking.provider || {};
        const status = normalizeBookingStatus(booking.status);

        html +=
            "<article class=\"booking-card\" data-status=\"" +
            escapeHtml(status) +
            "\">" +

            "<div class=\"booking-card-header\">" +

            "<h3>" +
            escapeHtml(service.name || "Service") +
            "</h3>" +

            "<span class=\"booking-status " +
            escapeHtml(status) +
            "\">" +
            escapeHtml(formatBookingStatus(status)) +
            "</span>" +

            "</div>" +

            "<div class=\"booking-card-details\">" +

            "<p>" +
            "<strong>Booking ID:</strong> #" +
            escapeHtml(booking._id || "N/A") +
            "</p>" +

            "<p>" +
            "<strong>Booking Date:</strong> " +
            escapeHtml(formatDate(booking.bookingDate)) +
            "</p>" +

            "<p>" +
            "<strong>Provider:</strong> " +
            escapeHtml(provider.name || "Not assigned") +
            "</p>" +

            "<p>" +
            "<strong>Address:</strong> " +
            escapeHtml(booking.address || "N/A") +
            "</p>" +

            "<p>" +
            "<strong>Total Price:</strong> " +
            escapeHtml(formatPrice(booking.totalPrice)) +
            "</p>" +

            "</div>" +

            "<div class=\"booking-card-actions\">" +

            "<button " +
            "type=\"button\" " +
            "class=\"view-booking-btn\" " +
            "data-booking-id=\"" +
            escapeHtml(booking._id || "") +
            "\">" +

            "View Details" +

            "</button>" +

                        (
                status === "pending"
                    ? "<button " +
                      "type=\"button\" " +
                      "class=\"reject-btn cancel-booking-btn\" " +
                      "data-booking-id=\"" +
                      escapeHtml(booking._id || "") +
                      "\">" +
                      "Cancel Booking" +
                      "</button>"
                    : ""
            ) +

            (
                status === "completed"
                    ? "<a " +
                      "href=\"reviews.html\" " +
                      "class=\"view-booking-btn review-booking-btn\" " +
                      "data-booking-id=\"" +
                      escapeHtml(booking._id || "") +
                      "\">" +
                      "Leave Review" +
                      "</a>"
                    : ""
            ) +

            "</div>" +

            "</article>";
    });

    bookingsContainer.innerHTML = html;

    const viewButtons =
        bookingsContainer.querySelectorAll(".view-booking-btn");

    viewButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const bookingId =
                button.getAttribute("data-booking-id");

            if (!bookingId) {
                console.warn("Booking ID not found.");
                return;
            }

            localStorage.setItem(
                CURRENT_BOOKING_KEY,
                bookingId
            );

            window.location.href = "booking-status.html";
        });
    });
}

async function cancelCustomerBooking(bookingId) {

    if (!bookingId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to cancel this booking?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const data =
            await apiRequest(
                `/bookings/${encodeURIComponent(
                    bookingId
                )}/cancel`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            reason:
                                "Booking cancelled by customer."
                        })
                }
            );


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                data?.message ||
                "Unable to cancel booking."
            );

        }


        alert(
            "Booking cancelled successfully."
        );


        await loadMyBookingsPage();

    } catch (error) {

        console.error(
            "Customer booking cancellation error:",
            error
        );


        if (
            error &&
            error.status === 401
        ) {

            handleUnauthorized();

            return;
        }


        alert(
            error?.message ||
            "Unable to cancel booking."
        );

    }

}


/* ========================================================================
   CUSTOMER BOOKING CANCELLATION HANDLERS
   ======================================================================== */

function initializeCustomerBookingCancellation() {

    const bookingsContainer =
        document.querySelector(
            ".bookings-list"
        );


    if (!bookingsContainer) {
        return;
    }


    bookingsContainer.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".cancel-booking-btn"
                );


            if (!button) {
                return;
            }


            event.preventDefault();


            const bookingId =
                button.getAttribute(
                    "data-booking-id"
                );


            cancelCustomerBooking(
                bookingId
            );

        }
    );

}


/* ========================================================================
   CUSTOMER BOOKING CANCELLATION INITIALIZATION
   ======================================================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCustomerBookingCancellation
    );

} else {

    initializeCustomerBookingCancellation();

}


function initializeBookingFilters() {
    const filterButtons =
        document.querySelectorAll(".booking-filter");

    const bookingsContainer =
        document.querySelector(".bookings-list");

    if (!filterButtons.length || !bookingsContainer) {
        return;
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {

            filterButtons.forEach(function (filterButton) {
                filterButton.classList.remove("active");
            });

            button.classList.add("active");

            const selectedStatus =
                button.getAttribute("data-status") || "all";

            const bookingCards =
                bookingsContainer.querySelectorAll(".booking-card");

            bookingCards.forEach(function (card) {
                const cardStatus =
                    card.getAttribute("data-status");

                if (
                    selectedStatus === "all" ||
                    cardStatus === selectedStatus
                ) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });
}

function initializeMyBookingsPage() {
    const bookingsContainer =
        document.querySelector(".bookings-list");

    if (!bookingsContainer) {
        return;
    }

    console.log("My Bookings page initialized");

    loadMyBookingsPage();
    initializeBookingFilters();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeMyBookingsPage
    );
} else {
    initializeMyBookingsPage();
}


/* ========================================================================
   ADMIN DASHBOARD QUICK ACTIONS
   Provides navigation from the administrator dashboard to management pages.
   ======================================================================== */

function getAdminSectionByHeading(headingText) {

    const sections =
        document.querySelectorAll(
            "main > .admin-section, main > section, main section"
        );

    const targetText =
        String(headingText || "")
            .trim()
            .toLowerCase();


    for (const section of sections) {

        const heading =
            section.querySelector("h2");


        if (
            heading &&
            heading.textContent
                .trim()
                .toLowerCase()
                .includes(targetText)
        ) {

            return section;

        }

    }


    return null;
}

function scrollToAdminSectionByHeading(headingText) {

    const section =
        getAdminSectionByHeading(
            headingText
        );

    if (!section) {

        console.warn(
            "Admin section not found:",
            headingText
        );

        return;
    }

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function initializeAdminDashboardQuickActions() {

    const actions = [
        {
            id: "manage-users-btn",
            heading: "User Management"
        },
        {
            id: "manage-bookings-btn",
            heading: "Booking Management"
        },
        {
            id: "manage-services-btn",
            heading: "Service Management"
        },
        {
            id: "manage-reviews-btn",
            heading: "Review Management"
        }
    ];

    actions.forEach(function (action) {

        const button =
            document.getElementById(
                action.id
            );

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                scrollToAdminSectionByHeading(
                    action.heading
                );

            }
        );
    });

}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminDashboardQuickActions
    );

} else {

    initializeAdminDashboardQuickActions();

}


/* ========================================================================
   ADMIN REVIEWS MANAGEMENT
   Loads, renders, views, and manages customer reviews on the Admin Reviews page.
   ======================================================================== */

function renderAdminReviews(reviews, container) {

    if (!container) {
        return;
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
        container.innerHTML =
            '<p>No customer reviews found.</p>';

        updateAdminReviewStats([]);

        return;
    }

    updateAdminReviewStats(reviews);

    container.innerHTML = reviews.map(
        review => {

            const customer =
                review.customer || {};

            const service =
                review.service || {};

            const provider =
                review.provider ||
                (review.booking && review.booking.provider) ||
                {};

            const customerName =
                customer.name ||
                review.customerName ||
                "Unknown Customer";

            const customerEmail =
                customer.email ||
                review.customerEmail ||
                "Not provided";

            const serviceName =
                service.name ||
                review.serviceName ||
                "Unknown Service";

            const providerName =
                provider.name ||
                review.providerName ||
                "Not provided";

            const rating =
                Number(review.rating) || 0;

            const comment =
                review.comment ||
                "No comment provided.";

            const reviewDate =
                review.createdAt ||
                review.updatedAt ||
                review.date;

            const reviewId =
                review._id ||
                review.id ||
                "";

            const stars =
                "★".repeat(
                    Math.max(
                        0,
                        Math.min(5, rating)
                    )
                ) +
                "☆".repeat(
                    Math.max(
                        0,
                        5 - Math.min(5, rating)
                    )
                );

            return `
                <article class="admin-card">

                    <h3>
                        ${escapeHtml(serviceName)}
                    </h3>

                    <p>
                        <strong>Customer:</strong>
                        ${escapeHtml(customerName)}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${escapeHtml(customerEmail)}
                    </p>

                    <p>
                        <strong>Provider:</strong>
                        ${escapeHtml(providerName)}
                    </p>

                    <p>
                        <strong>Rating:</strong>
                        ${stars}
                        (${rating}/5)
                    </p>

                    <p>
                        <strong>Comment:</strong>
                        ${escapeHtml(comment)}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${escapeHtml(
                            reviewDate
                                ? formatDateTime(reviewDate)
                                : "Not provided"
                        )}
                    </p>

                    <div class="request-actions">

                        <button
                            type="button"
                            class="view-admin-review-btn"
                            data-review-id="${escapeHtml(
                                String(reviewId)
                            )}">
                            View
                        </button>

                    </div>

                </article>
            `;
        }
    ).join("");

    attachAdminReviewViewHandlers(reviews);
}


function updateAdminReviewStats(reviews) {

    const reviewList =
        Array.isArray(reviews)
            ? reviews
            : [];

    const totalReviews =
        reviewList.length;

    const positiveReviews =
        reviewList.filter(
            review =>
                Number(review.rating) >= 4
        ).length;

    const pendingReviews =
        reviewList.filter(
            review => {

                const status =
                    String(
                        review.status ||
                        ""
                    ).toLowerCase();

                return (
                    status === "pending" ||
                    status === "reported"
                );
            }
        ).length;

    const ratings =
        reviewList
            .map(
                review =>
                    Number(review.rating)
            )
            .filter(
                rating =>
                    Number.isFinite(rating) &&
                    rating > 0
            );

    const totalRating =
        ratings.reduce(
            (sum, rating) =>
                sum + rating,
            0
        );

    const averageRating =
        ratings.length > 0
            ? (
                totalRating /
                ratings.length
            ).toFixed(1)
            : "0.0";

    const totalElement =
        document.getElementById(
            "admin-total-reviews"
        );

    const positiveElement =
        document.getElementById(
            "admin-positive-reviews"
        );

    const pendingElement =
        document.getElementById(
            "admin-pending-reviews"
        );

    const averageElement =
        document.getElementById(
            "admin-average-rating"
        );

    if (totalElement) {
        totalElement.textContent =
            totalReviews;
    }

    if (positiveElement) {
        positiveElement.textContent =
            positiveReviews;
    }

    if (pendingElement) {
        pendingElement.textContent =
            pendingReviews;
    }

    if (averageElement) {
        averageElement.textContent =
            `${averageRating}⭐`;
    }
}


function attachAdminReviewViewHandlers(reviews) {

    const reviewButtons =
        document.querySelectorAll(
            ".view-admin-review-btn"
        );

    reviewButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const reviewId =
                        button.dataset.reviewId;

                    const selectedReview =
                        reviews.find(
                            review => {

                                const currentId =
                                    review._id ||
                                    review.id ||
                                    "";

                                return (
                                    String(
                                        currentId
                                    ) === String(
                                        reviewId
                                    )
                                );
                            }
                        );

                    if (!selectedReview) {
                        console.error(
                            "Selected admin review not found."
                        );

                        return;
                    }

                    showAdminReviewDetails(
                        selectedReview
                    );
                }
            );
        }
    );
}


async function showAdminReviewDetails(review) {

    let detailsSection =
        document.getElementById(
            "admin-review-details"
        );

    let detailsContent =
        document.getElementById(
            "admin-review-details-content"
        );

    /*
     * Create the review details section dynamically when
     * the Admin Reviews page does not contain it.
     */

    if (!detailsSection || !detailsContent) {

        const reviewsList =
            document.getElementById(
                "admin-reviews-list"
            );

        if (!reviewsList) {

            console.error(
                "Admin review details container not found."
            );

            return;

        }


        const dynamicSection =
            document.createElement(
                "section"
            );

        dynamicSection.id =
            "admin-review-details";

        dynamicSection.className =
            "admin-review-details";

        dynamicSection.innerHTML = `
            <div
                id="admin-review-details-content"
                class="admin-review-details-content"
            ></div>
        `;

        reviewsList.parentElement
            ?.appendChild(
                dynamicSection
            );


        detailsSection =
            document.getElementById(
                "admin-review-details"
            );

        detailsContent =
            document.getElementById(
                "admin-review-details-content"
            );

    }


    const customer =
        review.customer || {};

    const service =
        review.service || {};

    const provider =
        review.provider ||
        (review.booking &&
            review.booking.provider) ||
        {};

    const customerName =
        customer.name ||
        review.customerName ||
        "Unknown Customer";

    const customerEmail =
        customer.email ||
        review.customerEmail ||
        "Not provided";

    const serviceName =
        service.name ||
        review.serviceName ||
        "Unknown Service";

    const providerName =
        provider.name ||
        review.providerName ||
        "Not provided";

    const rating =
        Number(review.rating) || 0;

    const comment =
        review.comment ||
        "No comment provided.";

    const reviewDate =
        review.createdAt ||
        review.updatedAt ||
        review.date;

    const reviewId =
        review._id ||
        review.id ||
        "Not provided";

    const bookingId =
        review.booking?._id ||
        review.booking?.id ||
        review.booking ||
        "";

    let bookingDetails =
        review.booking || null;

    if (bookingId && typeof bookingId === "string") {

        try {

            const token =
                getToken();

            if (token) {

                const response =
                    await fetch(
                        `${API_BASE_URL}/admin/bookings/${encodeURIComponent(
                            bookingId
                        )}`,
                        {
                            method: "GET",
                            headers: {
                                "Authorization":
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );

                const data =
                    await parseJSONResponse(
                        response
                    );

                if (
                    response.ok &&
                    data
                ) {
                    bookingDetails =
                        data.booking ||
                        data.data ||
                        bookingDetails;
                }
            }

        } catch (error) {

            console.error(
                "Unable to load booking details for review:",
                error
            );
        }
    }

    const bookingDate =
        bookingDetails?.date ||
        bookingDetails?.bookingDate ||
        bookingDetails?.scheduledDate;

    const bookingTime =
        bookingDetails?.time ||
        bookingDetails?.bookingTime ||
        bookingDetails?.scheduledTime;

    const bookingStatus =
        bookingDetails?.status ||
        "Not provided";

    const address =
        bookingDetails?.address ||
        bookingDetails?.location ||
        "Not provided";

    const stars =
        "★".repeat(
            Math.max(
                0,
                Math.min(5, rating)
            )
        ) +
        "☆".repeat(
            Math.max(
                0,
                5 - Math.min(5, rating)
            )
        );

    detailsContent.innerHTML = `
        <article class="admin-card">

            <h3>
                Review Information
            </h3>

            <p>
                <strong>Review ID:</strong>
                ${escapeHtml(
                    String(reviewId)
                )}
            </p>

            <p>
                <strong>Customer:</strong>
                ${escapeHtml(customerName)}
            </p>

            <p>
                <strong>Email:</strong>
                ${escapeHtml(customerEmail)}
            </p>

            <p>
                <strong>Service:</strong>
                ${escapeHtml(serviceName)}
            </p>

            <p>
                <strong>Provider:</strong>
                ${escapeHtml(providerName)}
            </p>

            <p>
                <strong>Rating:</strong>
                ${stars}
                (${rating}/5)
            </p>

            <p>
                <strong>Comment:</strong>
                ${escapeHtml(comment)}
            </p>

            <p>
                <strong>Review Date:</strong>
                ${escapeHtml(
                    reviewDate
                        ? formatDateTime(
                            reviewDate
                        )
                        : "Not provided"
                )}
            </p>

            <hr>

            <h3>
                Booking Information
            </h3>

            <p>
                <strong>Booking ID:</strong>
                ${escapeHtml(
                    bookingId
                        ? String(bookingId)
                        : "Not provided"
                )}
            </p>

            <p>
                <strong>Booking Date:</strong>
                ${escapeHtml(
                    bookingDate
                        ? formatDateTime(
                            bookingDate
                        )
                        : "Not provided"
                )}
            </p>

            <p>
                <strong>Booking Time:</strong>
                ${escapeHtml(
                    bookingTime
                        ? String(bookingTime)
                        : "Not provided"
                )}
            </p>

            <p>
                <strong>Booking Status:</strong>
                ${escapeHtml(
                    String(bookingStatus)
                )}
            </p>

            <p>
                <strong>Address:</strong>
                ${escapeHtml(
                    String(address)
                )}
            </p>

        </article>
    `;

    detailsSection.style.display =
        "block";

    detailsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeAdminReviewDetails() {

    const detailsSection =
        document.getElementById(
            "admin-review-details"
        );

    const detailsContent =
        document.getElementById(
            "admin-review-details-content"
        );

    if (detailsSection) {
        detailsSection.style.display =
            "none";
    }

    if (detailsContent) {
        detailsContent.innerHTML = "";
    }
}


async function handleLoadAdminReviews() {

    const reviewsList =
        document.getElementById(
            "admin-reviews-list"
        );

    const refreshButton =
        document.getElementById(
            "load-reviews-btn"
        );

    if (!reviewsList) {
        return;
    }

    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent =
            "Loading Reviews...";
    }

    reviewsList.innerHTML =
        "<p>Loading reviews...</p>";

    try {

        const reviews =
            await loadAdminReviews();

        renderAdminReviews(
            reviews,
            reviewsList
        );

    } catch (error) {

        console.error(
            "Admin reviews loading failed:",
            error
        );

        reviewsList.innerHTML =
            `<p>Unable to load reviews. ${escapeHtml(
                error.message ||
                "Please try again."
            )}</p>`;

        updateAdminReviewStats([]);

    } finally {

        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.textContent =
                "Refresh Reviews";
        }
    }
}


function initializeAdminReviews() {

    const reviewsList =
        document.getElementById(
            "admin-reviews-list"
        );

    const refreshButton =
        document.getElementById(
            "load-reviews-btn"
        );

    const closeDetailsButton =
        document.getElementById(
            "close-admin-review-details-btn"
        );

    if (
        !reviewsList &&
        !refreshButton &&
        !closeDetailsButton
    ) {
        return;
    }

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            handleLoadAdminReviews
        );
    }

    if (closeDetailsButton) {
        closeDetailsButton.addEventListener(
            "click",
            closeAdminReviewDetails
        );
    }

    handleLoadAdminReviews();
}


if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminReviews
    );
} else {
    initializeAdminReviews();
}


/* ========================================================================
   PROVIDER DASHBOARD QUICK ACTIONS
   Handles navigation for provider dashboard action buttons.
   ======================================================================== */

function initializeProviderQuickActions() {

    const manageServicesButton =
        document.querySelector(
            ".provider-manage-services-btn"
        );

    const profileButton =
        document.querySelector(
            ".provider-profile-btn"
        );

    const historyButton =
        document.querySelector(
            ".provider-history-btn"
        );

    /* ----------------------------------------------------
       MANAGE SERVICES
       Opens the existing services management area.
    ---------------------------------------------------- */
    if (manageServicesButton) {

        manageServicesButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                window.location.href =
                    "provider-services.html";

            }
        );

    }

    /* ----------------------------------------------------
       VIEW PROFILE
       Opens the provider profile page.
    ---------------------------------------------------- */
    if (profileButton) {

        profileButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                window.location.assign(
                    "profile.html"
                );

            }
        );

    }

    /* ----------------------------------------------------
       BOOKING HISTORY
       Opens the existing booking history page.
    ---------------------------------------------------- */
    if (historyButton) {

        historyButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                window.location.href =
                    "provider-booking-history.html";

            }
        );

    }

}


/* ========================================================================
   PROVIDER LOGOUT
   Clears authentication data before leaving the dashboard.
   ======================================================================== */

function initializeProviderLogout() {

    const logoutLink =
        document.querySelector(
            '.provider-dashboard-page a[href="login.html"]'
        );

    if (!logoutLink) {
        return;
    }

    logoutLink.addEventListener(
        "click",
        function () {

            clearAuthData();

        }
    );

}


/* ========================================================================
   PROVIDER DASHBOARD INITIALIZATION
   Loads provider dashboard data only on the provider dashboard page.
   ======================================================================== */

function initializeProviderDashboard() {

    const providerRequests =
        document.getElementById(
            "provider-booking-requests"
        );

    const providerUpcoming =
        document.getElementById(
            "provider-upcoming-bookings"
        );


    if (!providerRequests && !providerUpcoming) {
        return;
    }


    console.log(
        "Provider Dashboard page initialized ✅"
    );


    initializeProviderQuickActions();
    initializeProviderLogout();


    loadProviderDashboard();
    loadProviderReviews();
}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeProviderDashboard,
        { once: true }
    );

} else {

    initializeProviderDashboard();
}


// ==================================================
// PROVIDER SERVICES MANAGEMENT
// ==================================================

function initializeProviderServicesPage() {

    const serviceForm =
        document.getElementById(
            "provider-service-form"
        );

    const serviceList =
        document.getElementById(
            "provider-services-list"
        );

    const serviceMessage =
        document.getElementById(
            "provider-services-message"
        );

    const serviceIdInput =
        document.getElementById(
            "provider-service-id"
        );

    const formTitle =
        document.getElementById(
            "service-form-title"
        );

    const saveButton =
        document.getElementById(
            "save-service-button"
        );

    const cancelButton =
        document.getElementById(
            "cancel-edit-button"
        );

    if (!serviceForm || !serviceList) {
        return;
    }


    // ==================================================
    // LOAD PROVIDER SERVICES
    // ==================================================

    async function loadProviderServices() {

        try {

            const token =
            typeof getToken === "function"
            ? getToken()
            : localStorage.getItem("localeaseToken");

            if (!token) {
                window.location.href = "login.html";
                return;
            }


            const response =
                await fetch(
                    "http://localhost:5000/api/services/provider/my-services",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load services"
                );
            }


            serviceList.innerHTML = "";


            if (
                !data.services ||
                data.services.length === 0
            ) {

                serviceMessage.textContent =
                    "You have not added any services yet.";

                return;
            }


            serviceMessage.textContent = "";


            data.services.forEach(
                function (service) {

                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "service-card";


                    card.innerHTML = `
                        <div class="service-card-content">

                            <h3>
                                ${service.name}
                            </h3>

                            <p>
                                ${service.description}
                            </p>

                            <p>
                                <strong>
                                    Category:
                                </strong>
                                ${service.category}
                            </p>

                            <p>
                                <strong>
                                    Price:
                                </strong>
                                ₹${service.price}
                            </p>

                           <div class="service-actions">
                           <button
                           type="button"
                           class="edit-provider-service"
                           data-id="${service._id}"
                           >
                           <span class="service-action-icon">✎</span>
                           Edit
                           </button>

                           <button
                           type="button"
                           class="delete-provider-service"
                           data-id="${service._id}"
                           >
                           <span class="service-action-icon">🗑</span>
                           Delete
                           </button>
                           </div>

                        </div>
                    `;


                    serviceList.appendChild(card);
                }
            );


        } catch (error) {

            console.error(
                "Load provider services error:",
                error
            );

            serviceMessage.textContent =
                error.message ||
                "Unable to load your services.";
        }
    }


    // ==================================================
    // ADD / UPDATE SERVICE
    // ==================================================

    serviceForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            try {

                const token =
                typeof getToken === "function"
                ? getToken()
                : localStorage.getItem("localeaseToken");
                if (!token) {
                    window.location.href = "login.html";
                    return;
                }

                const serviceId =
                document.getElementById("provider-service-id").value;
                
                const serviceData = {
                    name:
                    document.getElementById("service-name").value.trim(),
                    
                    category:
                    document.getElementById("service-category").value.trim(),
                    
                    description:
                    document.getElementById("service-description").value.trim(),
                    
                    price:
                    Number(document.getElementById("service-price").value),

                    image:
                    document.getElementById("service-image").value.trim()

                };
                
                const response = await fetch(
                    serviceId
        ? `http://localhost:5000/api/services/${serviceId}`
        : "http://localhost:5000/api/services",
    {
        method: serviceId ? "PUT" : "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(serviceData)
    }
);

const data = await response.json();

if (!response.ok) {
    throw new Error(
        data.message ||
        "Unable to save service"
    );
}

alert(
    serviceId
        ? "Service updated successfully"
        : "Service added successfully"
);

serviceForm.reset();

document.getElementById(
    "provider-service-id"
).value = "";

document.getElementById(
    "save-service-button"
).textContent = "Add Service";

document.getElementById(
    "cancel-edit-button"
).style.display = "none";

await loadProviderServices();


                resetServiceForm();

                await loadProviderServices();


            } catch (error) {

                console.error(
                    "Save provider service error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to save service."
                );
            }
        }
    );


    // ==================================================
    // EDIT / DELETE BUTTONS
    // ==================================================

    serviceList.addEventListener(
        "click",
        async function (event) {

            const editButton =
                event.target.closest(
                    ".edit-provider-service"
                );

            const deleteButton =
                event.target.closest(
                    ".delete-provider-service"
                );


            if (editButton) {

                const serviceId =
                    editButton.dataset.id;


                try {

                    const token =
                    typeof getToken === "function"
                    ? getToken()
                    : localStorage.getItem("localeaseToken");


                    const response =
                        await fetch(
                            `http://localhost:5000/api/services/${serviceId}`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                            "Unable to load service"
                        );
                    }


                    const service =
                        data.service;


                    serviceIdInput.value =
                        service._id;

                    document.getElementById(
                        "service-name"
                    ).value =
                        service.name;

                    document.getElementById(
                        "service-category"
                    ).value =
                        service.category;

                    document.getElementById(
                        "service-description"
                    ).value =
                        service.description;

                    document.getElementById(
                        "service-price"
                    ).value =
                        service.price;

                    document.getElementById(
                        "service-image"
                    ).value =
                        service.image || "";


                    formTitle.textContent =
                        "Edit Service";

                    saveButton.textContent =
                        "Update Service";

                    cancelButton.style.display =
                        "inline-block";


                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });


                } catch (error) {

                    console.error(
                        "Edit service error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Unable to edit service."
                    );
                }

                return;
            }


            if (deleteButton) {

                const serviceId =
                    deleteButton.dataset.id;


                const confirmed =
                    confirm(
                        "Are you sure you want to delete this service?"
                    );


                if (!confirmed) {
                    return;
                }


                try {

                    const token =
                    typeof getToken === "function"
                    ? getToken()
                    : localStorage.getItem("localeaseToken");


                    const response =
                        await fetch(
                            `http://localhost:5000/api/services/${serviceId}`,
                            {
                                method: "DELETE",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                            "Unable to delete service"
                        );
                    }


                    alert(
                        "Service deleted successfully"
                    );


                    await loadProviderServices();


                } catch (error) {

                    console.error(
                        "Delete provider service error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Unable to delete service."
                    );
                }
            }
        }
    );


    // ==================================================
    // CANCEL EDIT
    // ==================================================

    cancelButton.addEventListener(
        "click",
        function () {

            resetServiceForm();

        }
    );


    // ==================================================
    // RESET FORM
    // ==================================================

    function resetServiceForm() {

        serviceForm.reset();

        serviceIdInput.value = "";

        formTitle.textContent =
            "Add New Service";

        saveButton.textContent =
            "Add Service";

        cancelButton.style.display =
            "none";
    }


    // ==================================================
    // LOGOUT
    // ==================================================

    const logoutButton =
        document.getElementById(
            "provider-services-logout"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    "localeaseToken"
                );
                localStorage.removeItem(
                    "localeaseUser"
                );

                window.location.href =
                    "login.html";
            }
        );
    }


    // Load services when page opens
    loadProviderServices();
}


// ==================================================
// INITIALIZE PROVIDER SERVICES PAGE
// ==================================================

if (
    window.location.pathname.endsWith(
        "provider-services.html"
    )
) {

    initializeProviderServicesPage();

}


/* ================================================================
   GLOBAL LOCALEASE LOGOUT HANDLER
   Ensures authentication data is always cleared before logout.
================================================================ */

(function () {

    function clearAllLocalEaseAuth() {

        localStorage.removeItem("localeaseToken");
        localStorage.removeItem("localeaseUser");

        sessionStorage.removeItem("localeaseToken");
        sessionStorage.removeItem("localeaseUser");

    }


    /* ------------------------------------------------------------
       GLOBAL LOGOUT FUNCTION
    ------------------------------------------------------------ */

    window.localEaseLogout = function () {

        clearAllLocalEaseAuth();

        window.location.replace("login.html");

    };


    /* ------------------------------------------------------------
       HANDLE ALL LOGOUT LINKS
    ------------------------------------------------------------ */

    document.addEventListener(
        "click",
        function (event) {

            const logoutLink =
                event.target.closest(
                    "#logout-btn, .logout-btn, a[href='login.html']"
                );


            if (!logoutLink) {
                return;
            }


            const linkText =
                logoutLink.textContent
                    .trim()
                    .toLowerCase();


            const isLogoutLink =
                logoutLink.id === "logout-btn" ||
                logoutLink.classList.contains("logout-btn") ||
                linkText === "logout";


            if (!isLogoutLink) {
                return;
            }


            event.preventDefault();
            event.stopPropagation();


            clearAllLocalEaseAuth();


            window.location.replace("login.html");

        },
        true
    );

})();