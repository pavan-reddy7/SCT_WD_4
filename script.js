/* ==========================================================================
   TaskFlow — Modern To-Do App JavaScript
   ========================================================================== */

'use strict';

/* ── Constants ─────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'taskflow_tasks';
const THEME_KEY   = 'taskflow_theme';
const NAME_KEY    = 'taskflow_username';

/* ── DOM References ────────────────────────────────────────────────────── */
const DOM = {
  // Name modal
  nameModal:      document.getElementById('name-modal'),
  nameModalForm:  document.getElementById('name-modal-form'),
  nameModalInput: document.getElementById('name-modal-input'),

  // Greeting
  greetingArea:  document.getElementById('greeting-area'),
  greetingText:  document.getElementById('greeting-text'),
  greetingEmoji: document.getElementById('greeting-emoji'),

  // Profile
  profileWrapper:    document.getElementById('profile-wrapper'),
  profileBtn:        document.getElementById('profile-btn'),
  profileDropdown:   document.getElementById('profile-dropdown'),
  profileInitials:   document.getElementById('profile-initials'),
  profileInitialsLg: document.getElementById('profile-initials-lg'),
  profileNameDisplay: document.getElementById('profile-name-display'),

  // Form
  form:           document.getElementById('task-form'),
  titleInput:     document.getElementById('task-title-input'),
  descInput:      document.getElementById('task-desc-input'),
  dateInput:      document.getElementById('task-date-input'),
  timeInput:      document.getElementById('task-time-input'),
  priorityInput:  document.getElementById('task-priority-input'),
  addBtn:         document.getElementById('add-task-btn'),

  // Stats
  statTotal:          document.getElementById('stat-total'),
  statActive:         document.getElementById('stat-active'),
  statCompleted:      document.getElementById('stat-completed'),
  statMissed:         document.getElementById('stat-missed'),
  statTotalValue:     document.getElementById('stat-total-value'),
  statActiveValue:    document.getElementById('stat-active-value'),
  statCompletedValue: document.getElementById('stat-completed-value'),
  statMissedValue:    document.getElementById('stat-missed-value'),

  // Toolbar
  searchInput:    document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  filterGroup:    document.getElementById('filter-group'),
  sortSelect:     document.getElementById('sort-select'),

  // Task lists
  todaySection:       document.getElementById('today-section'),
  todayTaskList:      document.getElementById('today-task-list'),
  todayCount:         document.getElementById('today-count'),
  activeSection:      document.getElementById('active-section'),
  activeTaskList:     document.getElementById('active-task-list'),
  activeCount:        document.getElementById('active-count'),
  completedSection:   document.getElementById('completed-section'),
  completedTaskList:  document.getElementById('completed-task-list'),
  completedCount:     document.getElementById('completed-count'),

  // Empty state
  emptyState:    document.getElementById('empty-state'),
  emptyTitle:    document.getElementById('empty-title'),
  emptySubtitle: document.getElementById('empty-subtitle'),

  // Delete modal
  deleteModal:      document.getElementById('delete-modal'),
  modalCancelBtn:   document.getElementById('modal-cancel-btn'),
  modalConfirmBtn:  document.getElementById('modal-confirm-btn'),

  // Complete confirmation modal
  completeModal:       document.getElementById('complete-modal'),
  completeModalTitle:  document.getElementById('complete-modal-title'),
  completeModalMsg:    document.getElementById('complete-modal-message'),
  completeCancelBtn:   document.getElementById('complete-cancel-btn'),
  completeConfirmBtn:  document.getElementById('complete-confirm-btn'),

  // Reset data modal
  resetModal:       document.getElementById('reset-modal'),
  resetCancelBtn:   document.getElementById('reset-cancel-btn'),
  resetConfirmBtn:  document.getElementById('reset-confirm-btn'),

  // Export format modal
  exportModal:      document.getElementById('export-modal'),
  exportJsonBtn:    document.getElementById('export-json-btn'),
  exportCsvBtn:     document.getElementById('export-csv-btn'),
  exportCancelBtn:  document.getElementById('export-cancel-btn'),

  // Import modal
  importModal:      document.getElementById('import-modal'),
  importTextarea:   document.getElementById('import-textarea'),
  importFileInput:  document.getElementById('import-file-input'),
  importFileName:   document.getElementById('import-file-name'),
  importCancelBtn:  document.getElementById('import-cancel-btn'),
  importConfirmBtn: document.getElementById('import-confirm-btn'),

  // Header actions
  themeToggle: document.getElementById('theme-toggle-btn'),
  exportBtn:   document.getElementById('export-btn'),
  importBtn:   document.getElementById('import-btn'),

  // Toast
  toastContainer: document.getElementById('toast-container'),

  // Footer
  footerYear:    document.getElementById('footer-year'),
  footerDevName: document.getElementById('footer-dev-name'),

  // Sections for scrolling
  addTaskSection: document.getElementById('add-task-section'),
};

