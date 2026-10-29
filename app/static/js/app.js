const API_BASE = "/api";
const TOKEN_KEY = "taskflow_access_token";
const USER_KEY = "taskflow_username";

let tasks = [];
let currentStatusFilter = "all";
let isEditing = false;

const $ = (selector) => document.querySelector(selector);

const elements = {
    taskList: $("#task-list"),
    total: $("#total-count"),
    pending: $("#pending-count"),
    progress: $("#progress-count"),
    completed: $("#completed-count"),
    search: $("#task-search"),
    statusFilter: $("#status-filter"),
    priorityFilter: $("#priority-filter"),
    modal: $("#task-modal"),
    form: $("#task-form"),
    title: $("#task-title"),
    description: $("#task-description"),
    priority: $("#task-priority"),
    status: $("#task-status"),
    taskId: $("#task-id"),
    formError: $("#form-error"),
    message: $("#message-area"),
    save: $("#save-task"),
};

// Safely escape API data before inserting it into HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);
}

function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

function showMessage(message, isError = false) {
    elements.message.textContent = message;
    elements.message.style.color = isError ? "#ff7885" : "#43d9a3";
}

function clearMessage() {
    elements.message.textContent = "";
}

async function apiRequest(path, options = {}) {
    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
    };

    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : {};

    if (!response.ok) {
        if (response.status === 401 && getToken()) {
            logout("Your session has expired. Please log in again.");
        }

        throw new Error(data.error || data.message || `Request failed (${response.status})`);
    }

    return data;
}

// ---------- Authentication UI ----------

function showAuthScreen() {
    const oldScreen = $("#auth-screen");
    if (oldScreen) oldScreen.remove();

    $(".app-layout").hidden = true;
    $("#task-modal").hidden = true;

    const screen = document.createElement("main");
    screen.id = "auth-screen";

    screen.innerHTML = `
        <section class="auth-card">
            <a class="brand auth-brand" href="/dashboard">
                <span class="brand-icon">T</span>
                <span>TaskFlow</span>
            </a>

            <p class="eyebrow">YOUR PERSONAL WORKSPACE</p>
            <h1 id="auth-heading">Welcome back</h1>
            <p class="auth-subtitle" id="auth-subtitle">
                Log in to manage your tasks.
            </p>

            <div class="auth-tabs">
                <button type="button" id="login-tab" class="auth-tab active">
                    Login
                </button>
                <button type="button" id="register-tab" class="auth-tab">
                    Register
                </button>
            </div>

            <form id="auth-form">
                <label class="form-field" id="username-field" hidden>
                    <span>Username</span>
                    <input id="auth-username" type="text"
                           maxlength="80" autocomplete="username">
                </label>

                <label class="form-field">
                    <span>Email</span>
                    <input id="auth-email" type="email"
                           maxlength="120" autocomplete="email" required>
                </label>

                <label class="form-field">
                    <span>Password</span>
                    <input id="auth-password" type="password"
                           minlength="8" autocomplete="current-password" required>
                </label>

                <p id="auth-error" class="form-error" role="alert"></p>

                <button id="auth-submit" class="primary-button auth-submit"
                        type="submit">Log In</button>
            </form>

            <p class="auth-footer">
                Your tasks are private to your account.
            </p>
        </section>
    `;

    document.body.appendChild(screen);

    $("#login-tab").addEventListener("click", () => setAuthMode("login"));
    $("#register-tab").addEventListener("click", () => setAuthMode("register"));

    $("#auth-form").addEventListener("submit", handleAuthSubmit);

    setAuthMode("login");
}

function setAuthMode(mode) {
    const isRegister = mode === "register";

    $("#username-field").hidden = !isRegister;
    $("#auth-username").required = isRegister;

    $("#auth-heading").textContent = isRegister
        ? "Create your account"
        : "Welcome back";

    $("#auth-subtitle").textContent = isRegister
        ? "Create an account to start managing tasks."
        : "Log in to manage your tasks.";

    $("#auth-submit").textContent = isRegister ? "Create Account" : "Log In";
    $("#auth-password").autocomplete = isRegister
        ? "new-password"
        : "current-password";

    $("#login-tab").classList.toggle("active", !isRegister);
    $("#register-tab").classList.toggle("active", isRegister);

    $("#auth-error").textContent = "";
    $("#auth-form").dataset.mode = mode;
}

