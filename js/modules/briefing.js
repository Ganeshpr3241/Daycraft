/**
 * DAYCRAFT — MODULE: BRIEFING, CLOCK, & DAILY GOAL SETTING KICKOFF POPUP
 * - Auto-prompts daily goal popup on app launch if not set for today
 * - Persists goals in phone localStorage with goalHistory for past used goals
 * - Shows dropdown of past goals the user has used before for quick re-use
 */

class BriefingModule {
  constructor() {
    this.clockEl = document.getElementById('liveClock');
    this.dateEl = document.getElementById('liveDate');
    this.greetingText = document.getElementById('greetingText');
    this.greetingIcon = document.getElementById('greetingIcon');
    this.dayQuote = document.getElementById('dayQuote');
    
    // Priority Spotlight elements
    this.priorityDisplay = document.getElementById('priorityDisplay');
    this.priorityText = document.getElementById('priorityText');
    this.priorityInputContainer = document.getElementById('priorityInputContainer');
    this.priorityInput = document.getElementById('priorityInput');
    this.editPriorityBtn = document.getElementById('editPriorityBtn');
    this.savePriorityBtn = document.getElementById('savePriorityBtn');
    this.zenTaskSpotlight = document.getElementById('zenTaskSpotlight');

    // Daily Goal Kickoff Modal Elements
    this.dailyGoalKickoffModal = document.getElementById('dailyGoalKickoffModal');
    this.dailyGoalKickoffForm = document.getElementById('dailyGoalKickoffForm');
    this.kickoffPriorityInput = document.getElementById('kickoffPriorityInput');
    this.kickoffWaterGoalInput = document.getElementById('kickoffWaterGoalInput');
    this.kickoffFocusTargetInput = document.getElementById('kickoffFocusTargetInput');
    this.closeDailyGoalModal = document.getElementById('closeDailyGoalModal');
    this.headerSetGoalsBtn = document.getElementById('headerSetGoalsBtn');
    this.goalChips = document.querySelectorAll('.goal-chip');
    this.pastGoalsSection = document.getElementById('pastGoalsSection');
    this.pastGoalsList = document.getElementById('pastGoalsList');

    this.quotes = [
      "Make today count with intention and deliberate focus.",
      "The secret of getting ahead is getting started.",
      "Focus is a muscle. Train it in uninterrupted intervals.",
      "Small daily disciplines compound into massive breakthroughs.",
      "Clarity comes from action, not from overthinking.",
      "Master the morning, win the day.",
      "One high-impact task completed beats ten minor distractions.",
      "Energy flows where attention goes."
    ];

    this.init();
  }

  init() {
    this.updateClock();
    setInterval(() => this.updateClock(), 15000);
    this.setupQuote();
    this.setupPriorityHandlers();
    this.setupKickoffModal();

    // Subscribe to store updates
    window.store.subscribe((state) => {
      this.renderPriority(state.priority);
    });

    // Check on startup if daily goals need to be set
    setTimeout(() => {
      this.checkAndPromptDailyKickoff();
    }, 350);
  }

  updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    if (this.clockEl) {
      this.clockEl.textContent = `${displayHours}:${minutes} ${ampm}`;
    }

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    if (this.dateEl) {
      this.dateEl.textContent = now.toLocaleDateString(undefined, options);
    }

