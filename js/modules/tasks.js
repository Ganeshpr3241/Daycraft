/**
 * DAYCRAFT — MODULE: DAILY TASK FLOW
 */

class TasksModule {
  constructor() {
    this.taskList = document.getElementById('taskList');
    this.addTaskForm = document.getElementById('addTaskForm');
    this.taskInputText = document.getElementById('taskInputText');
    this.taskPrioritySelect = document.getElementById('taskPrioritySelect');
    this.taskCategorySelect = document.getElementById('taskCategorySelect');
    this.taskEstimateInput = document.getElementById('taskEstimateInput');
    this.taskProgressBar = document.getElementById('taskProgressBar');
    this.taskCountCompleted = document.getElementById('taskCountCompleted');
    this.taskCountTotal = document.getElementById('taskCountTotal');
    this.taskPercentText = document.getElementById('taskPercentText');
    this.taskEmptyState = document.getElementById('taskEmptyState');
    this.filterChips = document.querySelectorAll('.filter-chip');

    this.currentFilter = 'all';

    this.init();
  }

  init() {
    this.setupForm();
    this.setupFilters();

    window.store.subscribe((state) => {
      this.renderTasks(state.tasks);
    });
  }

  setupForm() {
    if (!this.addTaskForm) return;

    this.addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.taskInputText.value.trim();
      if (!text) return;

      const priority = this.taskPrioritySelect.value;
      const category = this.taskCategorySelect.value;
      const estimate = this.taskEstimateInput.value.trim() || "";

      const newTask = {
        id: `t_${Date.now()}`,
        text,
        priority,
        category,
        estimate,
        completed: false,
        createdAt: Date.now()
      };

      window.store.update(state => {
        state.tasks.unshift(newTask);
      });

      this.taskInputText.value = "";
      this.taskEstimateInput.value = "";
      window.audioEngine.playChime('success');
    });
  }

  setupFilters() {
    this.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.dataset.filter;
        this.renderTasks(window.store.getState().tasks);
      });
    });
  }

  toggleTask(taskId) {
    let wasCompleted = false;
    window.store.update(state => {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        wasCompleted = task.completed;
      }
    });

    if (wasCompleted) {
      window.audioEngine.playChime('task');
      window.confetti.fire(window.innerWidth / 2, window.innerHeight / 2, 40);
    }
  }

  deleteTask(taskId) {
    window.store.update(state => {
      state.tasks = state.tasks.filter(t => t.id !== taskId);
    });
  }

  renderTasks(tasks = []) {
    if (!this.taskList) return;

    // Filter tasks
    const filtered = tasks.filter(t => {
      if (this.currentFilter === 'pending') return !t.completed;
      if (this.currentFilter === 'completed') return t.completed;
      if (this.currentFilter === 'high') return t.priority === 'high';
      if (this.currentFilter === 'work') return t.category === 'work';
      if (this.currentFilter === 'personal') return t.category === 'personal';
      return true; // 'all'
    });

    // Update Progress Stats
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (this.taskCountTotal) this.taskCountTotal.textContent = total;
    if (this.taskCountCompleted) this.taskCountCompleted.textContent = completed;
    if (this.taskPercentText) this.taskPercentText.textContent = `${percent}%`;
    if (this.taskProgressBar) this.taskProgressBar.style.width = `${percent}%`;

    // Empty state
    if (filtered.length === 0) {
      this.taskList.innerHTML = "";
      if (this.taskEmptyState) this.taskEmptyState.classList.remove('hidden');
      return;
    }

    if (this.taskEmptyState) this.taskEmptyState.classList.add('hidden');

    this.taskList.innerHTML = filtered.map(t => `
      <li class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div class="task-checkbox" title="Mark done">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="task-body">
          <span class="task-text">${this.escapeHTML(t.text)}</span>
          <div class="task-meta">
            <span class="task-tag tag-${t.priority}">${t.priority}</span>
            <span class="task-tag tag-cat">${t.category}</span>
            ${t.estimate ? `<span class="task-estimate">⏱️ ${this.escapeHTML(t.estimate)}</span>` : ''}
          </div>
        </div>
        <button class="task-delete-btn" title="Delete task">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </li>
    `).join('');

    // Attach Event Listeners
    this.taskList.querySelectorAll('.task-item').forEach(itemEl => {
      const taskId = itemEl.dataset.id;
      
      itemEl.querySelector('.task-checkbox').addEventListener('click', () => {
        this.toggleTask(taskId);
      });

      itemEl.querySelector('.task-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTask(taskId);
      });
    });
  }

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}

window.tasksModule = new TasksModule();
