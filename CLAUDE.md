# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A static, dependency-free todo app: `index.html` + `style.css` + `app.js`. No build step, package manager, linter, or test suite. Keep it library-free (vanilla HTML/CSS/JS) — that is a project requirement.

## Running

Open `index.html` directly in a browser (double-click, or `start index.html` in PowerShell). No server is required.

## Deployment

`main` is published by GitHub Pages at https://smartin1899.github.io/todo-app/. Pages serves files with `Cache-Control: max-age=600`, so browsers can mix a new `index.html` with stale CSS/JS. `index.html` references `style.css?v=N` and `app.js?v=N` for cache-busting: **bump `N` in `index.html` whenever `style.css` or `app.js` changes.**

## Architecture

- **State**: `app.js` keeps `tasksByDate` (all tasks, keyed by local date `"YYYY-MM-DD"` → `[{ id, text, done }]`) plus `tasks`, a working copy of the selected date's list. `selectedDate` is what the task list shows; `viewYear`/`viewMonth` is the month the calendar displays, and they can differ (browsing months doesn't change the selection).
- **Date keys**: always build keys with `toDateKey()` (local time). Don't use `toISOString()` — it's UTC and shifts the day near midnight.
- **Persistence**: `tasksByDate` is serialized to `localStorage` under `todo-app-tasks-by-date`. `saveTasks()` writes `tasks` back into `tasksByDate[selectedDate]` (deleting the key when empty) and then persists. `selectDate()` must call `saveTasks()` before switching dates — that is a stated requirement. Storage access is wrapped in try/catch so the app still works in memory only. The old pre-calendar key `todo-app-tasks` is deliberately deleted on load (the user chose to discard undated tasks rather than migrate them).
- **Update cycle**: every mutation follows `mutate tasks → saveTasks() → render()`. `render()` = `renderCalendar()` (month grid; Monday-first; dots on days with tasks, faded when all done) + `renderTasks()`, each fully rebuilding its DOM; there is no incremental diffing.
- **Events**: toggle and delete use event delegation on `#task-list` (`change` for checkboxes, `click` for `.delete-btn`), resolving the task via the `data-id` on the parent `li.task`. New per-item controls should follow the same pattern rather than attaching listeners inside `render()`.
- **Styling hooks**: completed tasks get the `done` class on `li.task`; the strikethrough is applied by `.task.done .task-text` in `style.css`. Task text is inserted with `textContent` (never `innerHTML`) to avoid HTML injection.