    if (this.greetingText && this.greetingIcon) {
      if (hours >= 5 && hours < 12) {
        this.greetingText.textContent = "Good Morning";
        this.greetingIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"></path></svg>`;
      } else if (hours >= 12 && hours < 17) {
        this.greetingText.textContent = "Good Afternoon";
        this.greetingIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1zm0 18a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1zm8.48-12.48a1 1 0 0 0-1.41 0l-1.42 1.42a1 1 0 0 0 1.41 1.41l1.42-1.42a1 1 0 0 0 0-1.41zM5.34 17.25a1 1 0 0 0-1.41 0l-1.42 1.42a1 1 0 0 0 1.41 1.41l1.42-1.42a1 1 0 0 0 0-1.41zM2 12a1 1 0 0 0 1 1h2a1 1 0 0 0 0-2H3a1 1 0 0 0-1 1zm18 0a1 1 0 0 0 1 1h2a1 1 0 0 0 0-2h-2a1 1 0 0 0-1 1z"></path></svg>`;
      } else if (hours >= 17 && hours < 21) {
        this.greetingText.textContent = "Good Evening";
        this.greetingIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.005 6.5A5.5 5.5 0 0 0 6.53 11.5H3a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2h-3.525A5.5 5.5 0 0 0 12.005 6.5zM2 17h20v2H2zM4 21h16v2H4z"></path></svg>`;
      } else {
        this.greetingText.textContent = "Good Night";
        this.greetingIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.3 2a10 10 0 0 0-.19 20 10 10 0 0 0 8.35-4.5 1 1 0 0 0-.85-1.5h-.5A7.5 7.5 0 0 1 11.6 8.5c0-2.32 1.05-4.4 2.7-5.8a1 1 0 0 0-.7-1.7h-.3z"></path></svg>`;
      }
    }
  }

  setupQuote() {
    if (!this.dayQuote) return;
    const dayOfMonth = new Date().getDate();
    const quote = this.quotes[dayOfMonth % this.quotes.length];
    this.dayQuote.textContent = quote;

    this.dayQuote.addEventListener('click', () => {
      const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
      this.dayQuote.textContent = randomQuote;
      window.audioEngine.playChime('success');
    });
  }

  // ========== PAST GOALS HISTORY ==========

  getGoalHistory() {
    const state = window.store.getState();
    return Array.isArray(state.goalHistory) ? state.goalHistory : [];
  }

  addGoalToHistory(goalText) {
    if (!goalText || !goalText.trim()) return;
    const text = goalText.trim();

    window.store.update(state => {
      if (!Array.isArray(state.goalHistory)) state.goalHistory = [];
      // Remove duplicate if exists (case-insensitive)
      state.goalHistory = state.goalHistory.filter(g => g.text.toLowerCase() !== text.toLowerCase());
      // Add to front (most recent first), keep max 12
      state.goalHistory.unshift({
        text: text,
        lastUsed: new Date().toISOString(),
        usedCount: (state.goalHistory.find(g => g.text.toLowerCase() === text.toLowerCase())?.usedCount || 0) + 1
      });
      if (state.goalHistory.length > 12) state.goalHistory = state.goalHistory.slice(0, 12);
    });
  }

  renderPastGoals() {
    if (!this.pastGoalsList || !this.pastGoalsSection) return;
    const history = this.getGoalHistory();

    if (history.length === 0) {
      this.pastGoalsSection.classList.add('hidden');
      return;
    }

    this.pastGoalsSection.classList.remove('hidden');
    this.pastGoalsList.innerHTML = '';

    history.forEach((item, idx) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'past-goal-pill';
      pill.setAttribute('data-goal-idx', idx);

      // Format last used date nicely
      let dateLabel = '';
      if (item.lastUsed) {
        const d = new Date(item.lastUsed);
        dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }

      pill.innerHTML = `
        <span class="past-goal-text">${this.escapeHTML(item.text)}</span>
        ${dateLabel ? `<span class="past-goal-date">${dateLabel}</span>` : ''}
        <span class="past-goal-remove" data-remove-idx="${idx}" title="Remove from history">&times;</span>
      `;

      // Click to use this goal
      pill.addEventListener('click', (e) => {
        if (e.target.classList.contains('past-goal-remove')) return;
        if (this.kickoffPriorityInput) {
          this.kickoffPriorityInput.value = item.text;
          this.kickoffPriorityInput.focus();
        }
      });

      this.pastGoalsList.appendChild(pill);
    });

    // Remove button handlers
    this.pastGoalsList.querySelectorAll('.past-goal-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.removeIdx, 10);
        window.store.update(state => {
          if (Array.isArray(state.goalHistory)) {
            state.goalHistory.splice(idx, 1);
          }
        });
        this.renderPastGoals();
      });
    });
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========== KICKOFF MODAL ==========

  checkAndPromptDailyKickoff() {
    const state = window.store.getState();
    const today = window.store.getTodayString();

    const priority = state.priority;
    const hasGoalSetToday = priority && priority.setForDate === today && priority.text && priority.text.trim().length > 0;

    if (!hasGoalSetToday && this.dailyGoalKickoffModal) {
      this.openKickoffModal();
    }
  }

  openKickoffModal() {
    if (!this.dailyGoalKickoffModal) return;
    const state = window.store.getState();

    if (this.kickoffPriorityInput) {
      this.kickoffPriorityInput.value = state.priority?.text || '';
    }
    if (this.kickoffWaterGoalInput) {
      this.kickoffWaterGoalInput.value = state.water?.goal || 2500;
    }
    if (this.kickoffFocusTargetInput) {
      this.kickoffFocusTargetInput.value = state.focus?.targetSessions || 4;
    }

    // Render past goals dropdown
    this.renderPastGoals();

    this.dailyGoalKickoffModal.classList.remove('hidden');
    if (this.kickoffPriorityInput) this.kickoffPriorityInput.focus();
  }

  closeKickoffModal() {
    if (this.dailyGoalKickoffModal) {
      this.dailyGoalKickoffModal.classList.add('hidden');
    }
  }

  setupKickoffModal() {
    if (this.closeDailyGoalModal) {
      this.closeDailyGoalModal.addEventListener('click', () => this.closeKickoffModal());
    }

    // Header Goals button opens kickoff modal anytime
    if (this.headerSetGoalsBtn) {
      this.headerSetGoalsBtn.addEventListener('click', () => this.openKickoffModal());
    }

    // Goal suggestion chips
    this.goalChips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (this.kickoffPriorityInput) {
          this.kickoffPriorityInput.value = chip.textContent.trim();
          this.kickoffPriorityInput.focus();
        }
      });
    });

    // Form submit
    if (this.dailyGoalKickoffForm) {
      this.dailyGoalKickoffForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const goalText = (this.kickoffPriorityInput && this.kickoffPriorityInput.value.trim()) || '';
        const waterGoal = parseInt(this.kickoffWaterGoalInput.value, 10) || 2500;
        const focusTarget = parseInt(this.kickoffFocusTargetInput.value, 10) || 4;

        if (goalText) {
          const today = window.store.getTodayString();

          // Save goal to history for future re-use
          this.addGoalToHistory(goalText);

          window.store.update(state => {
            state.priority = {
              text: goalText,
              completed: false,
              setForDate: today
            };
            state.water.goal = waterGoal;
            state.focus.targetSessions = focusTarget;
          });

          window.audioEngine.playChime('success');
          window.confetti.fire(window.innerWidth / 2, window.innerHeight / 2, 70);
          this.closeKickoffModal();
        }
      });
    }
  }

  setupPriorityHandlers() {
    if (this.editPriorityBtn) {
      this.editPriorityBtn.addEventListener('click', () => this.openKickoffModal());
    }

    if (this.priorityDisplay) {
      this.priorityDisplay.addEventListener('click', () => this.openKickoffModal());
    }

    if (this.savePriorityBtn) {
      this.savePriorityBtn.addEventListener('click', () => this.saveInlinePriority());
    }

    if (this.priorityInput) {
      this.priorityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.saveInlinePriority();
        if (e.key === 'Escape') this.hidePriorityInput();
      });
    }
  }

  showPriorityInput() {
    if (!this.priorityInputContainer || !this.priorityDisplay) return;
    this.priorityDisplay.classList.add('hidden');
    this.priorityInputContainer.classList.remove('hidden');
    if (this.priorityInput) {
      const current = window.store.getState().priority.text;
      this.priorityInput.value = current || '';
      this.priorityInput.focus();
    }
  }

  hidePriorityInput() {
    if (!this.priorityInputContainer || !this.priorityDisplay) return;
    this.priorityInputContainer.classList.add('hidden');
    this.priorityDisplay.classList.remove('hidden');
  }

  saveInlinePriority() {
    if (!this.priorityInput) return;
    const text = this.priorityInput.value.trim();
    if (text) {
      const today = window.store.getTodayString();
      this.addGoalToHistory(text);
      window.store.update(state => {
        state.priority = {
          text: text,
          completed: false,
          setForDate: today
        };
      });
      window.audioEngine.playChime('success');
      window.confetti.fire();
    }
    this.hidePriorityInput();
  }

  renderPriority(priority) {
    if (!priority) return;
    const text = typeof priority === 'string' ? priority : (priority.text || '');
    const completed = typeof priority === 'object' ? !!priority.completed : false;
    const display = text ? `"${text}"` : "Set your single most important goal for today...";
    
    if (this.priorityText) {
      this.priorityText.textContent = display;
      this.priorityText.classList.toggle('priority-completed', completed);
      
      const badge = document.querySelector('.priority-label .priority-badge-wrap');
      if (badge && text) {
        if (completed) {
          badge.innerHTML = `<span class="badge badge-success"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg><span>PRIORITY COMPLETED</span></span>`;
        } else {
          badge.innerHTML = `<span class="badge badge-primary"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"></path></svg><span>MAIN FOCUS TODAY</span></span>`;
        }
      }
    }
    if (this.zenTaskSpotlight) {
      this.zenTaskSpotlight.textContent = display;
      this.zenTaskSpotlight.classList.toggle('priority-completed', completed);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.briefingModule = new BriefingModule();
});
