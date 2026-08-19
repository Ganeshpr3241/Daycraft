/**
 * DAYCRAFT — MODULE: HABITS, EVENING REFLECTION & WEEKLY PULSE
 */

class ReflectionModule {
  constructor() {
    // Habit elements
    this.habitList = document.getElementById('habitList');
    this.addHabitModalTrigger = document.getElementById('addHabitModalTrigger');
    this.habitModal = document.getElementById('habitModal');
    this.closeHabitModal = document.getElementById('closeHabitModal');
    this.addHabitForm = document.getElementById('addHabitForm');
    this.newHabitName = document.getElementById('newHabitName');
    this.newHabitEmoji = document.getElementById('newHabitEmoji');
    this.newHabitCategory = document.getElementById('newHabitCategory');

    // Reflection elements
    this.starsContainer = document.getElementById('dayRatingStars');
    this.reflWinInput = document.getElementById('reflWinInput');
    this.reflGratefulInput = document.getElementById('reflGratefulInput');
    this.reflImproveInput = document.getElementById('reflImproveInput');
    this.saveReflectionBtn = document.getElementById('saveReflectionBtn');
    this.reflectionDateBadge = document.getElementById('reflectionDateBadge');

    // Weekly Pulse elements
    this.weeklyPulseBars = document.getElementById('weeklyPulseBars');
    this.overallStreakBadge = document.getElementById('overallStreakBadge');

    this.selectedRating = 5;

    this.init();
  }

  init() {
    this.setupHabits();
    this.setupReflection();
    this.setupWeeklyPulse();

    window.store.subscribe((state) => {
      this.renderHabits(state.habits);
      this.renderReflection(state.reflection);
      this.renderWeeklyPulse(state.weeklyPulse);
    });
  }

  // --- HABITS ---
  setupHabits() {
    if (this.addHabitModalTrigger) {
      this.addHabitModalTrigger.addEventListener('click', () => {
        if (this.habitModal) this.habitModal.classList.remove('hidden');
      });
    }

    if (this.closeHabitModal) {
      this.closeHabitModal.addEventListener('click', () => {
        if (this.habitModal) this.habitModal.classList.add('hidden');
      });
    }

    if (this.addHabitForm) {
      this.addHabitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = this.newHabitName.value.trim();
        const emoji = this.newHabitEmoji.value.trim() || "⚡";
        const category = this.newHabitCategory.value;

        if (!name) return;

        const newHabit = {
          id: `h_${Date.now()}`,
          name,
          emoji,
          category,
          streak: 1,
          completedToday: false,
          lastCompleted: ""
        };

        window.store.update(state => {
          if (!state.habits) state.habits = [];
          state.habits.push(newHabit);
        });

        this.newHabitName.value = "";
        if (this.habitModal) this.habitModal.classList.add('hidden');
        window.audioEngine.playChime('success');
      });
    }
  }

  toggleHabit(habitId) {
    let nowDone = false;
    window.store.update(state => {
      const habit = state.habits.find(h => h.id === habitId);
      if (habit) {
        habit.completedToday = !habit.completedToday;
        nowDone = habit.completedToday;
        if (nowDone) {
          habit.streak = (habit.streak || 0) + 1;
          habit.lastCompleted = window.store.getTodayString();
        } else {
          habit.streak = Math.max(0, (habit.streak || 1) - 1);
        }
      }
    });

    if (nowDone) {
      window.audioEngine.playChime('task');
      window.confetti.fire(window.innerWidth / 2, window.innerHeight / 2, 40);
    }
  }

  renderHabits(habits = []) {
    if (!this.habitList) return;

    this.habitList.innerHTML = habits.map(h => `
      <div class="habit-item ${h.completedToday ? 'done' : ''}" data-id="${h.id}">
        <div class="habit-left">
          <span class="habit-emoji">${h.emoji || '⚡'}</span>
          <span class="habit-name">${this.escapeHTML(h.name)}</span>
        </div>
        <div class="habit-right">
          <span class="habit-streak">🔥 ${h.streak || 0}</span>
          <div class="habit-check-btn">
            ${h.completedToday ? '✓' : ''}
          </div>
        </div>
      </div>
    `).join('');

    this.habitList.querySelectorAll('.habit-item').forEach(item => {
      item.addEventListener('click', () => {
        this.toggleHabit(item.dataset.id);
      });
    });

    // Update streak badge
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    if (this.overallStreakBadge) {
      this.overallStreakBadge.textContent = `🔥 ${maxStreak} Day Best Streak`;
    }
  }

  // --- EVENING REFLECTION ---
  setupReflection() {
    if (this.starsContainer) {
      const stars = this.starsContainer.querySelectorAll('.star');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          this.selectedRating = parseInt(star.dataset.rating, 10);
          this.updateStarUI();
        });
      });
    }

    if (this.saveReflectionBtn) {
      this.saveReflectionBtn.addEventListener('click', () => {
        const win = this.reflWinInput ? this.reflWinInput.value.trim() : "";
        const grateful = this.reflGratefulInput ? this.reflGratefulInput.value.trim() : "";
        const improve = this.reflImproveInput ? this.reflImproveInput.value.trim() : "";

        window.store.update(state => {
          state.reflection = {
            rating: this.selectedRating,
            win,
            grateful,
            improve,
            savedToday: true
          };
        });

        window.audioEngine.playChime('success');
        window.confetti.fire();
        alert("✨ Evening Wrap-Up saved! Great job today.");
      });
    }
  }

  updateStarUI() {
    if (!this.starsContainer) return;
    const stars = this.starsContainer.querySelectorAll('.star');
    stars.forEach(star => {
      const r = parseInt(star.dataset.rating, 10);
      star.classList.toggle('active', r <= this.selectedRating);
    });
  }

  renderReflection(reflection) {
    if (!reflection) return;
    this.selectedRating = reflection.rating || 5;
    this.updateStarUI();

    if (this.reflWinInput && reflection.win !== undefined) {
      this.reflWinInput.value = reflection.win;
    }
    if (this.reflGratefulInput && reflection.grateful !== undefined) {
      this.reflGratefulInput.value = reflection.grateful;
    }
    if (this.reflImproveInput && reflection.improve !== undefined) {
      this.reflImproveInput.value = reflection.improve;
    }

    if (this.reflectionDateBadge) {
      if (reflection.savedToday) {
        this.reflectionDateBadge.textContent = "✓ Saved Today";
        this.reflectionDateBadge.style.color = "var(--emerald)";
      }
    }
  }

  // --- WEEKLY PULSE BARS ---
  setupWeeklyPulse() {
    this.renderWeeklyPulse(window.store.getState().weeklyPulse);
  }

  renderWeeklyPulse(weeklyPulse = {}) {
    if (!this.weeklyPulseBars) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDayIdx = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const todayName = days[currentDayIdx];

    this.weeklyPulseBars.innerHTML = days.map((day, idx) => {
      const isToday = day === todayName;
      const score = weeklyPulse[day] || (isToday ? 85 : 70);

      return `
        <div class="day-bar-col ${isToday ? 'today' : ''}">
          <div class="bar-track" title="${day}: ${score}% consistency">
            <div class="bar-fill" style="height: ${score}%;"></div>
          </div>
          <span class="day-label">${day}</span>
        </div>
      `;
    }).join('');
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

window.reflectionModule = new ReflectionModule();
