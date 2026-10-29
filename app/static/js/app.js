"use strict";

const API_BASE = "/api";
const TOKEN_KEY = "taskflow_access_token";
const USER_KEY = "taskflow_username";

let tasks = [];
let currentStatusFilter = "all";
let isEditing = false;
let authMode = "login";

const $ = (selector) => document.querySelector(selector);

const el = {
    layout: $(".app-layout"),
    taskList: $("#task-list"),
    total: $("#total-count"),
    pending: $("#pending-count"),
    progress: $("#progress-count"),
    completed: $("#completed-count"),
    headingCount: $("#task-heading-count"),
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

function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);
}

function showMessage(message, isError = false) {
    el.message.textContent = message;
    el.message.classList.toggle("message-error", isError);
}

function clearMessage() {
    el.message.textContent = "";
    el.message.classList.remove("message-error");
}

async function apiRequest(path, options = {}) {
    const headers = { ...(options.headers || {}) };

    if (options.body) {
        headers["Content-Type"] = "application/json";
    }

    if (getToken()) {
        headers.Authorization = `Bearer ${getToken()}`;
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

        throw new Error(
            data.error || data.message || `Request failed (${response.status})`
        );
    }

    return data;
}

// ---------------- Authentication ----------------

function showAuthScreen(message = "", isSuccess = false) {
    el.layout.hidden = true;
    el.modal.hidden = true;

    let screen = $("#auth-screen");

    if (!screen) {
        screen = document.createElement("main");
        screen.id = "auth-screen";

        screen.innerHTML = `
            <section class="auth-visual">
                <a href="/dashboard" class="brand">
                    <span class="brand-mark">T<span>.</span></span>
                    <span class="brand-name">taskflow</span>
                </a>

                <div class="auth-visual-content">
                    <p class="eyebrow">
                        <span class="eyebrow-line"></span>
                        YOUR WORKSPACE, REIMAGINED
                    </p>

                    <h2>Turn your plans into <span>progress.</span></h2>

                    <p>
                        One place for your priorities, your tasks, and the
                        work that moves you forward. Simple, focused, yours.
                    </p>

                    <div class="auth-benefits">
                        <div class="auth-benefit">
                            <span class="benefit-check">✓</span>
                            Organize tasks around what matters
                        </div>
                        <div class="auth-benefit">
                            <span class="benefit-check">✓</span>
                            Track progress at a glance
                        </div>
                        <div class="auth-benefit">
                            <span class="benefit-check">✓</span>
                            Keep your workspace personal
                        </div>
                    </div>
                </div>

                <footer class="auth-visual-footer">
                    TASKFLOW · BUILT FOR CLARITY
                </footer>
            </section>

            <section class="auth-panel">
                <div class="auth-card">
                    <a href="/dashboard" class="brand auth-mobile-brand">
                        <span class="brand-mark">T<span>.</span></span>
                        <span class="brand-name">taskflow</span>
                    </a>

                    <div class="auth-heading">
                        <p class="eyebrow">WELCOME TO TASKFLOW</p>
                        <h1 id="auth-heading">Welcome back.</h1>
                        <p id="auth-subtitle">Log in to your workspace.</p>
                    </div>

                    <div class="auth-tabs">
                        <button type="button" id="login-tab"
                                class="auth-tab active">Log in</button>
                        <button type="button" id="register-tab"
                                class="auth-tab">Create account</button>
                    </div>

                    <form id="auth-form">
                        <label class="form-field" id="username-field" hidden>
                            <span>Username</span>
                            <input id="auth-username" type="text"
                                   maxlength="80" autocomplete="username"
                                   placeholder="Choose a username">
                        </label>

                        <label class="form-field">
                            <span>Email address</span>
                            <input id="auth-email" type="email"
                                   maxlength="120" autocomplete="email"
                                   placeholder="you@example.com" required>
                        </label>

                        <label class="form-field">
                            <span>Password</span>
                            <input id="auth-password" type="password"
                                   minlength="8" autocomplete="current-password"
                                   placeholder="Enter your password" required>
                        </label>

                        <p id="auth-error" class="auth-error"
                           role="alert" aria-live="polite"></p>

                        <button id="auth-submit"
                                class="primary-button auth-submit"
                                type="submit">Log in <span>→</span></button>
                    </form>

                    <p class="auth-footer">
                        Your workspace. Your priorities. Your progress.
                    </p>
                </div>
            </section>
        `;

        document.body.appendChild(screen);

        $("#login-tab").addEventListener("click", () => setAuthMode("login"));
        $("#register-tab").addEventListener("click", () => setAuthMode("register"));
        $("#auth-form").addEventListener("submit", handleAuthSubmit);
    }

    setAuthMode(authMode);

    if (message) {
        $("#auth-error").textContent = message;
        $("#auth-error").classList.toggle("success", isSuccess);
    }

    $("#auth-email").focus();
}