/* ── State ─────────────────────────────────────────────────────────────── */
let tasks           = [];
let currentFilter   = 'active';
let currentSort     = 'created-desc';
let searchQuery     = '';
let deleteTargetId  = null;
let completeTargetId = null;
let editingTaskId   = null;
let userName        = '';
let pendingAction   = null;

/* ── Utility Functions ─────────────────────────────────────────────────── */

/** Generate a unique ID for tasks. */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/** Format a date string to human-readable form. */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format a time string to 12-hour format. */
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Format a creation timestamp to a readable string. */
function formatTimestamp(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' +
         d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Check if a task is overdue (missed). */
function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  const now = new Date();
  let dueDateTime;
  if (task.dueTime) {
    dueDateTime = new Date(task.dueDate + 'T' + task.dueTime);
  } else {
    dueDateTime = new Date(task.dueDate + 'T23:59:59');
  }
  return now > dueDateTime;
}

/** Check if a task is due today. */
function isToday(task) {
  if (!task.dueDate) return false;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
  return task.dueDate === todayStr;
}

/** Check if a date and time are in the future. */
function validateFutureDateTime(dateStr, timeStr) {
  if (!dateStr) return true; // Optional date is always valid

  const now = new Date();
  let dueDateTime;
  if (timeStr) {
    dueDateTime = new Date(dateStr + 'T' + timeStr);
  } else {
    // If no time is specified, default to the end of that day (23:59:59)
    dueDateTime = new Date(dateStr + 'T23:59:59');
  }

  return dueDateTime > now;
}


/** Escape HTML to prevent XSS. */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Get initials from a name string. */
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

/** Get time-based greeting. */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return { text: 'Good Morning', emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  return { text: 'Good Evening', emoji: '🌙' };
}

/* ── Local Storage ─────────────────────────────────────────────────────── */

function saveTasks() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
  catch (e) { console.error('Failed to save tasks:', e); }
}

function loadTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    tasks = data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load tasks:', e);
    tasks = [];
  }
}

function saveUserName(name) {
  userName = name;
  localStorage.setItem(NAME_KEY, name);
}

function loadUserName() {
  userName = localStorage.getItem(NAME_KEY) || '';
  return userName;
}

/* ── Theme Management ──────────────────────────────────────────────────── */

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  document.documentElement.setAttribute('data-theme', saved || 'dark');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  showToast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 'info');
}

/* ── Name Bar (small floating prompt) ──────────────────────────────────── */

/** Open the name modal with a callback to run after name is entered. */
function openNameModal(callback) {
  pendingAction = callback;
  DOM.nameModalInput.value = '';
  DOM.nameModal.classList.add('active');
  setTimeout(() => DOM.nameModalInput.focus(), 300);
}

/** Close the name modal. */
function closeNameModal() {
  DOM.nameModal.classList.remove('active');
  pendingAction = null;
}

/** Handle name modal form submission. */
function handleNameModalSubmit(e) {
  e.preventDefault();
  const name = DOM.nameModalInput.value.trim();
  if (!name) { DOM.nameModalInput.focus(); return; }

  const action = pendingAction;
  saveUserName(name);
  updateUserUI(name);
  closeNameModal();
  showToast(`Welcome, ${name}! 🎉`, 'success');

  // Run the pending action
  pendingAction = null;
  if (action && typeof action === 'function') {
    action();
  }
}

/** Check if user's name is set, show name modal once on first load if not. */
function checkWelcome() {
  const name = loadUserName();
  updateUserUI(name);
  if (!name) {
    openNameModal();
  }
}

function getGreetingIconSVG(greetingText) {
  if (greetingText === 'Good Evening') {
    return '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>';
  }

  return '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>';
}

