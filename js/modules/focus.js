/**
 * DAYCRAFT — MODULE: FOCUS STUDIO & FULLSCREEN ZEN COCKPIT
 * Fullscreen deep work HUD with real-time session progress, daily productivity metrics,
 * hydration quick-sip, task completion, and interactive time adjustments.
 */

class FocusModule {
  constructor() {
    this.timerDisplay = document.getElementById('timerDisplay');
    this.timerStatusLabel = document.getElementById('timerStatusLabel');
    this.timerProgressCircle = document.getElementById('timerProgressCircle');
    this.timerToggleBtn = document.getElementById('timerToggleBtn');
    this.timerResetBtn = document.getElementById('timerResetBtn');
    this.timerSkipBtn = document.getElementById('timerSkipBtn');
    this.timerBtnText = document.getElementById('timerBtnText');
    this.completedSessionsBadge = document.getElementById('completedSessionsBadge');

    // Zen Mode Elements
    this.zenTimerDisplay = document.getElementById('zenTimerDisplay');
    this.zenTimerToggleBtn = document.getElementById('zenTimerToggleBtn');
    this.zenResetTimerBtn = document.getElementById('zenResetTimerBtn');
    this.zenSkipTimerBtn = document.getElementById('zenSkipTimerBtn');
    this.zenBtnText = document.getElementById('zenBtnText');
    this.zenTaskSpotlight = document.getElementById('zenTaskSpotlight');
    this.zenAlarmBanner = document.getElementById('zenAlarmBanner');
    this.zenStopAlarmBtn = document.getElementById('zenStopAlarmBtn');
    this.zenCompletePriorityBtn = document.getElementById('zenCompletePriorityBtn');
    this.zenQuickSipBtn = document.getElementById('zenQuickSipBtn');

    // Zen Progress & Metrics Elements
    this.zenPhaseBadge = document.getElementById('zenPhaseBadge');
    this.zenSessionProgressBar = document.getElementById('zenSessionProgressBar');
    this.zenProgressPercentage = document.getElementById('zenProgressPercentage');
    this.zenSessionTimeRemaining = document.getElementById('zenSessionTimeRemaining');
    this.zenSessionsCount = document.getElementById('zenSessionsCount');
    this.zenSessionDots = document.getElementById('zenSessionDots');
    this.zenTotalMins = document.getElementById('zenTotalMins');
    this.zenDailyGoalSub = document.getElementById('zenDailyGoalSub');
    this.zenWaterStatus = document.getElementById('zenWaterStatus');
    this.zenStreakStatus = document.getElementById('zenStreakStatus');
    this.zenNextTaskText = document.getElementById('zenNextTaskText');
    this.zenLiveClock = document.getElementById('zenLiveClock');

    // Zen Fullscreen Min / Sec Controls
    this.zenAdjustBtns = document.querySelectorAll('.zen-adjust-btn');
    this.zenCustomTimeToggleBtn = document.getElementById('zenCustomTimeToggleBtn');
    this.zenCustomInputsRow = document.getElementById('zenCustomInputsRow');
    this.zenMinInput = document.getElementById('zenMinInput');
    this.zenSecInput = document.getElementById('zenSecInput');
    this.zenApplyCustomTimeBtn = document.getElementById('zenApplyCustomTimeBtn');

    // Global Alarm Dismissal Elements
    this.alarmRingingBanner = document.getElementById('alarmRingingBanner');
    this.globalStopAlarmBtn = document.getElementById('globalStopAlarmBtn');

    // Custom Timers Elements & Modal
    this.customTimersList = document.getElementById('customTimersList');
    this.addCustomTimerTriggerBtn = document.getElementById('addCustomTimerTriggerBtn');
    this.customTimerModal = document.getElementById('customTimerModal');
    this.closeCustomTimerModal = document.getElementById('closeCustomTimerModal');
    this.customTimerForm = document.getElementById('customTimerModalForm');
    this.customTimerNameInput = document.getElementById('customTimerModalName');
    this.customTimerMinsInput = document.getElementById('customTimerModalMins');
    this.customTimerAutoZenCheck = document.getElementById('customTimerAutoZen');

    this.currentMode = 'pomodoro';
    this.currentTimerName = 'Pomodoro 25m';
    this.totalDuration = 1500; // 25 min default
    this.timeLeft = 1500;
    this.isRunning = false;
    this.timerInterval = null;
    this.circleCircumference = 597; // 2 * PI * 95
    this.customTimers = [];

    this.init();
  }

