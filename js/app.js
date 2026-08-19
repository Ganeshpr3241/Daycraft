/**
 * DAYCRAFT — MAIN APPLICATION COORDINATOR
 * Manages separate tab views, Dark/Light theme switching, soundscape sliders,
 * Zen mode, single universal bottom navigation dock, settings, and notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log("DayCraft OS initialized successfully.");

  // --- SEPARATE TAB VIEWS ENGINE ---
  const bottomNavTabs = document.querySelectorAll('.app-bottom-nav .nav-tab-btn[data-tab]');
  const tabViews = {
    focus: document.getElementById('viewFocus'),
    tasks: document.getElementById('viewTasks'),
    toolbox: document.getElementById('viewToolbox'),
    habits: document.getElementById('viewHabits')
  };

  const switchTab = (tabName) => {
    // Sync bottom navigation dock buttons
    bottomNavTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Show only the selected tab view
    Object.entries(tabViews).forEach(([key, view]) => {
      if (view) {
        view.classList.toggle('active', key === tabName);
      }
    });

    // Scroll to top of view smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      localStorage.setItem('daycraft_active_tab', tabName);
    } catch (e) {}
  };

  // Attach click events to bottom navigation tabs
  bottomNavTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Load saved tab (default to 'focus')
  const savedTab = localStorage.getItem('daycraft_active_tab') || 'focus';
  switchTab(savedTab);

  // --- MONOCHROME DARK / LIGHT THEME ENGINE ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');
  const settingThemeSelect = document.getElementById('settingThemeSelect');
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');

  const applyTheme = (themeId) => {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-cyber', 'theme-aurora', 'theme-sunset', 'theme-glacier');
    document.body.classList.add(themeId);

    const isLight = themeId === 'theme-light';
    if (themeIcon) themeIcon.textContent = isLight ? '🌙' : '☀️';
    if (themeLabel) themeLabel.textContent = isLight ? 'Dark' : 'Light';
    if (settingThemeSelect) settingThemeSelect.value = themeId;
    if (metaThemeColor) metaThemeColor.setAttribute('content', isLight ? '#f8fafc' : '#09090b');

    try {
      localStorage.setItem('daycraft_monochrome_theme', themeId);
    } catch (e) {}
  };

  // Load saved theme or default to clean dark
  const savedTheme = localStorage.getItem('daycraft_monochrome_theme') || 'theme-dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isCurrentDark = document.body.classList.contains('theme-dark') || !document.body.classList.contains('theme-light');
      const nextTheme = isCurrentDark ? 'theme-light' : 'theme-dark';
      applyTheme(nextTheme);
      window.audioEngine.playChime('success');
    });
  }

  if (settingThemeSelect) {
    settingThemeSelect.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  }

  // --- AMBIENT SOUNDSCAPE SLIDERS & FULLSCREEN SOUNDSCAPE STUDIO ---
  const soundSliders = [
    { id: 'volRain', fsId: 'fsVolRain', valId: 'valRain', fsValId: 'fsValRain', track: 'rain' },
    { id: 'volCafe', fsId: 'fsVolCafe', valId: 'valCafe', fsValId: 'fsValCafe', track: 'cafe' },
    { id: 'volForest', fsId: 'fsVolForest', valId: 'valForest', fsValId: 'fsValForest', track: 'forest' },
    { id: 'volOcean', fsId: 'fsVolOcean', valId: 'valOcean', fsValId: 'fsValOcean', track: 'ocean' },
    { id: 'volBinaural', fsId: 'fsVolBinaural', valId: 'valBinaural', fsValId: 'fsValBinaural', track: 'binaural' }
  ];

  const updateTrackSlider = (trackName, val) => {
    const item = soundSliders.find(s => s.track === trackName);
    if (!item) return;

    const slider = document.getElementById(item.id);
    const fsSlider = document.getElementById(item.fsId);
    const label = document.getElementById(item.valId);
    const fsLabel = document.getElementById(item.fsValId);

    if (slider) slider.value = val;
    if (fsSlider) fsSlider.value = val;
    if (label) label.textContent = `${val}%`;
    if (fsLabel) fsLabel.textContent = `${val}%`;

    window.audioEngine.setTrackVolume(trackName, val / 100);
  };

  soundSliders.forEach(({ id, fsId, valId, fsValId, track }) => {
    const slider = document.getElementById(id);
    const fsSlider = document.getElementById(fsId);

    const onInput = (e) => {
      const val = parseInt(e.target.value, 10);
      updateTrackSlider(track, val);
    };

    if (slider) slider.addEventListener('input', onInput);
    if (fsSlider) fsSlider.addEventListener('input', onInput);
  });

  // Soundscape Quick Scene Presets
  const soundPresets = {
    rain: { rain: 60, cafe: 0, forest: 0, ocean: 0, binaural: 0 },
    cafe: { rain: 20, cafe: 50, forest: 0, ocean: 0, binaural: 0 },
    forest: { rain: 0, cafe: 0, forest: 70, ocean: 20, binaural: 0 },
    ocean: { rain: 0, cafe: 0, forest: 0, ocean: 60, binaural: 30 },
    binaural: { rain: 30, cafe: 0, forest: 0, ocean: 0, binaural: 80 }
  };

  const applySoundscapePreset = (presetKey) => {
    const preset = soundPresets[presetKey];
    if (!preset) return;

    // Reset all tracks then apply preset
    Object.keys(preset).forEach(track => {
      updateTrackSlider(track, preset[track]);
    });

    document.querySelectorAll('.soundscape-preset-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.preset === presetKey);
    });

    window.audioEngine.playChime('success');
  };

  document.querySelectorAll('.soundscape-preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      applySoundscapePreset(pill.dataset.preset);
    });
  });

  // Audio Sleep & Continuous Playback Timer
  const audioTimerBtns = document.querySelectorAll('.audio-timer-btn');
  const audioTimerLiveBadge = document.getElementById('audioTimerLiveBadge');
  const fsSoundTimerBadge = document.getElementById('fsSoundTimerBadge');

  audioTimerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.timer;
      audioTimerBtns.forEach(b => b.classList.toggle('active', b.dataset.timer === mode));

      if (mode === 'continuous') {
        window.audioEngine.setAudioTimer(0);
      } else {
        window.audioEngine.setAudioTimer(parseInt(mode, 10));
      }
      window.audioEngine.playChime('success');
    });
  });

  window.audioEngine.onTimerTick((text, mode) => {
    if (audioTimerLiveBadge) audioTimerLiveBadge.textContent = text;
    if (fsSoundTimerBadge) fsSoundTimerBadge.textContent = text;
  });

  // Master Sound Mute Buttons
  const masterSoundToggle = document.getElementById('masterSoundToggle');
  const fsMasterMuteBtn = document.getElementById('fsMasterMuteBtn');
  const resetSoundscapeBtn = document.getElementById('resetSoundscapeBtn');
  const fsResetSoundscapeBtn = document.getElementById('fsResetSoundscapeBtn');
  let isMuted = false;

  const resetAllSoundscapes = () => {
    // Reset all tracks to 0
    soundSliders.forEach(({ track }) => {
      updateTrackSlider(track, 0);
    });

    // Reset preset buttons and timer
    document.querySelectorAll('.soundscape-preset-pill').forEach(pill => pill.classList.remove('active'));
    audioTimerBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.timer === 'continuous'));
    window.audioEngine.setAudioTimer(0);
    window.audioEngine.stopAll();

    if (masterSoundToggle) masterSoundToggle.textContent = "Mute All";
    if (fsMasterMuteBtn) fsMasterMuteBtn.textContent = "Mute All Sounds";
    isMuted = false;

    if (window.permissionsManager) window.permissionsManager.vibrate([30]);
  };

  if (resetSoundscapeBtn) resetSoundscapeBtn.addEventListener('click', resetAllSoundscapes);
  if (fsResetSoundscapeBtn) fsResetSoundscapeBtn.addEventListener('click', resetAllSoundscapes);

  const toggleMasterMute = () => {
    isMuted = !isMuted;
    if (isMuted) {
      window.audioEngine.stopAll();
      if (masterSoundToggle) masterSoundToggle.textContent = "Unmute";
      if (fsMasterMuteBtn) fsMasterMuteBtn.textContent = "Unmute Sounds";
    } else {
      if (masterSoundToggle) masterSoundToggle.textContent = "Mute All";
      if (fsMasterMuteBtn) fsMasterMuteBtn.textContent = "Mute All Sounds";
      soundSliders.forEach(({ id, track }) => {
        const slider = document.getElementById(id);
        if (slider && parseInt(slider.value, 10) > 0) {
          window.audioEngine.setTrackVolume(track, parseInt(slider.value, 10) / 100);
        }
      });
    }
  };

  if (masterSoundToggle) masterSoundToggle.addEventListener('click', toggleMasterMute);
  if (fsMasterMuteBtn) fsMasterMuteBtn.addEventListener('click', toggleMasterMute);

  // Fullscreen Soundscape Studio Overlay Handlers
  const soundscapeFullscreenOverlay = document.getElementById('soundscapeFullscreenOverlay');
  const openSoundscapeFullscreenBtn = document.getElementById('openSoundscapeFullscreenBtn');
  const exitSoundscapeFullscreenBtn = document.getElementById('exitSoundscapeFullscreenBtn');
  const audioToggleBtn = document.getElementById('audioToggleBtn');

  const openSoundscapeFullscreen = () => {
    if (soundscapeFullscreenOverlay) soundscapeFullscreenOverlay.classList.remove('hidden');
    window.audioEngine.ensureContext();
  };

  const closeSoundscapeFullscreen = () => {
    if (soundscapeFullscreenOverlay) soundscapeFullscreenOverlay.classList.add('hidden');
  };

  if (openSoundscapeFullscreenBtn) openSoundscapeFullscreenBtn.addEventListener('click', openSoundscapeFullscreen);
  if (exitSoundscapeFullscreenBtn) exitSoundscapeFullscreenBtn.addEventListener('click', closeSoundscapeFullscreen);
  if (audioToggleBtn) audioToggleBtn.addEventListener('click', openSoundscapeFullscreen);

  // --- FULLSCREEN ZEN MODE ---
  const zenModeBtn = document.getElementById('zenModeBtn');
  const bottomZenNavBtn = document.getElementById('bottomZenNavBtn');
  const zenOverlay = document.getElementById('zenOverlay');
  const exitZenBtn = document.getElementById('exitZenBtn');
  const zenSoundPills = document.querySelectorAll('.zen-sound-pill');

  const openZen = () => {
    if (zenOverlay) zenOverlay.classList.remove('hidden');
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if (window.permissionsManager) {
      window.permissionsManager.requestWakeLock();
    }
    if (window.focusModule) {
      window.focusModule.renderZenCockpitMetrics();
      window.focusModule.updateDisplay();
    }
  };

  const closeZen = () => {
    if (zenOverlay) zenOverlay.classList.add('hidden');
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    if (window.permissionsManager && (!window.focusModule || !window.focusModule.isRunning)) {
      window.permissionsManager.releaseWakeLock();
    }
  };

  if (zenModeBtn) zenModeBtn.addEventListener('click', openZen);
  if (bottomZenNavBtn) bottomZenNavBtn.addEventListener('click', openZen);
  if (exitZenBtn) exitZenBtn.addEventListener('click', closeZen);

  zenSoundPills.forEach(pill => {
    pill.addEventListener('click', () => {
      zenSoundPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const soundName = pill.dataset.sound;
      
      window.audioEngine.stopAll();

      if (soundName === 'mute') {
        soundSliders.forEach(({ track }) => updateTrackSlider(track, 0));
        return;
      }

      window.audioEngine.setTrackVolume(soundName, 0.5);

      // Sync slider UI
      const match = soundSliders.find(s => s.track === soundName);
      if (match) {
        updateTrackSlider(soundName, 50);
      }
    });
  });

  // --- SETTINGS MODAL ---
  const settingsModalBtn = document.getElementById('settingsModalBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsModal = document.getElementById('closeSettingsModal');
  const clearAllDataBtn = document.getElementById('clearAllDataBtn');
  const settingWaterGoal = document.getElementById('settingWaterGoal');
  const settingDailyBudget = document.getElementById('settingDailyBudget');
  const settingPomoTime = document.getElementById('settingPomoTime');
  const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');

  const openSettings = () => {
    const state = window.store.getState();
    if (settingWaterGoal) settingWaterGoal.value = state.water.goal || 2500;
    if (settingDailyBudget) settingDailyBudget.value = state.expenses.dailyBudget || 40;
    if (settingThemeSelect) {
      const active = document.body.classList.contains('theme-light') ? 'theme-light' : 'theme-dark';
      settingThemeSelect.value = active;
    }
    if (enableNotificationsBtn) {
      if (Notification && Notification.permission === 'granted') {
        enableNotificationsBtn.textContent = "✓ Push Notifications Active";
        enableNotificationsBtn.style.color = "var(--success)";
      } else if (Notification && Notification.permission === 'denied') {
        enableNotificationsBtn.textContent = "⚠️ Notifications Blocked in Browser";
      } else {
        enableNotificationsBtn.textContent = "🔔 Enable Focus & Wellness Reminders";
      }
    }
    if (settingsModal) settingsModal.classList.remove('hidden');
  };

  const closeSettings = () => {
    if (settingsModal) settingsModal.classList.add('hidden');
  };

  if (settingsModalBtn) settingsModalBtn.addEventListener('click', openSettings);
  if (closeSettingsModal) closeSettingsModal.addEventListener('click', closeSettings);

  if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener('click', async () => {
      if (window.permissionsManager) {
        const granted = await window.permissionsManager.requestNotificationPermission();
        if (granted) {
          enableNotificationsBtn.textContent = "✓ Push Notifications Active";
          enableNotificationsBtn.style.color = "var(--success)";
        }
      }
    });
  }

  if (settingWaterGoal) {
    settingWaterGoal.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val > 0) {
        window.store.update(state => { state.water.goal = val; });
      }
    });
  }

  if (settingDailyBudget) {
    settingDailyBudget.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      if (val > 0) {
        window.store.update(state => { state.expenses.dailyBudget = val; });
      }
    });
  }

  if (settingPomoTime) {
    settingPomoTime.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val > 0 && val <= 120 && window.focusModule) {
        const pomoTab = document.querySelector('.timer-tab[data-mode="pomodoro"]');
        if (pomoTab) {
          pomoTab.dataset.time = val * 60;
          pomoTab.textContent = `Pomodoro ${val}m`;
        }
      }
    });
  }

  if (clearAllDataBtn) {
    clearAllDataBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to reset all DayCraft data? This cannot be undone.")) {
        window.store.resetAllData();
        closeSettings();
        window.location.reload();
      }
    });
  }

  // --- SHORTCUTS MODAL ---
  const quickShortcutsBtn = document.getElementById('quickShortcutsBtn');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const closeShortcutsModal = document.getElementById('closeShortcutsModal');

  if (quickShortcutsBtn) {
    quickShortcutsBtn.addEventListener('click', () => {
      if (shortcutsModal) shortcutsModal.classList.remove('hidden');
    });
  }
  if (closeShortcutsModal) {
    closeShortcutsModal.addEventListener('click', () => {
      if (shortcutsModal) shortcutsModal.classList.add('hidden');
    });
  }

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    if (e.key === '1') {
      switchTab('focus');
    } else if (e.key === '2') {
      switchTab('tasks');
    } else if (e.key === '3') {
      switchTab('toolbox');
    } else if (e.key === '4') {
      switchTab('habits');
    } else if (e.key === ' ') {
      e.preventDefault();
      window.focusModule.toggleTimer();
    } else if (e.key === 'z' || e.key === 'Z') {
      if (zenOverlay && !zenOverlay.classList.contains('hidden')) {
        closeZen();
      } else {
        openZen();
      }
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      switchTab('tasks');
      setTimeout(() => {
        const taskInput = document.getElementById('taskInputText');
        if (taskInput) taskInput.focus();
      }, 100);
    } else if (e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      const add250Btn = document.getElementById('addWater250');
      if (add250Btn) add250Btn.click();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      if (masterSoundToggle) masterSoundToggle.click();
    } else if (e.key === 'Escape') {
      closeZen();
      closeSettings();
      if (shortcutsModal) shortcutsModal.classList.add('hidden');
      const habitModal = document.getElementById('habitModal');
      if (habitModal) habitModal.classList.add('hidden');
    }
  });

  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
});