/** Update all UI elements that display the user's name. */
function updateUserUI(name) {
  const greeting = getGreeting();
  const greetingArea = document.getElementById('greeting-area');

  if (name) {
    userName = name;
    if (greetingArea) {
      greetingArea.style.display = 'flex';
      DOM.greetingText.innerHTML = `${greeting.text}, <span class="greeting-name">${escapeHTML(name)}</span>`;
      DOM.greetingEmoji.innerHTML = getGreetingIconSVG(greeting.text);
    }
    const initials = getInitials(name);
    DOM.profileInitials.textContent = initials;
    DOM.profileInitialsLg.textContent = initials;
    DOM.profileNameDisplay.textContent = name;
  } else {
    userName = '';
    if (greetingArea) {
      greetingArea.style.display = 'none';
      DOM.greetingText.textContent = '';
      DOM.greetingEmoji.innerHTML = '';
    }
    DOM.profileInitials.textContent = '?';
    DOM.profileInitialsLg.textContent = '?';
    DOM.profileNameDisplay.textContent = 'Guest';
  }
}

/** Allow user to change their name. */
function changeName() {
  closeProfileDropdown();
  openNameModal();
  DOM.nameModalInput.value = userName;
  DOM.nameModalInput.select();
}

/* ── Profile Dropdown ──────────────────────────────────────────────────── */

function toggleProfileDropdown() {
  const isOpen = DOM.profileDropdown.classList.contains('active');
  if (isOpen) closeProfileDropdown();
  else {
    DOM.profileDropdown.classList.add('active');
    DOM.profileBtn.setAttribute('aria-expanded', 'true');
  }
}

function closeProfileDropdown() {
  DOM.profileDropdown.classList.remove('active');
  DOM.profileBtn.setAttribute('aria-expanded', 'false');
}

/** Handle profile dropdown menu item clicks. */
function handleProfileAction(e) {
  const btn = e.target.closest('.profile-dropdown-item');
  if (!btn) return;

  const action = btn.dataset.action;
  closeProfileDropdown();

  switch (action) {
    case 'add-task':
      DOM.addTaskSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => DOM.titleInput.focus(), 400);
      break;
    case 'upcoming':
      setFilter('active');
      DOM.sortSelect.value = 'due-asc';
      currentSort = 'due-asc';
      renderAll();
      scrollToTaskList();
      break;
    case 'active':
      setFilter('active');
      renderAll();
      scrollToTaskList();
      break;
    case 'completed':
      setFilter('completed');
      renderAll();
      scrollToTaskList();
      break;
    case 'missed':
      setFilter('missed');
      renderAll();
      scrollToTaskList();
      break;
    case 'change-name':
      changeName();
      break;
    case 'reset-data':
      openResetModal();
      break;
  }
}

/** Set the active filter button. */
function setFilter(filter) {
  currentFilter = filter;
  DOM.filterGroup.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  const target = DOM.filterGroup.querySelector(`[data-filter="${filter}"]`);
  if (target) {
    target.classList.add('active');
    target.setAttribute('aria-selected', 'true');
  }
}

