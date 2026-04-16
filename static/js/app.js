const state = {
    access: localStorage.getItem("taskManagerAccess") || "",
    refresh: localStorage.getItem("taskManagerRefresh") || "",
    user: JSON.parse(localStorage.getItem("taskManagerUser") || "null"),
    currentPage: 1,
    totalPages: 1,
    editingTaskId: null,
};

const elements = {
    messageBox: document.getElementById("message-box"),
    authStatus: document.getElementById("auth-status"),
    registerForm: document.getElementById("register-form"),
    loginForm: document.getElementById("login-form"),
    logoutButton: document.getElementById("logout-button"),
    refreshButton: document.getElementById("refresh-button"),
    taskForm: document.getElementById("task-form"),
    taskFormTitle: document.getElementById("task-form-title"),
    taskSubmitButton: document.getElementById("task-submit-button"),
    cancelEditButton: document.getElementById("cancel-edit-button"),
    taskTitle: document.getElementById("task-title"),
    taskDescription: document.getElementById("task-description"),
    taskStatus: document.getElementById("task-status"),
    statusFilter: document.getElementById("status-filter"),
    taskList: document.getElementById("task-list"),
    taskSummary: document.getElementById("task-summary"),
    pagination: document.getElementById("pagination"),
    previousPage: document.getElementById("previous-page"),
    nextPage: document.getElementById("next-page"),
    paginationStatus: document.getElementById("pagination-status"),
};

function showMessage(message, type = "success") {
    elements.messageBox.textContent = message;
    elements.messageBox.className = `message ${type}`;
}

function hideMessage() {
    elements.messageBox.className = "message hidden";
    elements.messageBox.textContent = "";
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function saveAuth(data) {
    state.access = data.access;
    state.refresh = data.refresh;
    state.user = data.user;
    localStorage.setItem("taskManagerAccess", state.access);
    localStorage.setItem("taskManagerRefresh", state.refresh);
    localStorage.setItem("taskManagerUser", JSON.stringify(state.user));
}

function clearAuth() {
    state.access = "";
    state.refresh = "";
    state.user = null;
    localStorage.removeItem("taskManagerAccess");
    localStorage.removeItem("taskManagerRefresh");
    localStorage.removeItem("taskManagerUser");
}

function setAuthUi() {
    const isLoggedIn = Boolean(state.access);
    elements.authStatus.textContent = isLoggedIn
        ? `Logged in as ${state.user?.username || "user"}`
        : "You are not logged in.";
    elements.logoutButton.disabled = !isLoggedIn;
    elements.refreshButton.disabled = !isLoggedIn;
    elements.taskForm
        .querySelectorAll("input, textarea, select, button")
        .forEach((field) => {
            field.disabled = !isLoggedIn;
        });
    elements.statusFilter.disabled = !isLoggedIn;

    if (!isLoggedIn) {
        resetTaskForm();
        renderEmptyState("Your tasks will appear here after login.");
        elements.taskSummary.textContent = "Login to load your tasks.";
        elements.pagination.classList.add("hidden");
    }
}

function buildUrl(path, params = {}) {
    const url = new URL(path, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
            url.searchParams.set(key, value);
        }
    });
    return url.toString();
}

async function refreshAccessToken() {
    if (!state.refresh) {
        throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch("/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: state.refresh }),
    });

    if (!response.ok) {
        clearAuth();
        setAuthUi();
        throw new Error("Your session has expired. Please log in again.");
    }

    const data = await response.json();
    state.access = data.access;
    localStorage.setItem("taskManagerAccess", state.access);
}

async function apiRequest(path, options = {}, retry = true) {
    const config = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    };

    if (state.access) {
        config.headers.Authorization = `Bearer ${state.access}`;
    }

    if (options.body !== undefined) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(path, config);

    if (response.status === 401 && retry && state.refresh && !path.includes("/token/refresh/")) {
        await refreshAccessToken();
        return apiRequest(path, options, false);
    }

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(formatError(data));
    }

    return data;
}

function formatError(data) {
    if (!data || typeof data !== "object") {
        return "Something went wrong. Please try again.";
    }

    if (data.detail) {
        return data.detail;
    }

    const [firstKey] = Object.keys(data);
    if (!firstKey) {
        return "Something went wrong. Please try again.";
    }

    const value = data[firstKey];
    if (Array.isArray(value)) {
        return value[0];
    }

    return String(value);
}

function formatDate(value) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function renderEmptyState(message) {
    elements.taskList.className = "task-list empty-state";
    elements.taskList.textContent = message;
}