async function handleAuthSubmit(event) {
    event.preventDefault();

    const mode = $("#auth-form").dataset.mode;
    const email = $("#auth-email").value.trim();
    const password = $("#auth-password").value;
    const submitButton = $("#auth-submit");
    const errorElement = $("#auth-error");

    const payload = { email, password };

    if (mode === "register") {
        payload.username = $("#auth-username").value.trim();

        if (!payload.username) {
            errorElement.textContent = "Username is required.";
            return;
        }

        if (password.length < 8) {
            errorElement.textContent = "Password must be at least 8 characters.";
            return;
        }
    }

    submitButton.disabled = true;
    errorElement.textContent = "";

    try {
        if (mode === "register") {
            await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            // Registration does not return a token.
            // Switch to login rather than pretending the user is logged in.
            setAuthMode("login");
            $("#auth-email").value = email;
            $("#auth-error").textContent =
                "Account created successfully. Please log in.";
            $("#auth-error").style.color = "#43d9a3";
            return;
        }

        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        sessionStorage.setItem(TOKEN_KEY, data.access_token);
        sessionStorage.setItem(USER_KEY, data.user.username);

        await showDashboard();
    } catch (error) {
        errorElement.style.color = "#ff7885";
        errorElement.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
}

// ---------- Dashboard ----------

async function showDashboard() {
    if (!getToken()) {
        showAuthScreen();
        return;
    }

    const authScreen = $("#auth-screen");
    if (authScreen) authScreen.remove();

    $(".app-layout").hidden = false;

    $("#sidebar-username").textContent =
        sessionStorage.getItem(USER_KEY) || "TaskFlow Member";

    clearMessage();

    try {
        await loadTasks();
    } catch (error) {
        showMessage(error.message, true);
    }
}

function logout(message = "You have been logged out.") {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    tasks = [];
    showAuthScreen();

    if (message) {
        $("#auth-error").textContent = message;
    }
}

// ---------- Task operations ----------

async function loadTasks() {
    const result = await apiRequest("/tasks/");
    tasks = Array.isArray(result) ? result : [];

    renderTasks();
    updateStats();
}

async function saveTask(event) {
    event.preventDefault();

    const title = elements.title.value.trim();
    const description = elements.description.value.trim();
    const priority = elements.priority.value;
    const status = elements.status.value;
    const taskId = elements.taskId.value;

    elements.formError.textContent = "";

    if (!title) {
        elements.formError.textContent = "Task title is required.";
        return;
    }

    const payload = { title, description, priority };

    elements.save.disabled = true;

    try {
        if (isEditing && taskId) {
            // Update an existing task.
            payload.status = status;

            await apiRequest(`/tasks/${taskId}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
        } else {
            // The current backend creates new tasks as pending.
            const created = await apiRequest("/tasks/", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            // If a different initial status was selected, update it separately.
            if (status !== "pending") {
                await apiRequest(`/tasks/${created.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ status }),
                });
            }
        }

        closeTaskModal();
        await loadTasks();
        showMessage(isEditing ? "Task updated successfully." : "Task created successfully.");
    } catch (error) {
        elements.formError.textContent = error.message;
    } finally {
        elements.save.disabled = false;
    }
}

async function deleteTask(taskId) {
    const task = tasks.find((item) => String(item.id) === String(taskId));
    if (!task) return;

    if (!window.confirm(`Delete "${task.title}"?`)) return;

    try {
        await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
        await loadTasks();
        showMessage("Task deleted successfully.");
    } catch (error) {
        showMessage(error.message, true);
    }
}