/** Scroll to the first visible task list section. */
function scrollToTaskList() {
  setTimeout(() => {
    const sections = [DOM.todaySection, DOM.activeSection, DOM.completedSection];
    for (const sec of sections) {
      if (!sec.hidden) {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }, 100);
}

/* ── Toast Notifications ───────────────────────────────────────────────── */

function showToast(message, type = 'success', duration = 3000) {
  const icons = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<div class="toast-icon">${icons[type]}</div><span>${escapeHTML(message)}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* ── Task CRUD Operations ──────────────────────────────────────────────── */

/** Add a new task from the form inputs. */
function addTask(e) {
  if (e) e.preventDefault();

  if (!userName) {
    openNameModal(() => {
      addTask();
    });
    return;
  }

  const title = DOM.titleInput.value.trim();
  if (!title) {
    showToast('Please enter a task title', 'warning');
    DOM.titleInput.focus();
    return;
  }

  const dateVal = DOM.dateInput.value;
  const timeVal = DOM.timeInput.value;

  if (!validateFutureDateTime(dateVal, timeVal)) {
    showToast('Please specify a future due date and time', 'warning');
    if (!dateVal) DOM.dateInput.focus();
    else DOM.timeInput.focus();
    return;
  }

  const task = {
    id:          generateId(),
    title:       title,
    description: DOM.descInput.value.trim(),
    dueDate:     dateVal,
    dueTime:     timeVal,
    priority:    DOM.priorityInput.value,
    completed:   false,
    createdAt:   Date.now(),
  };

  tasks.unshift(task);
  saveTasks();
  resetForm();
  renderAll();
  showToast('Task added successfully', 'success');
  DOM.titleInput.focus();
}

/** Reset the task form to defaults. */
function resetForm() {
  DOM.form.reset();
  DOM.priorityInput.value = 'medium';
  editingTaskId = null;
}

/**
 * Request completion toggle — shows confirmation modal.
 * @param {string} id - Task ID.
 */
function requestToggleComplete(id) {
  if (!userName) {
    openNameModal(() => {
      requestToggleComplete(id);
    });
    return;
  }

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  completeTargetId = id;

  if (task.completed) {
    // Unmark — also confirm
    DOM.completeModalTitle.textContent = 'Mark as Active?';
    DOM.completeModalMsg.textContent = 'This will move the task back to your active list.';
    DOM.completeConfirmBtn.textContent = 'Mark Active';
  } else {
    DOM.completeModalTitle.textContent = 'Mark as Completed?';
    DOM.completeModalMsg.textContent = `Are you sure you want to mark "${task.title}" as completed?`;
    DOM.completeConfirmBtn.textContent = 'Complete';
  }

  DOM.completeModal.classList.add('active');
}

/** Confirm the completion toggle. */
function confirmToggleComplete() {
  if (!completeTargetId) return;
  const task = tasks.find(t => t.id === completeTargetId);
  if (!task) return;

  task.completed = !task.completed;
  completeTargetId = null;
  saveTasks();
  closeCompleteModal();
  renderAll();
  showToast(task.completed ? 'Task completed! 🎉' : 'Task marked as active', 'success');
}

/** Close the complete confirmation modal. */
function closeCompleteModal() {
  DOM.completeModal.classList.remove('active');
  completeTargetId = null;
}

/** Initiate task deletion (delete immediately without modal confirmation). */
function requestDelete(id) {
  if (!userName) {
    openNameModal(() => {
      requestDelete(id);
    });
    return;
  }

  deleteTargetId = id;
  confirmDelete();
}

/** Confirm and execute task deletion. */
function confirmDelete() {
  if (!deleteTargetId) return;

  const card = document.querySelector(`[data-task-id="${deleteTargetId}"]`);
  if (card) {
    card.style.animation = `slideOut var(--duration-slow) var(--ease-out) forwards`;
    card.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== deleteTargetId);
      deleteTargetId = null;
      saveTasks();
      renderAll();
      showToast('Task deleted', 'error');
    });
  } else {
    tasks = tasks.filter(t => t.id !== deleteTargetId);
    deleteTargetId = null;
    saveTasks();
    renderAll();
    showToast('Task deleted', 'error');
  }
  closeDeleteModal();
}

/** Close delete modal. */
function closeDeleteModal() {
  DOM.deleteModal.classList.remove('active');
  deleteTargetId = null;
}

/** Enter edit mode for a task. */
function startEdit(id) {
  if (!userName) {
    openNameModal(() => {
      startEdit(id);
    });
    return;
  }

  editingTaskId = id;
  renderAll();
}

/** Save the edited task. */
function saveEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const titleInput = document.getElementById(`edit-title-${id}`);
  const descInput  = document.getElementById(`edit-desc-${id}`);
  const dateInput  = document.getElementById(`edit-date-${id}`);
  const timeInput  = document.getElementById(`edit-time-${id}`);
  const prioInput  = document.getElementById(`edit-priority-${id}`);

  const newTitle = titleInput.value.trim();
  if (!newTitle) {
    showToast('Task title cannot be empty', 'warning');
    titleInput.focus();
    return;
  }

  if (!validateFutureDateTime(dateInput.value, timeInput.value)) {
    showToast('Please specify a future due date and time', 'warning');
    if (!dateInput.value) dateInput.focus();
    else timeInput.focus();
    return;
  }

  task.title       = newTitle;
  task.description = descInput.value.trim();
  task.dueDate     = dateInput.value;
  task.dueTime     = timeInput.value;
  task.priority    = prioInput.value;

  editingTaskId = null;
  saveTasks();
  renderAll();
  showToast('Task updated successfully', 'success');
}

/** Cancel editing a task. */
function cancelEdit() {
  editingTaskId = null;
  renderAll();
}

/* ── Reset Data ────────────────────────────────────────────────────────── */

function openResetModal() {
  DOM.resetModal.classList.add('active');
}

