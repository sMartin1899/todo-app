# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A static, dependency-free todo app: `index.html` + `style.css` + `app.js`. No build step, package manager, linter, or test suite. Keep it library-free (vanilla HTML/CSS/JS) — that is a project requirement.

## Running

Open `index.html` directly in a browser (double-click, or `start index.html` in PowerShell). No server is required.

## Architecture

- **State**: `app.js` holds a single in-memory `tasks` array of `{ id, text, done }`. It is the source of truth; the DOM is always rebuilt from it.
- **Persistence**: the array is serialized to `localStorage` under the key `todo-app-tasks`. `loadTasks()`/`saveTasks()` wrap storage access in try/catch so the app still works (in memory only) when storage is unavailable or corrupt. Changing the task shape or storage key will orphan existing users' saved data unless migrated.
- **Update cycle**: every mutation follows `mutate tasks → saveTasks() → render()`. `render()` clears and re-creates the whole `<ul id="task-list">`; there is no incremental DOM diffing.
- **Events**: toggle and delete use event delegation on `#task-list` (`change` for checkboxes, `click` for `.delete-btn`), resolving the task via the `data-id` on the parent `li.task`. New per-item controls should follow the same pattern rather than attaching listeners inside `render()`.
- **Styling hooks**: completed tasks get the `done` class on `li.task`; the strikethrough is applied by `.task.done .task-text` in `style.css`. Task text is inserted with `textContent` (never `innerHTML`) to avoid HTML injection.