async function changeTaskStatus(taskId, status) {
    try {
        await apiRequest(`/tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });

        await loadTasks();
        showMessage("Task status updated.");
    } catch (error) {
        showMessage(error.message, true);
        await loadTasks();
    }
}

// ---------- Rendering and filters ----------

function renderTasks() {
    const query = elements.search.value.trim().toLowerCase();
    const status = elements.statusFilter.value;
    const priority = elements.priorityFilter.value;

    const filtered = tasks.filter((task) => {
        const matchesSearch =
            String(task.title || "").toLowerCase().includes(query) ||
            String(task.description || "").toLowerCase().includes(query);

        const matchesStatus = status === "all" || task.status === status;
        const matchesPriority = priority === "all" || task.priority === priority;

        const matchesSidebar =
            currentStatusFilter === "all" ||
            task.status === currentStatusFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesSidebar;
    });

    if (!filtered.length) {
        elements.taskList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">☷</span>
                <h3>${tasks.length ? "No matching tasks" : "Your tasks will appear here"}</h3>
                <p>${tasks.length
                    ? "Try changing your search or filters."
                    : "Create a task to get started with TaskFlow."}</p>
            </div>
        `;
        return;
    }

    elements.taskList.innerHTML = filtered.map((task) => {
        const statusLabels = {
            pending: "Pending",
            in_progress: "In Progress",
            completed: "Completed",
        };

        const priorityLabels = {
            low: "Low",
            medium: "Medium",
            high: "High",
        };

        return `
            <article class="task-row">
                <div class="task-main">
                    <div class="task-title">${escapeHTML(task.title)}</div>
                    ${task.description
                        ? `<div class="task-description">${escapeHTML(task.description)}</div>`
                        : ""}
                </div>

                <div>
                    <span class="priority-badge priority-${escapeHTML(task.priority)}">
                        ${escapeHTML(priorityLabels[task.priority] || task.priority)}
                    </span>
                </div>

                <div>
                    <select class="task-status-select status-badge status-${escapeHTML(task.status)}"
                            data-status-id="${escapeHTML(task.id)}"
                            aria-label="Change status for ${escapeHTML(task.title)}">
                        ${Object.entries(statusLabels).map(([value, label]) => `
                            <option value="${value}" ${task.status === value ? "selected" : ""}>
                                ${label}
                            </option>
                        `).join("")}
                    </select>
                </div>

                <div class="task-actions">
                    <button type="button" data-edit-id="${escapeHTML(task.id)}">Edit</button>
                    <button type="button" class="delete-task"
                            data-delete-id="${escapeHTML(task.id)}">Delete</button>
                </div>
            </article>
        `;
    }).join("");
}

function updateStats() {
    elements.total.textContent = tasks.length;
    elements.pending.textContent =
        tasks.filter((task) => task.status === "pending").length;
    elements.progress.textContent =
        tasks.filter((task) => task.status === "in_progress").length;
    elements.completed.textContent =
        tasks.filter((task) => task.status === "completed").length;
}

// ---------- Modal ----------

function openTaskModal(task = null) {
    isEditing = Boolean(task);

    elements.form.reset();
    elements.formError.textContent = "";
    elements.taskId.value = task ? task.id : "";

    $("#modal-title").textContent = task ? "Edit task" : "Create a task";
    elements.save.textContent = task ? "Update Task" : "Save Task";

    if (task) {
        elements.title.value = task.title || "";
        elements.description.value = task.description || "";
        elements.priority.value = task.priority || "medium";
        elements.status.value = task.status || "pending";
    } else {
        elements.priority.value = "medium";
        elements.status.value = "pending";
    }

    elements.modal.hidden = false;
    elements.title.focus();
}

function closeTaskModal() {
    elements.modal.hidden = true;
    elements.form.reset();
    elements.formError.textContent = "";
    isEditing = false;
}

// ---------- Event listeners ----------

$("#open-task-modal").addEventListener("click", () => openTaskModal());
$("#close-task-modal").addEventListener("click", closeTaskModal);
$("#cancel-task").addEventListener("click", closeTaskModal);
elements.form.addEventListener("submit", saveTask);

$("#logout-btn").addEventListener("click", () => logout());

elements.search.addEventListener("input", renderTasks);
elements.statusFilter.addEventListener("change", renderTasks);
elements.priorityFilter.addEventListener("change", renderTasks);

elements.taskList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const deleteButton = event.target.closest("[data-delete-id]");

    if (editButton) {
        const task = tasks.find(
            (item) => String(item.id) === editButton.dataset.editId
        );
        if (task) openTaskModal(task);
    }

    if (deleteButton) {
        deleteTask(deleteButton.dataset.deleteId);
    }
});

elements.taskList.addEventListener("change", (event) => {
    const select = event.target.closest("[data-status-id]");
    if (select) {
        changeTaskStatus(select.dataset.statusId, select.value);
    }
});

$("#task-modal").addEventListener("click", (event) => {
    if (event.target === elements.modal) closeTaskModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.hidden) {
        closeTaskModal();
    }
});

document.querySelectorAll(".status-filter").forEach((button) => {
    button.addEventListener("click", () => {
        currentStatusFilter = button.dataset.status;

        elements.statusFilter.value = currentStatusFilter;

        document.querySelectorAll(".status-filter").forEach((item) => {
            item.classList.toggle("active", item === button);
        });

        renderTasks();
    });
});

document.querySelector('a[href="#dashboard"]').addEventListener("click", () => {
    currentStatusFilter = "all";
    elements.statusFilter.value = "all";
    renderTasks();
});

document.querySelector('a[href="#tasks"]').addEventListener("click", () => {
    currentStatusFilter = "all";
    elements.statusFilter.value = "all";
    renderTasks();
});

// ---------- Auth screen styles ----------

const authStyles = document.createElement("style");
authStyles.textContent = `
    #auth-screen {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: var(--bg, #0c0f17);
    }

    .auth-card {
        width: min(100%, 430px);
        padding: 32px;
        background: var(--panel, #141925);
        border: 1px solid var(--border, #252d3d);
        border-radius: 16px;
    }

    .auth-brand { margin: 0 0 30px; }

    .auth-card h1 {
        font-size: 26px;
        margin-bottom: 8px;
    }

    .auth-subtitle, .auth-footer {
        color: var(--muted, #929db0);
        font-size: 12px;
    }

    .auth-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        padding: 5px;
        margin: 24px 0;
        background: #0e131d;
        border-radius: 9px;
    }

    .auth-tab {
        min-height: 38px;
        border: 0;
        border-radius: 7px;
        color: var(--muted, #929db0);
        background: transparent;
    }

    .auth-tab.active {
        color: white;
        background: #25213f;
    }

    .auth-submit { width: 100%; }

    .auth-footer {
        text-align: center;
        margin: 20px 0 0;
    }

    .task-status-select {
        font: inherit;
        cursor: pointer;
        border: 0;
    }
`;
document.head.appendChild(authStyles);

// Start the correct screen.
if (getToken()) {
    showDashboard();
} else {
    showAuthScreen();
}