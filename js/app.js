/* ── Storage Keys ────────────────────────────────────────── */
const STORAGE_KEY_TASKS    = 'tld_tasks';
const STORAGE_KEY_LINKS    = 'tld_links';
const STORAGE_KEY_NAME     = 'tld_name';
const STORAGE_KEY_THEME    = 'tld_theme';
const STORAGE_KEY_DURATION = 'tld_duration';

/* ── Storage Module ──────────────────────────────────────── */
const Storage = {
  available: true,

  init() {},

  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  set(key, value) {
    if (!this.available) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      this.available = false;
      const existing = document.getElementById('storage-warning');
      if (!existing) {
        const banner = document.createElement('div');
        banner.id = 'storage-warning';
        banner.textContent =
          'Local storage is unavailable. Your data will not be saved between sessions.';
        document.body.insertBefore(banner, document.body.firstChild);
      }
    }
  },

  isAvailable() {
    return this.available;
  },
};

/* ── Theme Module ────────────────────────────────────────── */
const ThemeManager = {
  _current: 'dark',

  init() {
    const saved = Storage.get(STORAGE_KEY_THEME);
    this._current = saved === 'light' ? 'light' : 'dark';
    this._apply();

    const btn = document.getElementById('btn-theme-toggle');
    if (btn) btn.addEventListener('click', () => this.toggle());
  },

  toggle() {
    this._current = this._current === 'dark' ? 'light' : 'dark';
    this._apply();
    Storage.set(STORAGE_KEY_THEME, this._current);
  },

  _apply() {
    document.documentElement.setAttribute('data-theme', this._current);
    const icon  = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (icon)  icon.textContent  = this._current === 'dark' ? '☀️' : '🌙';
    if (label) label.textContent = this._current === 'dark' ? 'Light' : 'Dark';
  },
};