function renderTasks(payload) {
    const tasks = payload.results || [];
    state.currentPage = payload.current_page || 1;
    state.totalPages = payload.total_pages || 1;

    elements.taskSummary.textContent = `${payload.count} task${payload.count === 1 ? "" : "s"} found`;
    elements.pagination.classList.toggle("hidden", payload.total_pages <= 1);
    elements.paginationStatus.textContent = `Page ${state.currentPage} of ${state.totalPages}`;
    elements.previousPage.disabled = !payload.previous;
    elements.nextPage.disabled = !payload.next;

    if (!tasks.length) {
        renderEmptyState("No tasks matched this view yet.");
        return;
    }

    elements.taskList.className = "task-list";
    elements.taskList.innerHTML = tasks
        .map((task) => {
            const safeTitle = escapeHtml(task.title);
            const safeDescription = escapeHtml(task.description || "No description added.");

            return `
                <article class="task-card ${task.status}">
                    <div class="task-meta">
                        <div>
                            <h4>${safeTitle}</h4>
                            <p>${safeDescription}</p>
                        </div>
                        <span class="status-badge ${task.status}">${task.status}</span>
                    </div>
                    <div class="task-dates">
                        Created ${formatDate(task.created_at)}<br>
                        Updated ${formatDate(task.updated_at)}
                    </div>
                    <div class="task-actions">
                        <button class="secondary-button" type="button" data-action="edit" data-id="${task.id}">Edit</button>
                        <button class="secondary-button danger-button" type="button" data-action="delete" data-id="${task.id}">Delete</button>
                    </div>
                </article>
            `;
        })
        .join("");
}

function resetTaskForm() {
    state.editingTaskId = null;
    elements.taskForm.reset();
    elements.taskStatus.value = "pending";
    elements.taskFormTitle.textContent = "Create a task";
    elements.taskSubmitButton.textContent = "Save task";
    elements.cancelEditButton.classList.add("hidden");
}

async function loadTasks(page = 1) {
    if (!state.access) {
        return;
    }

    const params = {
        page,
        status: elements.statusFilter.value,
    };

    const data = await apiRequest(buildUrl("/api/tasks/", params));
    renderTasks(data);
}

async function handleRegister(event) {
    event.preventDefault();
    hideMessage();

    const formData = new FormData(elements.registerForm);
    const payload = Object.fromEntries(formData.entries());

    try {
        await apiRequest("/api/register/", {
            method: "POST",
            body: payload,
        });
        elements.registerForm.reset();
        showMessage("Registration successful. You can log in now.");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function handleLogin(event) {
    event.preventDefault();
    hideMessage();

    const formData = new FormData(elements.loginForm);
    const payload = Object.fromEntries(formData.entries());

    try {
        const data = await apiRequest("/api/login/", {
            method: "POST",
            body: payload,
        });
        saveAuth(data);
        setAuthUi();
        await loadTasks(1);
        elements.loginForm.reset();
        showMessage("Login successful.");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function handleLogout() {
    hideMessage();

    try {
        if (state.refresh) {
            await apiRequest("/api/logout/", {
                method: "POST",
                body: { refresh: state.refresh },
            });
        }
    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        clearAuth();
        setAuthUi();
        showMessage("You have been logged out.");
    }
}

async function handleTaskSubmit(event) {
    event.preventDefault();
    hideMessage();

    const payload = {
        title: elements.taskTitle.value,
        description: elements.taskDescription.value,
        status: elements.taskStatus.value,
    };

    const isEditing = Boolean(state.editingTaskId);
    const path = isEditing ? `/api/tasks/${state.editingTaskId}/` : "/api/tasks/";
    const method = isEditing ? "PATCH" : "POST";

    try {
        await apiRequest(path, { method, body: payload });
        resetTaskForm();
        await loadTasks(state.currentPage);
        showMessage(isEditing ? "Task updated successfully." : "Task created successfully.");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function populateTaskForEdit(taskId) {
    try {
        const task = await apiRequest(`/api/tasks/${taskId}/`);
        state.editingTaskId = task.id;
        elements.taskTitle.value = task.title;
        elements.taskDescription.value = task.description;
        elements.taskStatus.value = task.status;
        elements.taskFormTitle.textContent = "Edit task";
        elements.taskSubmitButton.textContent = "Update task";
        elements.cancelEditButton.classList.remove("hidden");
        window.scrollTo({ top: elements.taskForm.offsetTop - 20, behavior: "smooth" });
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function deleteTask(taskId) {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`/api/tasks/${taskId}/`, { method: "DELETE" });
        const nextPage = elements.taskList.children.length === 1 && state.currentPage > 1
            ? state.currentPage - 1
            : state.currentPage;
        await loadTasks(nextPage);
        showMessage("Task deleted successfully.");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

elements.registerForm.addEventListener("submit", handleRegister);
elements.loginForm.addEventListener("submit", handleLogin);
elements.logoutButton.addEventListener("click", handleLogout);
elements.refreshButton.addEventListener("click", () => loadTasks(state.currentPage));
elements.taskForm.addEventListener("submit", handleTaskSubmit);
elements.cancelEditButton.addEventListener("click", resetTaskForm);
elements.statusFilter.addEventListener("change", () => loadTasks(1));
elements.previousPage.addEventListener("click", () => loadTasks(state.currentPage - 1));
elements.nextPage.addEventListener("click", () => loadTasks(state.currentPage + 1));

elements.taskList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
        return;
    }

    const taskId = button.dataset.id;
    if (button.dataset.action === "edit") {
        populateTaskForEdit(taskId);
        return;
    }

    if (button.dataset.action === "delete") {
        deleteTask(taskId);
    }
});

setAuthUi();
if (state.access) {
    loadTasks().catch((error) => showMessage(error.message, "error"));
}