  init() {
    this.loadCustomTimers();
    this.setupModeTabs();
    this.setupCustomTimerModal();
    this.setupControls();
    this.setupZenTimeControls();
    this.setupZenQuickActions();
    this.setupAlarmDismissal();
    this.setupMediaSession();
    this.updateDisplay();
    this.renderZenCockpitMetrics();

    // Re-render metrics on store updates
    window.store.subscribe((state) => {
      if (this.completedSessionsBadge) {
        this.completedSessionsBadge.textContent = `${state.focus.sessionsCompleted || 0} Done`;
      }
      this.renderZenCockpitMetrics();
    });

    // Update lock screen notification whenever page visibility changes (phone locks/unlocks)
    document.addEventListener('visibilitychange', () => {
      if (this.isRunning) {
        this.updateLockScreenNotification(this.formatTime(this.timeLeft));
      }
    });

    // Update Zen Clock every 15s
    setInterval(() => this.updateZenClock(), 15000);
    this.updateZenClock();
  }

  updateZenClock() {
    if (!this.zenLiveClock) return;
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    this.zenLiveClock.textContent = `${hours}:${mins} ${ampm}`;
  }

  loadCustomTimers() {
    try {
      const saved = localStorage.getItem('daycraft_custom_timers');
      this.customTimers = saved ? JSON.parse(saved) : [];
    } catch (e) {
      this.customTimers = [];
    }
    this.renderCustomTimers();
  }

  saveCustomTimers() {
    try {
      localStorage.setItem('daycraft_custom_timers', JSON.stringify(this.customTimers));
    } catch (e) {}
  }

  renderCustomTimers() {
    if (!this.customTimersList) return;
    this.customTimersList.innerHTML = '';

    this.customTimers.forEach(timer => {
      const pill = document.createElement('div');
      pill.className = `custom-timer-pill ${this.currentMode === `custom_${timer.id}` ? 'active' : ''}`;
      pill.dataset.mode = `custom_${timer.id}`;
      pill.dataset.time = timer.mins * 60;
      pill.dataset.name = `${timer.name} ${timer.mins}m`;

      pill.innerHTML = `
        <span>⏱️ ${timer.name} ${timer.mins}m</span>
        <button class="btn-delete-custom-timer" title="Delete timer" data-id="${timer.id}">&times;</button>
      `;

      pill.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-custom-timer')) {
          e.stopPropagation();
          this.deleteCustomTimer(timer.id);
          return;
        }
        this.activateTimerMode(`custom_${timer.id}`, timer.mins * 60, `${timer.name} ${timer.mins}m`);
      });

