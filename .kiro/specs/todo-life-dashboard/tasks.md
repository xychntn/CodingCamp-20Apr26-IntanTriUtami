# Implementation Plan: To-Do Life Dashboard

## Overview

Build a single-page, client-side dashboard delivered as three static files (`index.html`, `css/style.css`, `js/app.js`). Each task builds incrementally on the previous one, wiring each widget into the page as it is implemented. No build tools, no frameworks, no external dependencies.

## Tasks

- [x] 1. Project scaffold — create the three static files
  - Create `index.html` with the full semantic page skeleton: `<head>` with charset, viewport meta, title, and a `<link>` to `css/style.css`; `<body>` containing four section containers with stable `id` attributes (`#greeting-widget`, `#focus-timer`, `#todo-list`, `#quick-links`); a `<script src="js/app.js" defer>` tag at the bottom of `<body>`.
  - Create `css/style.css` as an empty file (populated in later tasks).
  - Create `js/app.js` with a `DOMContentLoaded` listener that will call each widget's `init()` in order; leave the widget objects as stubs for now.
  - _Requirements: 5.1, 7.1, 7.2_

- [x] 2. Storage module in `js/app.js`
  - [x] 2.1 Implement the `Storage` module
    - Define constants `STORAGE_KEY_TASKS = 'tld_tasks'` and `STORAGE_KEY_LINKS = 'tld_links'`.
    - Implement `Storage.get(key)`: calls `localStorage.getItem`, parses JSON inside a `try/catch`, returns the parsed value or `null` on any error.
    - Implement `Storage.set(key, value)`: calls `localStorage.setItem(key, JSON.stringify(value))` inside a `try/catch`; on the first caught error sets an internal `available` flag to `false` and inserts a `<div id="storage-warning">` banner at the top of `<body>` with the message *"Local storage is unavailable. Your data will not be saved between sessions."*; subsequent `set` calls are no-ops when `available` is `false`.
    - Implement `Storage.isAvailable()`: returns the `available` boolean.
    - Call `Storage.init()` (or inline the setup) first inside the `DOMContentLoaded` handler.
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Greeting Widget — HTML, JS, and CSS
  - [x] 3.1 Add Greeting Widget markup to `index.html`
    - Inside `#greeting-widget` add: an `<h1 id="greeting-text">` for the greeting phrase, a `<p id="greeting-time">` for the `HH:MM` clock, and a `<p id="greeting-date">` for the formatted date string.
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Implement `GreetingWidget` in `js/app.js`
    - Implement `GreetingWidget.init()`: grabs the three DOM elements by `id`, calls an internal `render()` function immediately, then schedules `setInterval(render, 60000)`.
    - `render()` reads `new Date()`, formats the time as `HH:MM` (zero-padded), formats the date as `"Weekday, Month Day"` using `toLocaleDateString` or manual arrays, and derives the greeting from the hour: 05–11 → "Good Morning", 12–17 → "Good Afternoon", 18–20 → "Good Evening", 21–04 → "Good Night".
    - Wire `GreetingWidget.init()` into the `DOMContentLoaded` handler.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 3.3 Style the Greeting Widget in `css/style.css`
    - Style `#greeting-widget` with padding, a distinct background or border to separate it visually from other widgets.
    - Set `#greeting-time` to a large, readable font size (≥ 14px; aim for 2–3 rem for the clock).
    - Ensure all text in the widget meets the 14px minimum body-text rule.
    - _Requirements: 5.2, 5.3_

