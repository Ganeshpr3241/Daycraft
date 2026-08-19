/**
 * DAYCRAFT — MODULE: WELLNESS, HYDRATION (WITH CUSTOM GOAL & LOG), EYE-BREAK & MOOD
 * Supports Fullscreen 20-20-20 Eye Break HUD, Custom Water Goals & Logs, Custom Emojis.
 */

class WellnessModule {
  constructor() {
    // Water elements
    this.waterFill = document.getElementById('waterLevelFill');
    this.waterCurrent = document.getElementById('waterCurrentDisplay');
    this.waterPercent = document.getElementById('waterPercentDisplay');
    this.waterTargetLabel = document.getElementById('waterTargetLabel');
    this.editWaterGoalBtn = document.getElementById('editWaterGoalBtn');
    this.waterGoalEditRow = document.getElementById('waterGoalEditRow');
    this.customWaterGoalInput = document.getElementById('customWaterGoalInput');
    this.saveWaterGoalBtn = document.getElementById('saveWaterGoalBtn');
    this.cancelWaterGoalBtn = document.getElementById('cancelWaterGoalBtn');

    // Water Log buttons & custom log row
    this.add150Btn = document.getElementById('addWater150');
    this.add250Btn = document.getElementById('addWater250');
    this.add500Btn = document.getElementById('addWater500');
    this.add750Btn = document.getElementById('addWater750');
    this.customWaterLogBtn = document.getElementById('customWaterLogBtn');
    this.customWaterLogRow = document.getElementById('customWaterLogRow');
    this.customWaterLogInput = document.getElementById('customWaterLogInput');
    this.saveCustomWaterLogBtn = document.getElementById('saveCustomWaterLogBtn');
    this.resetWaterBtn = document.getElementById('resetWater');

    // Fullscreen Eye Break elements
    this.eyeBreakToggle = document.getElementById('eyeBreakToggle');
    this.eyeBreakOverlay = document.getElementById('eyeBreakOverlay');
    this.eyeBreakCountdownEl = document.getElementById('eyeBreakCountdown');
    this.closeEyeBreakBtn = document.getElementById('closeEyeBreakBtn');
    this.eyeBreakProgressCircle = document.getElementById('eyeBreakProgressCircle');
    this.eyeBreakInterval = null;
    this.countdownTimer = null;

    // Mood elements
    this.moodBtns = document.querySelectorAll('.mood-btn[data-mood]');
    this.customMoodToggleBtn = document.getElementById('customMoodToggleBtn');
    this.customMoodRow = document.getElementById('customMoodRow');
    this.customEmojiInput = document.getElementById('customEmojiInput');
    this.customMoodNote = document.getElementById('customMoodNote');
    this.saveCustomMoodBtn = document.getElementById('saveCustomMoodBtn');
    this.currentMoodEmojiBadge = document.getElementById('currentMoodEmojiBadge');
    this.energySlider = document.getElementById('energySlider');
    this.energyValueText = document.getElementById('energyValueText');
    this.moodStatusBadge = document.getElementById('moodStatusBadge');

    this.init();
  }

  init() {
    this.setupWaterHandlers();
    this.setupMicroBreak();
    this.setupMoodHandlers();

    // Subscribe to store updates
    window.store.subscribe((state) => {
      this.renderWater(state.water);
      this.renderMood(state.mood);
    });
  }