      this.customTimersList.appendChild(pill);
    });
  }

  setupModeTabs() {
    const tabs = document.querySelectorAll('.timer-mode-selector .timer-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        const time = parseInt(tab.dataset.time, 10);
        const name = tab.textContent.trim();
        this.activateTimerMode(mode, time, name);
      });
    });
  }

  activateTimerMode(mode, durationSeconds, name) {
    if (this.isRunning) this.pauseTimer();

    this.currentMode = mode;
    this.currentTimerName = name;
    this.totalDuration = durationSeconds;
    this.timeLeft = durationSeconds;

    // Highlight mode button
    document.querySelectorAll('.timer-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === mode);
    });
    document.querySelectorAll('.custom-timer-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.mode === mode);
    });

    // Update Min/Sec inputs to match
    if (this.zenMinInput) this.zenMinInput.value = Math.floor(durationSeconds / 60);
    if (this.zenSecInput) this.zenSecInput.value = String(durationSeconds % 60).padStart(2, '0');

    // Update Phase Badge
    if (this.zenPhaseBadge) {
      if (mode === 'break' || mode === 'long_break') {
        this.zenPhaseBadge.textContent = "☕ Rest & Recharge Interval";
        this.zenPhaseBadge.style.color = "var(--warning)";
      } else {
        this.zenPhaseBadge.textContent = "🎯 Deep Work Interval";
        this.zenPhaseBadge.style.color = "var(--primary)";
      }
    }

    this.updateDisplay();
    this.updateStatusLabel(`Ready to begin ${name}`);
    window.audioEngine.playChime('success');
  }

  setupCustomTimerModal() {
    if (this.addCustomTimerTriggerBtn && this.customTimerModal) {
      this.addCustomTimerTriggerBtn.addEventListener('click', () => {
        this.customTimerModal.classList.remove('hidden');
        if (this.customTimerNameInput) {
          this.customTimerNameInput.value = '';
          this.customTimerNameInput.focus();
        }
      });
    }

    if (this.closeCustomTimerModal && this.customTimerModal) {
      this.closeCustomTimerModal.addEventListener('click', () => {
        this.customTimerModal.classList.add('hidden');
      });
    }

    if (this.customTimerForm) {
      this.customTimerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = (this.customTimerNameInput && this.customTimerNameInput.value.trim()) || 'Focus Sprint';
        const mins = parseInt(this.customTimerMinsInput.value, 10) || 15;
        const autoZen = this.customTimerAutoZenCheck && this.customTimerAutoZenCheck.checked;

        if (mins > 0 && mins <= 240) {
          const newTimer = {
            id: Date.now(),
            name,
            mins
          };
          this.customTimers.push(newTimer);
          this.saveCustomTimers();
          this.renderCustomTimers();
          this.activateTimerMode(`custom_${newTimer.id}`, mins * 60, `${name} ${mins}m`);
          
          if (this.customTimerModal) this.customTimerModal.classList.add('hidden');
          window.audioEngine.playChime('success');

          // Auto-start and launch Fullscreen Zen mode if requested
          if (autoZen) {
            this.startTimer();
            const zenBtn = document.getElementById('zenModeBtn');
            if (zenBtn) zenBtn.click();
          }
        }
      });
    }
  }

  deleteCustomTimer(id) {
    this.customTimers = this.customTimers.filter(t => t.id !== id);
    this.saveCustomTimers();
    this.renderCustomTimers();
    if (this.currentMode === `custom_${id}`) {
      this.activateTimerMode('pomodoro', 1500, 'Pomodoro 25m');
    }
  }

  setupControls() {
    const toggleHandler = () => this.toggleTimer();

    if (this.timerToggleBtn) this.timerToggleBtn.addEventListener('click', toggleHandler);
    if (this.zenTimerToggleBtn) this.zenTimerToggleBtn.addEventListener('click', toggleHandler);
    if (this.timerResetBtn) this.timerResetBtn.addEventListener('click', () => this.resetTimer());
    if (this.zenResetTimerBtn) this.zenResetTimerBtn.addEventListener('click', () => this.resetTimer());
    if (this.timerSkipBtn) this.timerSkipBtn.addEventListener('click', () => this.finishSession(false));
    if (this.zenSkipTimerBtn) this.zenSkipTimerBtn.addEventListener('click', () => this.finishSession(false));
  }

  // --- ZEN COCKPIT QUICK ACTIONS & METRICS ---
  setupZenQuickActions() {
    // Complete Priority Button in Zen Mode
    if (this.zenCompletePriorityBtn) {
      this.zenCompletePriorityBtn.addEventListener('click', () => {
        window.store.update(state => {
          if (state.priority) state.priority.completed = true;
        });
        window.audioEngine.playChime('success');
        window.confetti.fire(window.innerWidth / 2, window.innerHeight / 2, 70);
        this.zenCompletePriorityBtn.innerHTML = `<span>✓ Completed! 🎉</span>`;
        this.zenCompletePriorityBtn.classList.add('completed');
      });
    }

    // Quick Sip (+250ml) in Zen Mode
    if (this.zenQuickSipBtn) {
      this.zenQuickSipBtn.addEventListener('click', () => {
        window.store.update(state => {
          state.water.current = (state.water.current || 0) + 250;
        });
        window.audioEngine.playChime('success');
        if (window.permissionsManager) window.permissionsManager.vibrate([30, 30]);
        this.renderZenCockpitMetrics();
      });
    }
  }

  renderZenCockpitMetrics() {
    const state = window.store.getState();
    const focus = state.focus || { sessionsCompleted: 0, totalMinutes: 0, targetSessions: 4 };
    const water = state.water || { current: 0, goal: 2500 };
    const targetSessions = focus.targetSessions || 4;
    const completedSessions = focus.sessionsCompleted || 0;

    // 1. Sessions Target & Dot Indicators
    if (this.zenSessionsCount) {
      this.zenSessionsCount.textContent = `${completedSessions} / ${targetSessions} Done`;
    }
    if (this.zenSessionDots) {
      this.zenSessionDots.innerHTML = '';
      for (let i = 0; i < targetSessions; i++) {
        const dot = document.createElement('span');
        dot.className = `zen-session-dot ${i < completedSessions ? 'filled' : ''}`;
        this.zenSessionDots.appendChild(dot);
      }
    }

    // 2. Focus Time Today
    if (this.zenTotalMins) {
      this.zenTotalMins.textContent = `${focus.totalMinutes || 0}m Focused`;
    }
    if (this.zenDailyGoalSub) {
      const dailyTargetMins = targetSessions * 25;
      this.zenDailyGoalSub.textContent = `Daily Target: ${dailyTargetMins}m`;
    }

    // 3. Hydration Level
    if (this.zenWaterStatus) {
      this.zenWaterStatus.textContent = `${water.current || 0} / ${water.goal || 2500} ml`;
    }

    // 4. Streak
    if (this.zenStreakStatus) {
      const completedHabit = state.habits?.find(h => h.completedToday);
      const streak = completedHabit ? completedHabit.streak : 5;
      this.zenStreakStatus.textContent = `${streak} Days`;
    }

    // 5. Next Up Task Peek
    if (this.zenNextTaskText && state.tasks) {
      const nextPending = state.tasks.find(t => !t.completed);
      if (nextPending) {
        this.zenNextTaskText.textContent = nextPending.text;
      } else {
        this.zenNextTaskText.textContent = "All planned tasks completed! Outstanding work.";
      }
    }
  }

  // --- FULLSCREEN ZEN TIME ADJUSTMENT CONTROLS (MINUTES & SECONDS) ---
  setupZenTimeControls() {
    // Quick adjustment buttons (+/- seconds)
    this.zenAdjustBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const deltaSec = parseInt(btn.dataset.sec, 10) || 0;
        this.adjustTimeBy(deltaSec);
      });
    });

    // Toggle custom Min/Sec inputs panel
    if (this.zenCustomTimeToggleBtn && this.zenCustomInputsRow) {
      this.zenCustomTimeToggleBtn.addEventListener('click', () => {
        const isHidden = this.zenCustomInputsRow.classList.contains('hidden');
        this.zenCustomInputsRow.classList.toggle('hidden', !isHidden);
        if (isHidden) {
          if (this.zenMinInput) {
            this.zenMinInput.value = Math.floor(this.timeLeft / 60);
            this.zenMinInput.focus();
          }
          if (this.zenSecInput) {
            this.zenSecInput.value = String(this.timeLeft % 60).padStart(2, '0');
          }
        }
      });
    }

    // Apply custom Min/Sec values
    if (this.zenApplyCustomTimeBtn) {
      this.zenApplyCustomTimeBtn.addEventListener('click', () => {
        const mins = parseInt(this.zenMinInput.value, 10) || 0;
        const secs = parseInt(this.zenSecInput.value, 10) || 0;
        const total = (mins * 60) + secs;

        if (total >= 5) {
          if (this.isRunning) this.pauseTimer();
          this.totalDuration = total;
          this.timeLeft = total;
          this.currentTimerName = `Custom ${mins}m ${secs}s`;
          this.updateDisplay();
          this.updateStatusLabel(`Set to ${this.formatTime(total)}`);
          if (this.zenCustomInputsRow) this.zenCustomInputsRow.classList.add('hidden');
          window.audioEngine.playChime('success');
        }
      });
    }
  }

  adjustTimeBy(deltaSec) {
    if (this.isRunning) this.pauseTimer();
    let newTime = this.timeLeft + deltaSec;
    if (newTime < 10) newTime = 10; // minimum 10 seconds
    if (newTime > 10800) newTime = 10800; // maximum 3 hours

    this.timeLeft = newTime;
    this.totalDuration = Math.max(this.totalDuration, newTime);

    if (this.zenMinInput) this.zenMinInput.value = Math.floor(newTime / 60);
    if (this.zenSecInput) this.zenSecInput.value = String(newTime % 60).padStart(2, '0');

    this.updateDisplay();
    this.updateStatusLabel(`Time adjusted: ${this.formatTime(newTime)}`);
    if (window.permissionsManager) window.permissionsManager.vibrate([20]);
  }

  // --- ALARM DISMISSAL HANDLERS ---
  setupAlarmDismissal() {
    const dismissAlarm = () => {
      this.stopAlarmUI();
    };

    if (this.globalStopAlarmBtn) this.globalStopAlarmBtn.addEventListener('click', dismissAlarm);
    if (this.zenStopAlarmBtn) this.zenStopAlarmBtn.addEventListener('click', dismissAlarm);

    // Pressing Spacebar or Escape also dismisses the ringing alarm
    document.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Escape') && !this.alarmRingingBanner.classList.contains('hidden')) {
        dismissAlarm();
      }
    });
  }

  showAlarmUI() {
    if (this.alarmRingingBanner) this.alarmRingingBanner.classList.remove('hidden');
    if (this.zenAlarmBanner) this.zenAlarmBanner.classList.remove('hidden');
  }

  stopAlarmUI() {
    window.audioEngine.stopAlarm();
    if (this.alarmRingingBanner) this.alarmRingingBanner.classList.add('hidden');
    if (this.zenAlarmBanner) this.zenAlarmBanner.classList.add('hidden');
    if (window.permissionsManager) window.permissionsManager.vibrate(0);
  }

  setupMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        if (!this.isRunning) this.startTimer();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (this.isRunning) this.pauseTimer();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        this.resetTimer();
      });
    }
  }

  getActiveTaskName() {
    const state = window.store.getState();
    if (state.priority && state.priority.text) {
      return state.priority.text;
    }
    return "Deep Focus Session";
  }

  updateMediaSession(formattedTime) {
    if ('mediaSession' in navigator) {
      const taskName = this.getActiveTaskName();

      navigator.mediaSession.metadata = new MediaMetadata({
        title: `🎯 ${taskName} (${formattedTime})`,
        artist: 'DayCraft Focus OS',
        album: `${this.currentTimerName} • Active Flow`,
        artwork: [
          { src: 'manifest.json', sizes: '512x512', type: 'image/svg+xml' }
        ]
      });

      navigator.mediaSession.playbackState = this.isRunning ? 'playing' : 'paused';
    }
  }

  updateLockScreenNotification(formattedTime) {
    if (window.permissionsManager && this.isRunning) {
      const taskName = this.getActiveTaskName();
      window.permissionsManager.sendNotification(`🎯 Focus: ${formattedTime} remaining`, {
        body: `Active Goal: "${taskName}" • Tap to view focus screen`,
        tag: "daycraft-lockscreen-focus",
        silent: true
      });
    }
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  async startTimer() {
    window.audioEngine.ensureContext();
    this.stopAlarmUI(); // Stop alarm if currently ringing

    // Request notification permission if not yet decided
    if (window.permissionsManager && 'Notification' in window && Notification.permission === 'default') {
      window.permissionsManager.requestNotificationPermission();
    }

    // Keep screen awake while focusing
    if (window.permissionsManager) {
      window.permissionsManager.requestWakeLock();
      window.permissionsManager.vibrate([40]);
    }

    this.isRunning = true;
    this.updateButtons(true);
    this.updateStatusLabel("In Deep Flow...");

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();

      if (this.timeLeft <= 0) {
        this.finishSession(true);
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.updateButtons(false);
    this.updateStatusLabel("Paused");

    if (window.permissionsManager) {
      window.permissionsManager.releaseWakeLock();
    }
    this.updateMediaSession(this.formatTime(this.timeLeft));
  }

  resetTimer() {
    this.pauseTimer();
    this.stopAlarmUI();
    this.timeLeft = this.totalDuration;
    this.updateDisplay();
    this.updateStatusLabel("Ready to focus");
  }

  finishSession(completed = true) {
    this.pauseTimer();
    this.timeLeft = this.totalDuration;
    this.updateDisplay();

    if (completed) {
      // Play loud alarm and display dismissal buttons
      window.audioEngine.playChime('timer');
      this.showAlarmUI();
      window.confetti.fire(window.innerWidth / 2, window.innerHeight / 2, 60);

      const taskName = this.getActiveTaskName();

      // Trigger Haptics & Background Push Notification Popup on Lock Screen
      if (window.permissionsManager) {
        window.permissionsManager.vibrate([300, 150, 300, 150, 500]);

        if (this.currentMode === 'pomodoro' || this.currentMode === 'flow' || this.currentMode.startsWith('custom_')) {
          window.permissionsManager.sendNotification("🎯 Focus Session Complete!", {
            body: `Outstanding job finishing: "${taskName}"! Time to take a restful break.`,
            tag: "focus-complete",
            renotify: true
          });
        } else {
          window.permissionsManager.sendNotification("⚡ Break Finished!", {
            body: "Your break is over. Ready to begin your next focus block?",
            tag: "break-complete",
            renotify: true
          });
        }
      }

      if (this.currentMode === 'pomodoro' || this.currentMode === 'flow' || this.currentMode.startsWith('custom_')) {
        const sessionMins = Math.round(this.totalDuration / 60);
        window.store.update(state => {
          state.focus.sessionsCompleted = (state.focus.sessionsCompleted || 0) + 1;
          state.focus.totalMinutes = (state.focus.totalMinutes || 0) + sessionMins;
        });
      }
      this.updateStatusLabel("Session Completed! 🎉");
      if (window.checkAndPromptRating) window.checkAndPromptRating();
    } else {
      this.updateStatusLabel("Session Skipped");
    }
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateDisplay() {
    const formatted = this.formatTime(this.timeLeft);

    if (this.timerDisplay) this.timerDisplay.textContent = formatted;
    if (this.zenTimerDisplay) this.zenTimerDisplay.textContent = formatted;

    // Document title update
    if (this.isRunning) {
      document.title = `(${formatted}) DayCraft Focus`;
      this.updateMediaSession(formatted);
    } else {
      document.title = `DayCraft — Everyday Life OS`;
    }

    // Circular SVG Progress
    if (this.timerProgressCircle) {
      const progressFraction = 1 - (this.timeLeft / this.totalDuration);
      const offset = this.circleCircumference - (progressFraction * this.circleCircumference);
      this.timerProgressCircle.style.strokeDashoffset = offset;
    }

    // Zen Session Progress Bar & Percentages
    const progressFraction = Math.min(1, Math.max(0, 1 - (this.timeLeft / this.totalDuration)));
    const percent = Math.round(progressFraction * 100);

    if (this.zenSessionProgressBar) {
      this.zenSessionProgressBar.style.width = `${percent}%`;
    }
    if (this.zenProgressPercentage) {
      this.zenProgressPercentage.textContent = `${percent}% Completed`;
    }
    if (this.zenSessionTimeRemaining) {
      this.zenSessionTimeRemaining.textContent = `${formatted} Remaining`;
    }
  }

  updateButtons(running) {
    const text = running ? "Pause" : "Start Focus";
    if (this.timerBtnText) this.timerBtnText.textContent = text;
    if (this.zenBtnText) this.zenBtnText.textContent = text;

    const playIcon = document.getElementById('timerPlayIcon');
    if (playIcon) {
      if (running) {
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="currentColor"></rect><rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>';
      } else {
        playIcon.innerHTML = '<polygon points="6 4 20 12 6 20 6 4" fill="currentColor"></polygon>';
      }
    }
  }

  updateStatusLabel(text) {
    if (this.timerStatusLabel) this.timerStatusLabel.textContent = text;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.focusModule = new FocusModule();
});
