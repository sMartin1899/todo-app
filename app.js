const STORAGE_KEY = "todo-app-tasks";

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const emptyMsg = document.getElementById("empty-msg");

let tasks = loadTasks();

function loadTasks() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage unavailable (e.g. private mode); keep working in memory.
  }
}

function render() {
  list.innerHTML = "";

  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " done" : "");
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "Mark done");

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "×";
    del.setAttribute("aria-label", "Delete task");

    li.append(checkbox, text, del);
    list.appendChild(li);
  }

  emptyMsg.hidden = tasks.length > 0;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), text, done: false });
  saveTasks();
  render();
  input.value = "";
  input.focus();
});

list.addEventListener("change", (e) => {
  if (e.target.type !== "checkbox") return;
  const id = e.target.closest(".task").dataset.id;
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.done = e.target.checked;
    saveTasks();
    render();
  }
});

list.addEventListener("click", (e) => {
  if (!e.target.classList.contains("delete-btn")) return;
  const id = e.target.closest(".task").dataset.id;
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
});

render();
