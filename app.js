const STORAGE_KEY = "todo-app-tasks-by-date";
const LEGACY_STORAGE_KEY = "todo-app-tasks"; // pre-calendar, undated tasks (discarded)

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const emptyMsg = document.getElementById("empty-msg");
const selectedDateLabel = document.getElementById("selected-date");
const monthLabel = document.getElementById("month-label");
const calendarGrid = document.getElementById("calendar-grid");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const todayBtn = document.getElementById("today-btn");

// All tasks, keyed by local date "YYYY-MM-DD" -> [{ id, text, done }]
const tasksByDate = loadAllTasks();

let selectedDate = toDateKey(new Date());
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0-11
let tasks = getTasksFor(selectedDate); // tasks for the selected date

// ---------- Dates ----------

// Local-time key (toISOString would use UTC and can shift the day).
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ---------- Storage ----------

function loadAllTasks() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function getTasksFor(dateKey) {
  return Array.isArray(tasksByDate[dateKey]) ? tasksByDate[dateKey].map((t) => ({ ...t })) : [];
}

// Write the selected date's tasks into the store and persist everything.
function saveTasks() {
  if (tasks.length) {
    tasksByDate[selectedDate] = tasks.map((t) => ({ ...t }));
  } else {
    delete tasksByDate[selectedDate];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksByDate));
  } catch {
    // Storage unavailable (e.g. private mode); keep working in memory.
  }
}

// ---------- Date selection ----------

function selectDate(dateKey) {
  if (dateKey === selectedDate) return;
  saveTasks(); // save the current date before leaving it
  selectedDate = dateKey;
  tasks = getTasksFor(selectedDate);

  const d = fromDateKey(dateKey);
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();

  render();
}

// ---------- Rendering ----------

function renderCalendar() {
  const viewDate = new Date(viewYear, viewMonth, 1);
  monthLabel.textContent = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  calendarGrid.innerHTML = "";

  // Monday-first: shift JS getDay() (Sun=0) so Mon=0 ... Sun=6.
  const leadingBlanks = (viewDate.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  for (let i = 0; i < leadingBlanks; i++) {
    const blank = document.createElement("span");
    blank.className = "day blank";
    calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = toDateKey(new Date(viewYear, viewMonth, day));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day";
    btn.dataset.date = key;
    btn.textContent = day;

    if (key === todayKey) btn.classList.add("today");
    if (key === selectedDate) {
      btn.classList.add("selected");
      btn.setAttribute("aria-pressed", "true");
    }

    const dayTasks = key === selectedDate ? tasks : tasksByDate[key] || [];
    if (dayTasks.length) {
      btn.classList.add(dayTasks.every((t) => t.done) ? "has-tasks-done" : "has-tasks");
    }

    btn.setAttribute(
      "aria-label",
      fromDateKey(key).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) +
        (dayTasks.length ? `, ${dayTasks.length} task${dayTasks.length > 1 ? "s" : ""}` : "")
    );

    calendarGrid.appendChild(btn);
  }
}

function renderTasks() {
  selectedDateLabel.textContent = fromDateKey(selectedDate).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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

function render() {
  renderCalendar();
  renderTasks();
}

// ---------- Events ----------

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

calendarGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".day[data-date]");
  if (btn) selectDate(btn.dataset.date);
});

prevMonthBtn.addEventListener("click", () => {
  viewMonth--;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  viewMonth++;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  renderCalendar();
});

todayBtn.addEventListener("click", () => {
  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth();
  selectDate(toDateKey(now));
  renderCalendar(); // in case today was already selected but another month was in view
});

// Safety net: persist the current date if the page is closed mid-edit.
window.addEventListener("beforeunload", saveTasks);

render();