/* ── Greeting Widget ─────────────────────────────────────── */
const GreetingWidget = {
  _textEl: null,
  _timeEl: null,
  _dateEl: null,
  _userName: '',

  init() {
    this._textEl = document.getElementById('greeting-text');
    this._timeEl = document.getElementById('greeting-time');
    this._dateEl = document.getElementById('greeting-date');

    // Load saved name
    this._userName = Storage.get(STORAGE_KEY_NAME) || '';

    // Populate toolbar name input
    const nameInput = document.getElementById('toolbar-name-input');
    const saveBtn   = document.getElementById('btn-save-name');
    if (nameInput) nameInput.value = this._userName;

    if (saveBtn && nameInput) {
      saveBtn.addEventListener('click', () => {
        this._userName = nameInput.value.trim();
        Storage.set(STORAGE_KEY_NAME, this._userName);
        this._render();
      });
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveBtn.click();
      });
    }

    this._render();
    setInterval(() => this._render(), 1000);
  },

  _render() {
    const now     = new Date();
    const hours   = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // HH:MM:SS
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    this._timeEl.textContent = `${hh}:${mm}:${ss}`;

    // "Weekday, Month Day"
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months   = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
    this._dateEl.textContent =
      `${weekdays[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

    // Greeting phrase
    let phrase;
    if (hours >= 5  && hours <= 11) phrase = 'Good Morning';
    else if (hours >= 12 && hours <= 17) phrase = 'Good Afternoon';
    else if (hours >= 18 && hours <= 20) phrase = 'Good Evening';
    else phrase = 'Good Night';

    this._textEl.textContent = this._userName
      ? `${phrase}, ${this._userName}!`
      : phrase;
  },
};

/* ── Focus Timer ─────────────────────────────────────────── */
const FocusTimer = {
  _totalSeconds:     1500,
  remainingSeconds:  1500,
  intervalId:        null,
  _displayEl:        null,
  _btnStart:         null,
  _btnStop:          null,
  _btnReset:         null,
  _durationInput:    null,
  _btnSetDuration:   null,

  init() {
    // Load saved duration
    const savedMin = Storage.get(STORAGE_KEY_DURATION);
    if (savedMin && Number.isInteger(savedMin) && savedMin >= 1 && savedMin <= 120) {
      this._totalSeconds = savedMin * 60;
    }
    this.remainingSeconds = this._totalSeconds;
    this.intervalId = null;

    this._displayEl      = document.getElementById('timer-display');
    this._btnStart       = document.getElementById('btn-start');
    this._btnStop        = document.getElementById('btn-stop');
    this._btnReset       = document.getElementById('btn-reset');
    this._durationInput  = document.getElementById('timer-duration-input');
    this._btnSetDuration = document.getElementById('btn-set-duration');

    // Populate duration input
    if (this._durationInput) {
      this._durationInput.value = this._totalSeconds / 60;
    }

    this._updateDisplay();

    this._btnStart.addEventListener('click',       () => this._start());
    this._btnStop.addEventListener('click',        () => this._stop());
    this._btnReset.addEventListener('click',       () => this._reset());
    this._btnSetDuration.addEventListener('click', () => this._setDuration());
    this._durationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._setDuration();
    });
  },

  _setDuration() {
    const val = parseInt(this._durationInput.value, 10);
    if (!val || val < 1 || val > 120) return;
    // Only apply if timer is not running
    if (this.intervalId !== null) return;
    this._totalSeconds    = val * 60;
    this.remainingSeconds = this._totalSeconds;
    this._displayEl.classList.remove('timer--complete');
    this._updateDisplay();
    Storage.set(STORAGE_KEY_DURATION, val);
  },

  _start() {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this._tick(), 1000);
    this._btnStart.disabled = true;
  },

  _tick() {
    this.remainingSeconds -= 1;
    this._updateDisplay();
    if (this.remainingSeconds === 0) this._complete();
  },

  _stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this._btnStart.disabled = false;
  },

  _reset() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.remainingSeconds = this._totalSeconds;
    this._updateDisplay();
    this._btnStart.disabled = false;
    this._displayEl.classList.remove('timer--complete');
  },

  _complete() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this._displayEl.classList.add('timer--complete');
    this._btnStart.disabled = false;

    try {
      const ctx        = new AudioContext();
      const osc        = ctx.createOscillator();
      const gain       = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) { /* AudioContext unavailable — degrade gracefully */ }
  },

  _updateDisplay() {
    const mm = String(Math.floor(this.remainingSeconds / 60)).padStart(2, '0');
    const ss = String(this.remainingSeconds % 60).padStart(2, '0');
    this._displayEl.textContent = `${mm}:${ss}`;
  },
};

/* ── To-Do List ──────────────────────────────────────────── */
const TodoList = {
  tasks:         [],
  _sortMode:     'none',
  _inputEl:      null,
  _btnAdd:       null,
  _validationEl: null,
  _listEl:       null,
  _sortSelect:   null,

  init() {
    this.tasks = Storage.get(STORAGE_KEY_TASKS) || [];

    this._inputEl      = document.getElementById('todo-input');
    this._btnAdd       = document.getElementById('btn-add-todo');
    this._validationEl = document.getElementById('todo-validation');
    this._listEl       = document.getElementById('todo-items');
    this._sortSelect   = document.getElementById('todo-sort-select');

    this._renderAll();

    this._btnAdd.addEventListener('click', () => this._addTask());
    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._addTask();
    });
    this._sortSelect.addEventListener('change', () => {
      this._sortMode = this._sortSelect.value;
      this._renderAll();
    });
  },

  _addTask() {
    const trimmed = this._inputEl.value.trim();
    if (!trimmed) {
      this._validationEl.textContent = 'Task description cannot be empty.';
      return;
    }

    // Duplicate check (case-insensitive)
    const isDuplicate = this.tasks.some(
      (t) => t.description.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      this._validationEl.textContent = 'A task with that description already exists.';
      return;
    }

    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random();

    this.tasks.push({ id, description: trimmed, completed: false });
    this._persist();
    this._renderAll();
    this._inputEl.value = '';
    this._validationEl.textContent = '';
  },

  _getSortedTasks() {
    const copy = [...this.tasks];
    switch (this._sortMode) {
      case 'name-asc':
        return copy.sort((a, b) => a.description.localeCompare(b.description));
      case 'name-desc':
        return copy.sort((a, b) => b.description.localeCompare(a.description));
      case 'status':
        return copy.sort((a, b) => Number(a.completed) - Number(b.completed));
      default:
        return copy;
    }
  },

  _renderAll() {
    this._listEl.innerHTML = '';
    this._getSortedTasks().forEach((task) => {
      this._listEl.appendChild(this._renderTask(task));
    });
  },

  _renderTask(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('task--complete');

    // Checkbox
    const checkbox    = document.createElement('input');
    checkbox.type     = 'checkbox';
    checkbox.checked  = task.completed;
    checkbox.addEventListener('change', () => {
      // Update the source task in this.tasks (not the sorted copy)
      const src = this.tasks.find((t) => t.id === task.id);
      if (src) src.completed = checkbox.checked;
      this._persist();
      this._renderAll();
    });

    // Display text
    const span       = document.createElement('span');
    span.className   = 'task-text';
    span.textContent = task.description;

    // Edit input
    const editInput   = document.createElement('input');
    editInput.type    = 'text';
    editInput.className = 'task-edit';
    editInput.value   = task.description;

    const confirmEdit = () => {
      const newVal = editInput.value.trim();
      if (newVal) {
        const src = this.tasks.find((t) => t.id === task.id);
        if (src) src.description = newVal;
        this._persist();
        this._renderAll();
      } else {
        editInput.value = task.description;
        li.classList.remove('task--editing');
      }
    };

    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); }
    });
    editInput.addEventListener('blur', confirmEdit);

    // Edit button
    const btnEdit       = document.createElement('button');
    btnEdit.className   = 'btn-edit';
    btnEdit.textContent = 'Edit';
    btnEdit.addEventListener('click', () => {
      li.classList.add('task--editing');
      editInput.focus();
    });

    // Delete button
    const btnDelete       = document.createElement('button');
    btnDelete.className   = 'btn-delete';
    btnDelete.textContent = 'Delete';
    btnDelete.addEventListener('click', () => {
      this.tasks = this.tasks.filter((t) => t.id !== task.id);
      this._persist();
      this._renderAll();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editInput);
    li.appendChild(btnEdit);
    li.appendChild(btnDelete);

    return li;
  },

  _persist() {
    Storage.set(STORAGE_KEY_TASKS, this.tasks);
  },
};

/* ── Quick Links Panel ───────────────────────────────────── */
const QuickLinksPanel = {
  links:         [],
  _labelInputEl: null,
  _urlInputEl:   null,
  _btnAdd:       null,
  _validationEl: null,
  _containerEl:  null,

  init() {
    this.links = Storage.get(STORAGE_KEY_LINKS) || [];

    this._labelInputEl = document.getElementById('link-label-input');
    this._urlInputEl   = document.getElementById('link-url-input');
    this._btnAdd       = document.getElementById('btn-add-link');
    this._validationEl = document.getElementById('link-validation');
    this._containerEl  = document.getElementById('link-buttons');

    this._renderAll();
    this._btnAdd.addEventListener('click', () => this._addLink());
  },

  _addLink() {
    const label = this._labelInputEl.value.trim();
    const url   = this._urlInputEl.value.trim();

    if (!label) {
      this._validationEl.textContent = 'Label cannot be empty.';
      return;
    }
    if (!url) {
      this._validationEl.textContent = 'URL cannot be empty.';
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this._validationEl.textContent = 'URL must start with http:// or https://';
      return;
    }

    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random();

    this.links.push({ id, label, url });
    this._persist();
    this._renderAll();
    this._labelInputEl.value = '';
    this._urlInputEl.value   = '';
    this._validationEl.textContent = '';
  },

  _renderAll() {
    this._containerEl.innerHTML = '';
    this.links.forEach((link) => {
      this._containerEl.appendChild(this._renderLink(link));
    });
  },

  _renderLink(link) {
    const wrapper     = document.createElement('span');
    wrapper.className = 'link-item';

    const anchor      = document.createElement('a');
    anchor.href       = link.url;
    anchor.target     = '_blank';
    anchor.rel        = 'noopener noreferrer';
    anchor.className  = 'link-btn';
    anchor.textContent = link.label;

    const btnDelete   = document.createElement('button');
    btnDelete.className   = 'link-delete';
    btnDelete.textContent = '×';
    btnDelete.setAttribute('aria-label', `Delete ${link.label}`);
    btnDelete.addEventListener('click', () => {
      this.links = this.links.filter((l) => l.id !== link.id);
      this._persist();
      this._renderAll();
    });

    wrapper.appendChild(anchor);
    wrapper.appendChild(btnDelete);
    return wrapper;
  },

  _persist() {
    Storage.set(STORAGE_KEY_LINKS, this.links);
  },
};

/* ── Bootstrap ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Storage.init();
  ThemeManager.init();
  GreetingWidget.init();
  FocusTimer.init();
  TodoList.init();
  QuickLinksPanel.init();
});