- [x] 4. Focus Timer — HTML, JS, and CSS
  - [x] 4.1 Add Focus Timer markup to `index.html`
    - Inside `#focus-timer` add: a `<div id="timer-display">` showing `25:00`, and three `<button>` elements with `id`s `btn-start`, `btn-stop`, `btn-reset` labelled "Start", "Stop", "Reset".
    - _Requirements: 2.1, 2.7_
  - [x] 4.2 Implement `FocusTimer` in `js/app.js`
    - Implement `FocusTimer.init()`: initialise `remainingSeconds = 1500` and `intervalId = null`; grab DOM elements; render the initial `25:00` display; attach click handlers to the three buttons.
    - Start handler: if `intervalId` is not null, do nothing (no-op); otherwise set `intervalId = setInterval(tick, 1000)` and disable the Start button.
    - `tick()`: decrement `remainingSeconds`; update the `MM:SS` display; if `remainingSeconds === 0` call `complete()`.
    - Stop handler: `clearInterval(intervalId)`, set `intervalId = null`, re-enable Start button.
    - Reset handler: `clearInterval(intervalId)`, set `intervalId = null`, restore `remainingSeconds = 1500`, re-render `25:00`, re-enable Start button, remove `timer--complete` class.
    - `complete()`: `clearInterval(intervalId)`, set `intervalId = null`, add CSS class `timer--complete` to `#timer-display`, attempt to play a short beep via `AudioContext` (wrap in `try/catch` to degrade gracefully if unavailable).
    - Wire `FocusTimer.init()` into the `DOMContentLoaded` handler.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [x] 4.3 Style the Focus Timer in `css/style.css`
    - Style `#focus-timer` with padding and a visual boundary (border or background).
    - Style `#timer-display` with a large monospace font.
    - Add a `.timer--complete` rule that applies a visual flash or highlight (e.g. colour change or animation) to signal completion.
    - Style the three control buttons consistently.
    - _Requirements: 2.6, 5.2, 5.3_

- [x] 5. To-Do List — HTML, JS, and CSS
  - [x] 5.1 Add To-Do List markup to `index.html`
    - Inside `#todo-list` add: an `<input id="todo-input" type="text">` for new task descriptions, an `<button id="btn-add-todo">` labelled "Add", a `<span class="validation-msg" id="todo-validation">` for inline error messages, and an empty `<ul id="todo-items">` where tasks will be rendered.
    - _Requirements: 3.1, 3.2_
  - [x] 5.2 Implement `TodoList` in `js/app.js`
    - Implement `TodoList.init()`: load `tasks` array from `Storage.get(STORAGE_KEY_TASKS)` (default to `[]` if `null`); grab DOM elements; call `renderAll()`; attach the Add button click handler and Enter-key handler on the input.
    - `addTask(description)`: trim input; if empty show validation message and return; create a Task object `{ id: crypto.randomUUID(), description, completed: false }`; push to `tasks`; persist; call `renderAll()`; clear input and validation message.
    - `renderAll()`: clear `#todo-items`; for each task call `renderTask(task)` and append the returned `<li>` to the list.
    - `renderTask(task)`: build the `<li data-id>` structure with a checkbox (`checked` if `task.completed`), a `<span class="task-text">`, a hidden `<input class="task-edit">`, a `.btn-edit` button, and a `.btn-delete` button; apply `task--complete` class to the `<li>` if completed; attach inline event handlers for toggle, edit, and delete.
    - Toggle handler: flip `task.completed`; persist; re-render.
    - Edit handler: swap classes `task--display` / `task--editing` on the `<li>`; focus the edit input pre-filled with current description; on confirm (Enter or blur) validate non-empty, update `task.description`, persist, re-render; if empty restore previous description and exit edit mode.
    - Delete handler: remove task from `tasks` array; persist; re-render.
    - `persist()`: calls `Storage.set(STORAGE_KEY_TASKS, tasks)`.
    - Wire `TodoList.init()` into the `DOMContentLoaded` handler.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_
  - [x] 5.3 Style the To-Do List in `css/style.css`
    - Style `#todo-list` with padding and a visual boundary.
    - Style `<li>` task items with flex layout to align checkbox, text, and buttons on one row.
    - Add a `.task--complete` rule that applies a strikethrough and reduced opacity to completed tasks.
    - Hide `.task-edit` by default; show it (and hide `.task-text`) when the parent `<li>` has class `task--editing`.
    - Style `.validation-msg` in a warning colour (e.g. red or amber).
    - Ensure all labels and text meet the 14px minimum.
    - _Requirements: 3.6, 5.2, 5.3_