function closeResetModal() {
  DOM.resetModal.classList.remove('active');
}

function confirmReset() {
  // Clear everything
  tasks = [];
  userName = '';
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NAME_KEY);

  closeResetModal();
  renderAll();

  // Reset UI greeting and profile info to nameless defaults
  updateUserUI('');

  showToast('All data has been reset', 'info');
}

/* ── Filtering, Sorting, Searching ─────────────────────────────────────── */

function getProcessedTasks() {
  let filtered = [...tasks];

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }

  // Status filter
  if (currentFilter === 'active') {
    filtered = filtered.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  } else if (currentFilter === 'missed') {
    filtered = filtered.filter(t => isOverdue(t));
  }

  // Sort
  filtered = sortTasks(filtered, currentSort);

  const activeTasks    = filtered.filter(t => !t.completed);
  const completedTasks = filtered.filter(t => t.completed);
  const todayTasks     = activeTasks.filter(t => isToday(t));

  return { activeTasks, completedTasks, todayTasks };
}

function sortTasks(list, sortBy) {
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  return list.sort((a, b) => {
    switch (sortBy) {
      case 'created-desc': return b.createdAt - a.createdAt;
      case 'created-asc':  return a.createdAt - b.createdAt;
      case 'due-asc': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return (a.dueDate + (a.dueTime || '23:59')).localeCompare(b.dueDate + (b.dueTime || '23:59'));
      }
      case 'due-desc': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return (b.dueDate + (b.dueTime || '23:59')).localeCompare(a.dueDate + (a.dueTime || '23:59'));
      }
      case 'alpha-asc':     return a.title.localeCompare(b.title);
      case 'alpha-desc':    return b.title.localeCompare(a.title);
      case 'priority-desc': return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      default: return 0;
    }
  });
}

/* ── Stat Card Click Handlers ──────────────────────────────────────────── */

function handleStatClick(e) {
  const card = e.currentTarget;
  const stat = card.dataset.stat;
  const value = parseInt(card.querySelector('.stat-value').textContent) || 0;

  // Do nothing if count is 0
  if (value === 0) return;

  switch (stat) {
    case 'total':     setFilter('all'); break;
    case 'active':    setFilter('active'); break;
    case 'completed': setFilter('completed'); break;
    case 'missed':    setFilter('missed'); break;
  }

  renderAll();
  scrollToTaskList();
}

/* ── Rendering ─────────────────────────────────────────────────────────── */