  setupWaterHandlers() {
    const addWater = (amount) => {
      const addVal = parseInt(amount, 10);
      if (isNaN(addVal) || addVal <= 0) return;

      window.store.update(state => {
        state.water.current = Math.min(state.water.goal * 2, (state.water.current || 0) + addVal);
      });
      window.audioEngine.playChime('success');
      if (window.permissionsManager) window.permissionsManager.vibrate([30]);
      
      const current = window.store.getState().water.current;
      const goal = window.store.getState().water.goal;
      if (current >= goal && (current - addVal) < goal) {
        window.confetti.fire();
        if (window.permissionsManager) {
          window.permissionsManager.vibrate([200, 100, 200]);
          window.permissionsManager.sendNotification("💧 100% Daily Hydration Goal Reached!", {
            body: `Awesome job! You reached your target of ${goal} ml today.`,
            tag: "water-goal"
          });
        }
      }
    };

    if (this.add150Btn) this.add150Btn.addEventListener('click', () => addWater(150));
    if (this.add250Btn) this.add250Btn.addEventListener('click', () => addWater(250));
    if (this.add500Btn) this.add500Btn.addEventListener('click', () => addWater(500));
    if (this.add750Btn) this.add750Btn.addEventListener('click', () => addWater(750));

    // Custom Water Log Toggle & Submit
    if (this.customWaterLogBtn && this.customWaterLogRow) {
      this.customWaterLogBtn.addEventListener('click', () => {
        this.customWaterLogRow.classList.toggle('hidden');
        if (!this.customWaterLogRow.classList.contains('hidden') && this.customWaterLogInput) {
          this.customWaterLogInput.focus();
        }
      });
    }

    if (this.saveCustomWaterLogBtn) {
      this.saveCustomWaterLogBtn.addEventListener('click', () => {
        const val = parseInt(this.customWaterLogInput.value, 10);
        if (val > 0) {
          addWater(val);
          this.customWaterLogRow.classList.add('hidden');
          this.customWaterLogInput.value = '';
        }
      });
    }

    if (this.customWaterLogInput) {
      this.customWaterLogInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = parseInt(this.customWaterLogInput.value, 10);
          if (val > 0) {
            addWater(val);
            this.customWaterLogRow.classList.add('hidden');
            this.customWaterLogInput.value = '';
          }
        }
      });
    }

    // Custom Water Goal Editor Handlers
    const toggleGoalEdit = () => {
      if (this.waterGoalEditRow) {
        this.waterGoalEditRow.classList.toggle('hidden');
        if (!this.waterGoalEditRow.classList.contains('hidden') && this.customWaterGoalInput) {
          this.customWaterGoalInput.value = window.store.getState().water.goal || 2500;
          this.customWaterGoalInput.focus();
        }
      }
    };

    if (this.editWaterGoalBtn) this.editWaterGoalBtn.addEventListener('click', toggleGoalEdit);
    if (this.waterTargetLabel) this.waterTargetLabel.addEventListener('click', toggleGoalEdit);

    if (this.cancelWaterGoalBtn) {
      this.cancelWaterGoalBtn.addEventListener('click', () => {
        if (this.waterGoalEditRow) this.waterGoalEditRow.classList.add('hidden');
      });
    }

    if (this.saveWaterGoalBtn) {
      this.saveWaterGoalBtn.addEventListener('click', () => this.saveCustomGoal());
    }

    if (this.customWaterGoalInput) {
      this.customWaterGoalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.saveCustomGoal();
        if (e.key === 'Escape' && this.waterGoalEditRow) this.waterGoalEditRow.classList.add('hidden');
      });
    }

    if (this.resetWaterBtn) {
      this.resetWaterBtn.addEventListener('click', () => {
        window.store.update(state => {
          state.water.current = 0;
        });
        if (window.permissionsManager) window.permissionsManager.vibrate([30]);
      });
    }
  }

  saveCustomGoal() {
    if (!this.customWaterGoalInput) return;
    const newGoal = parseInt(this.customWaterGoalInput.value, 10);
    if (newGoal >= 500 && newGoal <= 10000) {
      window.store.update(state => {
        state.water.goal = newGoal;
      });
      if (this.waterGoalEditRow) this.waterGoalEditRow.classList.add('hidden');
      window.audioEngine.playChime('success');
    }
  }

  renderWater(water) {
    if (!water) return;
    const current = water.current || 0;
    const goal = water.goal || 2500;
    const percent = Math.min(100, Math.round((current / goal) * 100));

    if (this.waterCurrent) {
      this.waterCurrent.innerHTML = `${current} <span class="unit">ml</span>`;
    }
    if (this.waterPercent) {
      this.waterPercent.textContent = `${percent}% of ${goal} ml goal`;
    }
    if (this.waterFill) {
      this.waterFill.style.height = `${percent}%`;
    }
    if (this.waterTargetLabel) {
      this.waterTargetLabel.innerHTML = `Goal: ${goal} ml <span class="edit-hint">✏️</span>`;
    }
  }

  setupMicroBreak() {
    if (!this.eyeBreakToggle) return;

    this.eyeBreakToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (window.permissionsManager) {
          window.permissionsManager.requestNotificationPermission();
          window.permissionsManager.vibrate([30]);
        }
        this.startEyeBreakTimer();
      } else {
        clearInterval(this.eyeBreakInterval);
        this.hideEyeBreakFullscreen();
      }
    });

    if (this.closeEyeBreakBtn) {
      this.closeEyeBreakBtn.addEventListener('click', () => this.hideEyeBreakFullscreen());
    }
  }

  startEyeBreakTimer() {
    clearInterval(this.eyeBreakInterval);
    // Alert every 20 minutes (1200000ms)
    this.eyeBreakInterval = setInterval(() => {
      this.showEyeBreakFullscreen();
    }, 20 * 60 * 1000);
  }

  showEyeBreakFullscreen() {
    if (!this.eyeBreakOverlay) return;

    window.audioEngine.playChime('alert');
    if (window.permissionsManager) {
      window.permissionsManager.vibrate([200, 100, 200]);
      window.permissionsManager.sendNotification("👁️ 20-20-20 Eye Rest & Stretch", {
        body: "Look 20 feet away for 20 seconds to relax your eye muscles!",
        tag: "eye-break",
        renotify: true
      });
    }

    this.eyeBreakOverlay.classList.remove('hidden');
    let timeLeft = 20;

    if (this.eyeBreakCountdownEl) this.eyeBreakCountdownEl.textContent = `${timeLeft}s`;

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      timeLeft--;
      if (this.eyeBreakCountdownEl) this.eyeBreakCountdownEl.textContent = `${timeLeft}s`;

      if (this.eyeBreakProgressCircle) {
        const fraction = 1 - (timeLeft / 20);
        const circumference = 2 * Math.PI * 80;
        this.eyeBreakProgressCircle.style.strokeDashoffset = circumference * (1 - fraction);
      }

      if (timeLeft <= 0) {
        clearInterval(this.countdownTimer);
        window.audioEngine.playChime('success');
        this.hideEyeBreakFullscreen();
      }
    }, 1000);
  }

  hideEyeBreakFullscreen() {
    clearInterval(this.countdownTimer);
    if (this.eyeBreakOverlay) {
      this.eyeBreakOverlay.classList.add('hidden');
    }
  }

  setupMoodHandlers() {
    // Preset Mood Emoji Buttons
    this.moodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedMood = btn.dataset.mood;
        const emoji = btn.dataset.emoji || '⚡';
        
        window.store.update(state => {
          state.mood.selected = selectedMood;
          state.mood.emoji = emoji;
          state.mood.loggedToday = true;
        });

        if (this.customMoodRow) this.customMoodRow.classList.add('hidden');
        window.audioEngine.playChime('success');
        if (window.permissionsManager) window.permissionsManager.vibrate([40]);
      });
    });

    // Toggle Custom Emoji & Note Input
    if (this.customMoodToggleBtn) {
      this.customMoodToggleBtn.addEventListener('click', () => {
        if (this.customMoodRow) {
          this.customMoodRow.classList.toggle('hidden');
          if (!this.customMoodRow.classList.contains('hidden') && this.customEmojiInput) {
            this.customEmojiInput.focus();
          }
        }
      });
    }

    // Save Custom Emoji Mood
    if (this.saveCustomMoodBtn) {
      this.saveCustomMoodBtn.addEventListener('click', () => this.saveCustomMood());
    }

    if (this.customEmojiInput) {
      this.customEmojiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.saveCustomMood();
      });
    }
    if (this.customMoodNote) {
      this.customMoodNote.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.saveCustomMood();
      });
    }

    // Energy Battery Slider
    if (this.energySlider) {
      this.energySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.energyValueText) this.energyValueText.textContent = `${val}%`;
        window.store.update(state => {
          state.mood.energy = val;
        });
      });
    }
  }

  saveCustomMood() {
    const customEmoji = (this.customEmojiInput && this.customEmojiInput.value.trim()) || '✨';
    const customNote = (this.customMoodNote && this.customMoodNote.value.trim()) || '';

    window.store.update(state => {
      state.mood.selected = 'custom';
      state.mood.emoji = customEmoji;
      state.mood.note = customNote;
      state.mood.loggedToday = true;
    });

    if (this.customMoodRow) this.customMoodRow.classList.add('hidden');
    window.audioEngine.playChime('success');
    window.confetti.fire();
    if (window.permissionsManager) window.permissionsManager.vibrate([50]);
  }

  renderMood(mood) {
    if (!mood) return;

    const currentEmoji = mood.emoji || (mood.selected === 'radiant' ? '⚡' : 
                                       mood.selected === 'happy' ? '😊' :
                                       mood.selected === 'calm' ? '😌' :
                                       mood.selected === 'focused' ? '🎯' :
                                       mood.selected === 'tired' ? '🥱' :
                                       mood.selected === 'stressed' ? '😫' : '⚡');

    // Update active highlight on presets
    this.moodBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mood === mood.selected);
    });

    if (this.customMoodToggleBtn) {
      this.customMoodToggleBtn.classList.toggle('active', mood.selected === 'custom');
    }

    // Update badge preview
    if (this.currentMoodEmojiBadge) {
      this.currentMoodEmojiBadge.textContent = currentEmoji;
    }

    // Energy Slider
    if (this.energySlider) {
      this.energySlider.value = mood.energy || 75;
    }
    if (this.energyValueText) {
      this.energyValueText.textContent = `${mood.energy || 75}%`;
    }

    // Status Badge
    if (this.moodStatusBadge) {
      if (mood.loggedToday) {
        this.moodStatusBadge.textContent = `✓ ${currentEmoji} Logged`;
        this.moodStatusBadge.style.color = "var(--success)";
      } else {
        this.moodStatusBadge.textContent = "Log Today";
        this.moodStatusBadge.style.color = "var(--text-muted)";
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.wellnessModule = new WellnessModule();
});