function setAuthMode(mode) {
    authMode = mode;

    const isRegister = mode === "register";

    $("#username-field").hidden = !isRegister;
    $("#auth-username").required = isRegister;

    $("#auth-heading").textContent = isRegister
        ? "Create your account."
        : "Welcome back.";

    $("#auth-subtitle").textContent = isRegister
        ? "Set up your workspace in a few steps."
        : "Log in to your workspace.";

    $("#auth-submit").innerHTML = isRegister
        ? 'Create account <span>→</span>'
        : 'Log in <span>→</span>';

    $("#auth-password").autocomplete = isRegister
        ? "new-password"
        : "current-password";

    $("#login-tab").classList.toggle("active", !isRegister);
    $("#register-tab").classList.toggle("active", isRegister);

    $("#auth-error").textContent = "";
    $("#auth-error").classList.remove("success");
}

async function handleAuthSubmit(event) {
    event.preventDefault();

    const username = $("#auth-username").value.trim();
    const email = $("#auth-email").value.trim();
    const password = $("#auth-password").value;
    const button = $("#auth-submit");
    const error = $("#auth-error");

    if (authMode === "register" && !username) {
        error.textContent = "Please enter a username.";
        return;
    }

    if (authMode === "register" && password.length < 8) {
        error.textContent = "Password must be at least 8 characters.";
        return;
    }

    button.disabled = true;
    error.textContent = "";
    error.classList.remove("success");

    try {
        if (authMode === "register") {
            await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify({ username, email, password }),
            });

            $("#auth-email").value = email;
            $("#auth-password").value = "";
            setAuthMode("login");

            error.textContent = "Account created! Please log in.";
            error.classList.add("success");
            return;
        }

        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        sessionStorage.setItem(TOKEN_KEY, data.access_token);
        sessionStorage.setItem(USER_KEY, data.user.username);

        await showDashboard();
    } catch (err) {
        error.textContent = err.message;
        error.classList.remove("success");
    } finally {
        button.disabled = false;
    }
}

function logout(message = "") {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    tasks = [];
    currentStatusFilter = "all";

    showAuthScreen(message);
}

// ---------------- Dashboard ----------------

async function showDashboard() {
    if (!getToken()) {
        showAuthScreen();
        return;
    }

    const screen = $("#auth-screen");
    if (screen) screen.remove();

    el.layout.hidden = false;

    const username = sessionStorage.getItem(USER_KEY) || "My workspace";

    $("#sidebar-username").textContent = username;
    $("#sidebar-avatar").textContent = username.charAt(0).toUpperCase();
    $("#topbar-avatar").textContent = username.charAt(0).toUpperCase();

    clearMessage();

    try {
        await loadTasks();
    } catch (err) {
        showMessage(err.message, true);
    }
}

// ---------------- Task API operations ----------------

async function loadTasks() {
    const data = await apiRequest("/tasks/");
    tasks = Array.isArray(data) ? data : [];

    renderTasks();
    updateStats();
}

async function saveTask(event) {
    event.preventDefault();

    const title = el.title.value.trim();

    if (!title) {
        el.formError.textContent = "Task title is required.";
        return;
    }

    const description = el.description.value.trim();
    const priority = el.priority.value;
    const status = el.status.value;
    const taskId = el.taskId.value;

    const editing = isEditing;
    const payload = { title, description, priority };

    el.formError.textContent = "";
    el.save.disabled = true;

    try {
        if (editing && taskId) {
            payload.status = status;

            await apiRequest(`/tasks/${taskId}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
        } else {
            // Backend creates new tasks with pending status.
            const created = await apiRequest("/tasks/", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (status !== "pending") {
                await apiRequest(`/tasks/${created.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ status }),
                });
            }
        }

        closeTaskModal();
        await loadTasks();
        showMessage(editing ? "Task updated successfully." : "Task created successfully.");
    } catch (err) {
        el.formError.textContent = err.message;
    } finally {
        el.save.disabled = false;
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
    } catch (err) {
        showMessage(err.message, true);
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
    } catch (err) {
        showMessage(err.message, true);
        await loadTasks().catch(() => {});
    }
}

// ---------------- Task rendering ----------------