/** Create the HTML for a single task card. */
function createTaskCardHTML(task) {
  const overdue = isOverdue(task);
  const isEditing = editingTaskId === task.id;

  const classes = [
    'task-card',
    task.completed ? 'completed' : '',
    overdue ? 'overdue' : '',
    isEditing ? 'editing' : '',
  ].filter(Boolean).join(' ');

  // Build meta items
  let metaHTML = '';

  if (task.dueDate) {
    metaHTML += `<span class="task-meta-item">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      ${formatDate(task.dueDate)}</span>`;
  }

  if (task.dueTime) {
    metaHTML += `<span class="task-meta-item">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ${formatTime(task.dueTime)}</span>`;
  }

  if (overdue) {
    metaHTML += `<span class="overdue-badge">Missed</span>`;
  }

  metaHTML += `<span class="priority-badge priority-badge-${task.priority}">${task.priority}</span>`;

  metaHTML += `<span class="task-meta-item">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    Created ${formatTimestamp(task.createdAt)}</span>`;

  // Edit mode
  if (isEditing) {
    return `
      <div class="${classes}" data-task-id="${task.id}" data-priority="${task.priority}">
        <div class="edit-form">
          <input type="text" id="edit-title-${task.id}" class="input" value="${escapeHTML(task.title)}" maxlength="120" placeholder="Task title" />
          <input type="text" id="edit-desc-${task.id}" class="input" value="${escapeHTML(task.description || '')}" maxlength="300" placeholder="Description (optional)" />
          <div class="edit-form-row">
            <div class="input-group">
              <label class="input-label" for="edit-date-${task.id}">Due Date</label>
              <input type="date" id="edit-date-${task.id}" class="input input-sm" value="${task.dueDate || ''}" />
            </div>
            <div class="input-group">
              <label class="input-label" for="edit-time-${task.id}">Due Time</label>
              <input type="time" id="edit-time-${task.id}" class="input input-sm" value="${task.dueTime || ''}" />
            </div>
            <div class="input-group">
              <label class="input-label" for="edit-priority-${task.id}">Priority</label>
              <select id="edit-priority-${task.id}" class="input input-sm select">
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
              </select>
            </div>
          </div>
          <div class="edit-form-actions">
            <button type="button" class="btn btn-ghost btn-sm" onclick="cancelEdit()">Cancel</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="saveEdit('${task.id}')">Save</button>
          </div>
        </div>
      </div>`;
  }

  // Normal view — checkbox calls requestToggleComplete instead of direct toggle
  return `
    <div class="${classes}" data-task-id="${task.id}" data-priority="${task.priority}">
      <label class="task-checkbox">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="requestToggleComplete('${task.id}')" aria-label="Mark as ${task.completed ? 'active' : 'completed'}" />
        <span class="checkmark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
      </label>
      <div class="task-content">
        <div class="task-title">${escapeHTML(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHTML(task.description)}</div>` : ''}
        <div class="task-meta">${metaHTML}</div>
      </div>
      <div class="task-actions">
        ${!task.completed ? `
        <button class="task-action-btn edit-btn" onclick="startEdit('${task.id}')" title="Edit task" aria-label="Edit task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="task-action-btn delete-btn" onclick="requestDelete('${task.id}')" title="Delete task" aria-label="Delete task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
        ` : ''}
      </div>
    </div>`;
}

/** Render all tasks and update UI. */
function renderAll() {
  const { activeTasks, completedTasks, todayTasks } = getProcessedTasks();
  const activeTitle = DOM.activeSection.querySelector('.section-header h2');
  if (activeTitle) {
    activeTitle.innerHTML = currentFilter === 'missed'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Missed Tasks'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Active Tasks';
  }

  // Update Stats (always from full task list)
  const totalCount   = tasks.length;
  const activeCount  = tasks.filter(t => !t.completed).length;
  const doneCount    = tasks.filter(t => t.completed).length;
  const missedCount  = tasks.filter(t => isOverdue(t)).length;

  animateCounter(DOM.statTotalValue, totalCount);
  animateCounter(DOM.statActiveValue, activeCount);
  animateCounter(DOM.statCompletedValue, doneCount);
  animateCounter(DOM.statMissedValue, missedCount);

  // Disabled state for stat cards
  DOM.statTotal.classList.toggle('stat-disabled', totalCount === 0);
  DOM.statActive.classList.toggle('stat-disabled', activeCount === 0);
  DOM.statCompleted.classList.toggle('stat-disabled', doneCount === 0);
  DOM.statMissed.classList.toggle('stat-disabled', missedCount === 0);

  // Today's Tasks
  const todayActive = todayTasks.filter(t => !t.completed);
  if (todayActive.length > 0 && currentFilter !== 'completed' && currentFilter !== 'missed') {
    DOM.todaySection.hidden = false;
    DOM.todayTaskList.innerHTML = todayActive.map(createTaskCardHTML).join('');
    DOM.todayCount.textContent = todayActive.length;
  } else {
    DOM.todaySection.hidden = true;
    DOM.todayTaskList.innerHTML = '';
  }

  // Active Tasks (exclude today's to avoid duplication)
  const todayIds = new Set(todayActive.map(t => t.id));
  const remainingActive = activeTasks.filter(t => !todayIds.has(t.id));

  if (currentFilter !== 'completed') {
    DOM.activeSection.hidden = false;
    DOM.activeTaskList.innerHTML = remainingActive.map(createTaskCardHTML).join('');
    DOM.activeCount.textContent = activeTasks.length;
  } else {
    DOM.activeSection.hidden = true;
  }

  // Completed Tasks
  if (currentFilter !== 'active' && currentFilter !== 'missed') {
    DOM.completedSection.hidden = false;
    DOM.completedTaskList.innerHTML = completedTasks.map(createTaskCardHTML).join('');
    DOM.completedCount.textContent = completedTasks.length;
  } else {
    DOM.completedSection.hidden = true;
  }

  // Empty State
  const visibleTasks = activeTasks.length + completedTasks.length;
  if (visibleTasks === 0) {
    DOM.emptyState.hidden = currentFilter === 'active';
    if (searchQuery) {
      DOM.emptyTitle.textContent = 'No matching tasks';
      DOM.emptySubtitle.textContent = 'Try a different search term.';
    } else if (currentFilter === 'active') {
      DOM.emptyTitle.textContent = 'No active tasks';
      DOM.emptySubtitle.textContent = 'All tasks are completed. Great job! 🎉';
    } else if (currentFilter === 'completed') {
      DOM.emptyTitle.textContent = 'No completed tasks';
      DOM.emptySubtitle.textContent = 'Complete a task to see it here.';
    } else if (currentFilter === 'missed') {
      DOM.emptyTitle.textContent = 'No missed tasks';
      DOM.emptySubtitle.textContent = 'You\'re on track! No missed tasks.';
    } else {
      DOM.emptyTitle.textContent = 'No tasks yet';
      DOM.emptySubtitle.textContent = 'Add your first task above to get started!';
    }
  } else {
    DOM.emptyState.hidden = true;
  }
}

/** Animate a counter from its current value to a new value. */
function animateCounter(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const duration = 300;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(current + (target - current) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ── Export (JSON / CSV) ───────────────────────────────────────────────── */

/** Open the export format chooser modal. */
function openExportModal() {
  if (tasks.length === 0) {
    showToast('No tasks to export', 'warning');
    return;
  }
  DOM.exportModal.classList.add('active');
}

function closeExportModal() {
  DOM.exportModal.classList.remove('active');
}

/** Export tasks as JSON file. */
function exportAsJSON() {
  closeExportModal();
  const data = JSON.stringify(tasks, null, 2);
  downloadFile(data, `taskflow_export_${dateStamp()}.json`, 'application/json');
  showToast(`Exported ${tasks.length} task(s) as JSON`, 'success');
}

/** Export tasks as CSV file. */
function exportAsCSV() {
  closeExportModal();

  // CSV header
  const headers = ['Title', 'Description', 'Due Date', 'Due Time', 'Priority', 'Status', 'Created At'];
  const rows = tasks.map(t => [
    csvEscape(t.title),
    csvEscape(t.description || ''),
    t.dueDate || '',
    t.dueTime ? formatTime(t.dueTime) : '',
    t.priority,
    t.completed ? 'Completed' : (isOverdue(t) ? 'Missed' : 'Active'),
    new Date(t.createdAt).toLocaleString(),
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `taskflow_export_${dateStamp()}.csv`, 'text/csv');
  showToast(`Exported ${tasks.length} task(s) as CSV`, 'success');
}

/** Escape a value for CSV (wrap in quotes if needed). */
function csvEscape(val) {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

/** Get current date stamp for file names. */
function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

/** Trigger a file download in the browser. */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Import ────────────────────────────────────────────────────────────── */

function openImportModal() {
  DOM.importTextarea.value = '';
  DOM.importFileName.textContent = 'No file chosen';
  DOM.importFileInput.value = '';
  DOM.importModal.classList.add('active');
}

function closeImportModal() {
  DOM.importModal.classList.remove('active');
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  DOM.importFileName.textContent = file.name;
  const reader = new FileReader();
  reader.onload = (ev) => { DOM.importTextarea.value = ev.target.result; };
  reader.readAsText(file);
}

function confirmImport() {
  if (!userName) {
    openNameModal(() => {
      confirmImport();
    });
    return;
  }

  const raw = DOM.importTextarea.value.trim();
  if (!raw) {
    showToast('Please paste JSON data or select a file', 'warning');
    return;
  }

  try {
    const imported = JSON.parse(raw);
    if (!Array.isArray(imported)) throw new Error('Data must be an array');

    let count = 0;
    imported.forEach(item => {
      if (!item.title || typeof item.title !== 'string') return;
      tasks.push({
        id:          generateId(),
        title:       item.title.trim().substring(0, 120),
        description: (item.description || '').trim().substring(0, 300),
        dueDate:     item.dueDate || '',
        dueTime:     item.dueTime || '',
        priority:    ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
        completed:   Boolean(item.completed),
        createdAt:   item.createdAt || Date.now(),
      });
      count++;
    });

    saveTasks();
    renderAll();
    closeImportModal();
    showToast(`Imported ${count} task(s) successfully`, 'success');
  } catch (err) {
    showToast('Invalid JSON format: ' + err.message, 'error');
  }
}

/* ── Event Listeners ───────────────────────────────────────────────────── */

function initEventListeners() {
  // Name modal
  DOM.nameModalForm.addEventListener('submit', handleNameModalSubmit);
  DOM.nameModal.addEventListener('click', (e) => { if (e.target === DOM.nameModal) closeNameModal(); });
  DOM.greetingArea.addEventListener('click', () => {
    if (!userName) openNameModal();
  });

  // Form submit
  DOM.form.addEventListener('submit', addTask);
  DOM.titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); DOM.form.requestSubmit(); }
  });

  // Theme toggle
  DOM.themeToggle.addEventListener('click', toggleTheme);

  // Profile
  DOM.profileBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleProfileDropdown(); });
  DOM.profileDropdown.addEventListener('click', handleProfileAction);
  document.addEventListener('click', (e) => {
    if (!DOM.profileWrapper.contains(e.target)) closeProfileDropdown();
  });

  // Search
  DOM.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    DOM.searchClearBtn.hidden = !searchQuery;
    renderAll();
  });

  DOM.searchClearBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    searchQuery = '';
    DOM.searchClearBtn.hidden = true;
    renderAll();
    DOM.searchInput.focus();
  });

  // Filter buttons
  DOM.filterGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    setFilter(btn.dataset.filter);
    renderAll();
  });

  // Sort
  DOM.sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderAll();
  });

  // Stat card clicks
  [DOM.statTotal, DOM.statActive, DOM.statCompleted, DOM.statMissed].forEach(card => {
    card.addEventListener('click', handleStatClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStatClick(e); }
    });
  });

  // Delete modal
  DOM.modalCancelBtn.addEventListener('click', closeDeleteModal);
  DOM.modalConfirmBtn.addEventListener('click', confirmDelete);
  DOM.deleteModal.addEventListener('click', (e) => { if (e.target === DOM.deleteModal) closeDeleteModal(); });

  // Complete modal
  DOM.completeCancelBtn.addEventListener('click', closeCompleteModal);
  DOM.completeConfirmBtn.addEventListener('click', confirmToggleComplete);
  DOM.completeModal.addEventListener('click', (e) => { if (e.target === DOM.completeModal) closeCompleteModal(); });

  // Reset modal
  DOM.resetCancelBtn.addEventListener('click', closeResetModal);
  DOM.resetConfirmBtn.addEventListener('click', confirmReset);
  DOM.resetModal.addEventListener('click', (e) => { if (e.target === DOM.resetModal) closeResetModal(); });

  // Export modal
  DOM.exportBtn.addEventListener('click', openExportModal);
  DOM.exportJsonBtn.addEventListener('click', exportAsJSON);
  DOM.exportCsvBtn.addEventListener('click', exportAsCSV);
  DOM.exportCancelBtn.addEventListener('click', closeExportModal);
  DOM.exportModal.addEventListener('click', (e) => { if (e.target === DOM.exportModal) closeExportModal(); });

  // Import modal
  DOM.importBtn.addEventListener('click', openImportModal);
  DOM.importCancelBtn.addEventListener('click', closeImportModal);
  DOM.importConfirmBtn.addEventListener('click', confirmImport);
  DOM.importFileInput.addEventListener('change', handleImportFile);
  DOM.importModal.addEventListener('click', (e) => { if (e.target === DOM.importModal) closeImportModal(); });

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.deleteModal.classList.contains('active')) closeDeleteModal();
      else if (DOM.completeModal.classList.contains('active')) closeCompleteModal();
      else if (DOM.resetModal.classList.contains('active')) closeResetModal();
      else if (DOM.exportModal.classList.contains('active')) closeExportModal();
      else if (DOM.importModal.classList.contains('active')) closeImportModal();
      else if (DOM.nameModal.classList.contains('active')) closeNameModal();
      else if (DOM.profileDropdown.classList.contains('active')) closeProfileDropdown();
      else if (editingTaskId) cancelEdit();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      DOM.searchInput.focus();
    }
  });

  // Enter in edit mode title
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && editingTaskId) {
      const el = document.activeElement;
      if (el && el.id && el.id.startsWith('edit-title-')) {
        e.preventDefault();
        saveEdit(editingTaskId);
      }
    }
  });
}

/* ── Greeting Update Interval ──────────────────────────────────────────── */

function startGreetingUpdater() {
  setInterval(() => {
    updateUserUI(userName);
  }, 60000);
}

/* ── Initialization ────────────────────────────────────────────────────── */

function init() {
  DOM.footerYear.textContent = new Date().getFullYear();
  loadTheme();
  loadTasks();
  checkWelcome();
  initEventListeners();
  startGreetingUpdater();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
