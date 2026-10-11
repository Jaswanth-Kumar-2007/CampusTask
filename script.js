const STORAGE_KEY = "campustask-tasks";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const categoryInput = document.getElementById("task-category");
const dueInput = document.getElementById("task-due");
const titleError = document.getElementById("title-error");
const dateError = document.getElementById("date-error");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const pendingCount = document.getElementById("pending-count");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = loadTasks();
let currentFilter = "all";

form.addEventListener("submit", handleAddTask);
titleInput.addEventListener("input", () => hideError(titleInput, titleError));
dueInput.addEventListener("input", () => hideError(dueInput, dateError));

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    render();
  });
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const taskId = button.closest(".task-item").dataset.id;

  if (button.classList.contains("checkbox")) {
    toggleTask(taskId);
  }

  if (button.classList.contains("delete-btn")) {
    deleteTask(taskId);
  }
});

render();

function handleAddTask(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const dueDate = dueInput.value;
  let isValid = true;

  if (!title) {
    showError(titleInput, titleError, "Please enter a task title.");
    isValid = false;
  } else if (title.length < 3) {
    showError(
      titleInput,
      titleError,
      "Titles need at least 3 characters."
    );
    isValid = false;
  }

  if (!dueDate) {
    showError(dueInput, dateError, "Please choose a due date.");
    isValid = false;
  }

  if (!isValid) {
    return;
  }

  tasks.unshift({
    id: String(Date.now()),
    title: title,
    category: category,
    dueDate: dueDate,
    completed: false,
  });

  saveTasks();
  form.reset();
  hideError(titleInput, titleError);
  hideError(dueInput, dateError);
  titleInput.focus();
  render();
}

function toggleTask(id) {
  tasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("CampusTask could not read saved tasks.", error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getVisibleTasks() {
  if (currentFilter === "pending") {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function render() {
  const visibleTasks = getVisibleTasks();
  const completed = tasks.filter((task) => task.completed).length;

  totalCount.textContent = String(tasks.length);
  completedCount.textContent = String(completed);
  pendingCount.textContent = String(tasks.length - completed);

  taskList.innerHTML = visibleTasks.map(createTaskHtml).join("");

  const isEmpty = visibleTasks.length === 0;
  const emptyMessage = getEmptyMessage(visibleTasks.length);
  emptyState.querySelector("h3").textContent = emptyMessage.title;
  emptyState.querySelector("p").textContent = emptyMessage.detail;
  emptyState.hidden = !isEmpty;
  emptyState.setAttribute("aria-hidden", String(!isEmpty));
}

function getEmptyMessage(visibleCount) {
  if (tasks.length === 0) {
    return {
      title: "No tasks yet",
      detail: "Add your first assignment, study session, or personal reminder.",
    };
  }

  if (visibleCount === 0 && currentFilter === "completed") {
    return {
      title: "No completed tasks",
      detail: "Finish a task and it will show up here.",
    };
  }

  if (visibleCount === 0 && currentFilter === "pending") {
    return {
      title: "You're all caught up",
      detail: "There are no pending tasks right now.",
    };
  }

  return {
    title: "Nothing to show",
    detail: "Try a different filter or add a new task.",
  };
}

function createTaskHtml(task) {
  const completedClass = task.completed ? " completed" : "";
  const checkMark = task.completed ? "✓" : "";
  const dueLabel = formatDueDate(task.dueDate);

  return `
    <li class="task-item${completedClass}" data-id="${task.id}">
      <button
        class="checkbox"
        type="button"
        aria-label="Mark ${escapeHtml(task.title)} as ${
          task.completed ? "pending" : "completed"
        }"
      >${checkMark}</button>
      <div>
        <p class="task-title">${escapeHtml(task.title)}</p>
        <p class="task-meta">
          <span class="badge">${escapeHtml(task.category)}</span>
          Due ${dueLabel}
        </p>
      </div>
      <button class="delete-btn" type="button">Delete</button>
    </li>
  `;
}

function formatDueDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "no date";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function showError(input, errorEl, message) {
  input.classList.add("is-invalid");
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function hideError(input, errorEl) {
  input.classList.remove("is-invalid");
  errorEl.textContent = "";
  errorEl.hidden = true;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