function renderTasks() {
    const query = el.search.value.trim().toLowerCase();
    const status = el.statusFilter.value;
    const priority = el.priorityFilter.value;

    const filtered = tasks.filter((task) => {
        const title = String(task.title || "").toLowerCase();
        const description = String(task.description || "").toLowerCase();

        return (
            (title.includes(query) || description.includes(query)) &&
            (status === "all" || task.status === status) &&
            (priority === "all" || task.priority === priority) &&
            (currentStatusFilter === "all" ||
                task.status === currentStatusFilter)
        );
    });

    el.headingCount.textContent = filtered.length;

    if (!filtered.length) {
        el.taskList.innerHTML = `
            <div class="empty-state">
                <span class="empty-illustration">✦</span>
                <h3>${tasks.length ? "No matching tasks." : "Your next win starts here."}</h3>
                <p>${tasks.length
                    ? "Try adjusting your search or filters."
                    : "Create your first task to get started."}</p>
            </div>
        `;
        return;
    }

    const statusLabels = {
        pending: "Pending",
        in_progress: "In progress",
        completed: "Completed",
    };

    const priorityLabels = {
        low: "Low",
        medium: "Medium",
        high: "High",
    };

    el.taskList.innerHTML = filtered.map((task) => `
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
                <select class="task-status-select status-${escapeHTML(task.status)}"
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
    `).join("");
}

function updateStats() {
    el.total.textContent = tasks.length;
    el.pending.textContent =
        tasks.filter((task) => task.status === "pending").length;
    el.progress.textContent =
        tasks.filter((task) => task.status === "in_progress").length;
    el.completed.textContent =
        tasks.filter((task) => task.status === "completed").length;
}

// ---------------- Task modal ----------------

function openTaskModal(task = null) {
    isEditing = Boolean(task);

    el.form.reset();
    el.formError.textContent = "";
    el.taskId.value = task ? task.id : "";

    $("#modal-title").textContent = task ? "Edit task" : "Create a task";
    el.save.innerHTML = task ? "Update task <span>→</span>" : "Save task <span>→</span>";

    if (task) {
        el.title.value = task.title || "";
        el.description.value = task.description || "";
        el.priority.value = task.priority || "medium";
        el.status.value = task.status || "pending";
    } else {
        el.priority.value = "medium";
        el.status.value = "pending";
    }

    el.modal.hidden = false;
    el.title.focus();
}

function closeTaskModal() {
    el.modal.hidden = true;
    el.form.reset();
    el.formError.textContent = "";
    isEditing = false;
}

// ---------------- Event listeners ----------------

$("#open-task-modal").addEventListener("click", () => openTaskModal());
$("#close-task-modal").addEventListener("click", closeTaskModal);
$("#cancel-task").addEventListener("click", closeTaskModal);
el.form.addEventListener("submit", saveTask);

$("#logout-btn").addEventListener("click", () => logout());

el.search.addEventListener("input", renderTasks);
el.statusFilter.addEventListener("change", renderTasks);
el.priorityFilter.addEventListener("change", renderTasks);

el.taskList.addEventListener("click", (event) => {
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

el.taskList.addEventListener("change", (event) => {
    const select = event.target.closest("[data-status-id]");

    if (select) {
        changeTaskStatus(select.dataset.statusId, select.value);
    }
});

el.modal.addEventListener("click", (event) => {
    if (event.target === el.modal) closeTaskModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.modal.hidden) {
        closeTaskModal();
    }

    if (
        event.key === "/" &&
        !el.layout.hidden &&
        !el.modal.hidden &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
        event.preventDefault();
        el.search.focus();
    }
});

document.querySelectorAll(".status-filter").forEach((button) => {
    button.addEventListener("click", () => {
        currentStatusFilter = button.dataset.status;
        el.statusFilter.value = currentStatusFilter;

        document.querySelectorAll(".status-filter").forEach((item) => {
            item.classList.toggle("active", item === button);
        });

        renderTasks();
    });
});

document.querySelector('a[href="#dashboard"]').addEventListener("click", () => {
    currentStatusFilter = "all";
    el.statusFilter.value = "all";

    document.querySelectorAll(".status-filter").forEach((item) => {
        item.classList.remove("active");
    });

    document.querySelector('.nav-link[href="#dashboard"]').classList.add("active");
    renderTasks();
});

document.querySelector('a[href="#tasks"]').addEventListener("click", () => {
    currentStatusFilter = "all";
    el.statusFilter.value = "all";

    document.querySelectorAll(".status-filter").forEach((item) => {
        item.classList.remove("active");
    });

    document.querySelector('.nav-link[href="#dashboard"]').classList.remove("active");
    document.querySelector('.nav-link[href="#tasks"]').classList.add("active");
    renderTasks();
});

// Start with the appropriate screen.
if (getToken()) {
    showDashboard();
} else {
    showAuthScreen();
}