- [x] 6. Quick Links Panel — HTML, JS, and CSS
  - [x] 6.1 Add Quick Links Panel markup to `index.html`
    - Inside `#quick-links` add: an `<input id="link-label-input" type="text" placeholder="Label">`, an `<input id="link-url-input" type="url" placeholder="https://...">`, a `<button id="btn-add-link">` labelled "Add Link", a `<span class="validation-msg" id="link-validation">` for inline error messages, and an empty `<div id="link-buttons">` where link buttons will be rendered.
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.2 Implement `QuickLinksPanel` in `js/app.js`
    - Implement `QuickLinksPanel.init()`: load `links` array from `Storage.get(STORAGE_KEY_LINKS)` (default to `[]` if `null`); grab DOM elements; call `renderAll()`; attach the Add button click handler.
    - `addLink(label, url)`: trim both inputs; validate label non-empty and URL non-empty and starts with `http://` or `https://`; on failure show a specific inline validation message and return; create `{ id: crypto.randomUUID(), label, url }`; push to `links`; persist; call `renderAll()`; clear inputs and validation message.
    - `renderAll()`: clear `#link-buttons`; for each link call `renderLink(link)` and append to the container.
    - `renderLink(link)`: build a wrapper `<span>` containing an `<a href="{url}" target="_blank" rel="noopener noreferrer">` button-styled element with `link.label` as text, and a small delete `<button>`; attach delete handler.
    - Delete handler: remove link from `links` array; persist; re-render.
    - `persist()`: calls `Storage.set(STORAGE_KEY_LINKS, links)`.
    - Wire `QuickLinksPanel.init()` into the `DOMContentLoaded` handler.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  - [x] 6.3 Style the Quick Links Panel in `css/style.css`
    - Style `#quick-links` with padding and a visual boundary.
    - Style `#link-buttons` as a flex-wrap container so link buttons flow naturally across multiple rows.
    - Style each link `<a>` as a pill or button shape with hover state.
    - Style the delete button as a small inline control (e.g. an "×" icon) positioned relative to the link button.
    - Ensure all text meets the 14px minimum.
    - _Requirements: 4.4, 5.2, 5.3_

- [x] 7. Responsive layout and visual polish in `css/style.css`
  - [x] 7.1 Implement the overall page layout
    - Style `<body>` with a base font family, background colour, and minimum font size of 14px.
    - Lay out the four widget containers using CSS Grid or Flexbox so they fill the viewport sensibly on wide screens (e.g. 2×2 grid) and stack vertically on narrow screens.
    - Add a CSS custom-property palette (e.g. `--color-bg`, `--color-surface`, `--color-accent`) and apply it consistently across all widget styles added in previous tasks.
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 7.2 Add responsive breakpoints
    - Add a `@media (max-width: 768px)` breakpoint that switches the layout to a single-column stack.
    - Verify (by inspection) that no horizontal scrollbar appears at 320px viewport width.
    - Ensure all interactive controls (buttons, inputs) have a minimum touch target size of 44×44 px on small viewports.
    - _Requirements: 5.4_
  - [x] 7.3 Final wiring checkpoint
    - Review `js/app.js` to confirm all five modules (`Storage`, `GreetingWidget`, `FocusTimer`, `TodoList`, `QuickLinksPanel`) are initialised in the `DOMContentLoaded` handler in the correct order.
    - Review `index.html` to confirm all `id` attributes referenced in `app.js` are present and correctly spelled.
    - Review `css/style.css` to confirm all CSS classes referenced in `app.js` (`timer--complete`, `task--complete`, `task--editing`, `task-text`, `task-edit`, `validation-msg`) are defined.
    - _Requirements: 5.1, 6.1, 6.2, 7.1, 7.2_

## Notes

- No test files, test setup, or testing framework is included — all verification is manual per the design document's checklist.
- Each task references specific requirements for traceability.
- Tasks build incrementally: scaffold → storage → widgets one by one → layout polish → final wiring check.
- The Storage module must be implemented before any widget that persists data (tasks 3–6 depend on task 2).
 