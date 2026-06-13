# TaskFlow — Modern To-Do Web Application

TaskFlow is a premium, modern, high-performance To-Do application built using vanilla web technologies. It features a stunning high-contrast **Black + Yellow** (Lamborghini/NVIDIA-inspired) design aesthetic, fluid micro-animations, and a responsive SaaS-like container layout.

---

## ✨ Features

- **Premium Lamborghini/NVIDIA Theme:** Sleek dark mode (`#0A0A0A` deep charcoal and `#FFD60A` yellow highlights) paired with a high-contrast light mode featuring solid black borders (`#000000`).
- **Centered SaaS Layout:** Proportional container width (`width: 75%; max-width: 1200px`) modeled after modern SaaS tools like Notion, Linear, and Todoist, providing balanced side margins.
- **Advanced Task Management:**
  - Dynamic statistics tracking (Total, Active, Completed, Missed tasks).
  - Immediate task deletion (no confirmation dialogs) with smooth slide-out animations.
  - Action buttons (Edit & Delete) automatically hide on completed tasks to preserve focus (reactivate the task to show options again).
- **Future-Only Date & Time Validation:** Due dates and times are optional, but if specified, are validated to ensure they represent future moments, displaying helper toasts for past inputs.
- **One-Time Name Modal:** Greets users on their first visit. If dismissed, it hides the greeting area without re-prompting timers, keeping the branding logo (`✓ TaskFlow`) visible.
- **Export & Import Tools:**
  - Export tasks directly as spreadsheet-ready **CSV** files or raw **JSON** backups.
  - Import task lists from local JSON files.
- **Static Developer Credits:** The footer statically attributes development to **Pavan Reddy**.
- **Interactive Search and Filters:** Find tasks in real time by title/description, filter them (`All`, `Active`, `Completed`, `Missed`), and sort them (due date, created date, priority, alphabetical).

---

## 🛠️ Technology Stack

- **Structure:** Semantic HTML5 Markup
- **Styling:** Custom Vanilla CSS3 (using CSS variables, CSS flexbox/grid layouts, keyframe animations, and custom media queries)
- **Logic:** Vanilla ES6+ JavaScript (compiled directly in-browser, referencing local storage for persistent data storage)

---

## 🚀 Getting Started

No installation, compilation, or web servers are required!

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/TO-DO_app.git
   ```
2. Open `index.html` directly in any modern web browser (Chrome, Firefox, Edge, Safari, Brave, etc.) to start using TaskFlow.

---

## 📂 Project Structure

- `index.html` — Application structure, modals, header logo/greeting layout, stats-bar, add-task form, toolbar, lists, and footer.
- `style.css` — Global CSS custom properties (design tokens), Lamborghini dark theme, high-contrast light theme, layout structures, component elements, responsive grid setups, animations, and typography.
- `script.js` — Core application logic including task CRUD processes, date/time validation checks, name modal workflows, export-to-CSV/JSON helpers, animation state management, local storage handling, and event listeners.

---

*Developed with ♥ by Pavan Reddy.*
