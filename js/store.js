/**
 * DAYCRAFT — REACTIVE STATE STORE & LOCALSTORAGE PERSISTENCE
 * Handles automatic day-rollover, daily goal kickoff tracking, and offline data sync.
 */

class DayCraftStore {
  constructor() {
    this.STORAGE_KEY = 'daycraft_os_data_v1';
    this.listeners = [];
    this.state = this.loadInitialState();
    this.checkDateRollover();
  }

  getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  getDefaultState() {
    const today = this.getTodayString();
    return {
      lastDate: today,
      priority: {
        text: "",
        completed: false,
        setForDate: ""
      },
      tasks: [
        { id: "t_1", text: "Morning review & setup daily priorities", priority: "high", category: "work", estimate: "15m", completed: true, createdAt: Date.now() - 3600000 },
        { id: "t_2", text: "Deep focus session on key deliverables", priority: "high", category: "work", estimate: "50m", completed: false, createdAt: Date.now() - 3000000 },
        { id: "t_3", text: "Hydrate and take 10-minute stretch walk", priority: "medium", category: "health", estimate: "10m", completed: false, createdAt: Date.now() - 2000000 }
      ],
      water: {
        current: 750,
        goal: 2500
      },
      focus: {
        sessionsCompleted: 1,
        totalMinutes: 25,
        targetSessions: 4
      },
      soundscape: {
        rain: 0,
        cafe: 0,
        forest: 0,
        ocean: 0,
        binaural: 0,
        masterMuted: false
      },
      scratchpad: "# Daily Scratchpad & Quick Notes\n- Instant auto-save enabled\n- Paste temporary links or ideas here",
      expenses: {
        dailyBudget: 40,
        items: [
          { id: "e_1", desc: "Morning Artisan Roast", amount: 4.50, category: "coffee", time: "08:45 AM" },
          { id: "e_2", desc: "Healthy Salad & Protein Bowl", amount: 14.20, category: "food", time: "12:30 PM" }
        ]
      },
      habits: [
        { id: "h_1", name: "30-min Morning Movement", emoji: "🏃", category: "health", streak: 5, completedToday: true, lastCompleted: today },
        { id: "h_2", name: "Read 10 Pages of Non-Fiction", emoji: "📚", category: "mind", streak: 12, completedToday: false, lastCompleted: "" },
        { id: "h_3", name: "5-min Mindful Breathing", emoji: "🧘", category: "lifestyle", streak: 3, completedToday: true, lastCompleted: today },
        { id: "h_4", name: "Daily Multivitamin & Omega-3", emoji: "💊", category: "health", streak: 18, completedToday: false, lastCompleted: "" }
      ],
      mood: {
        selected: "happy",
        emoji: "⚡",
        energy: 80,
        loggedToday: true
      },
      reflection: {
        rating: 5,
        win: "Shipped core modules ahead of schedule",
        grateful: "Good health and energized morning focus",
        improve: "Remember to stretch more frequently",
        savedToday: true
      },
      weeklyPulse: {
        Mon: 85, Tue: 90, Wed: 75, Thu: 95, Fri: 80, Sat: 70, Sun: 85
      },
      settings: {
        eyeBreakAlert: true,
        pomoDuration: 25
      },
      goalHistory: []
    };
  }

  loadInitialState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const defaultState = this.getDefaultState();
        
        // Normalize priority
        let normalizedPriority = defaultState.priority;
        if (typeof parsed.priority === 'string') {
          normalizedPriority = { text: parsed.priority, completed: false, setForDate: parsed.lastDate || '' };
        } else if (parsed.priority && typeof parsed.priority === 'object') {
          normalizedPriority = {
            text: parsed.priority.text || '',
            completed: !!parsed.priority.completed,
            setForDate: parsed.priority.setForDate || ''
          };
        }

        return {
          ...defaultState,
          ...parsed,
          priority: normalizedPriority
        };
      }
    } catch (e) {
      console.warn("Failed to load stored state, initializing default state.", e);
    }
    return this.getDefaultState();
  }

  checkDateRollover() {
    const today = this.getTodayString();
    if (this.state.lastDate !== today) {
      console.log(`New day detected (${today}). Rolling over daily tracking.`);
      // Archive yesterday's pulse
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const yesterdayDayName = days[new Date(Date.now() - 86400000).getDay()];
      
      const totalTasks = this.state.tasks.length;
      const completedTasks = this.state.tasks.filter(t => t.completed).length;
      const taskScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 75;
      
      if (!this.state.weeklyPulse) this.state.weeklyPulse = {};
      this.state.weeklyPulse[yesterdayDayName] = taskScore;

      // Reset daily transient metrics
      this.state.lastDate = today;
      this.state.priority.setForDate = ""; // Prompt kickoff for new day
      this.state.water.current = 0;
      this.state.focus.sessionsCompleted = 0;
      this.state.expenses.items = [];
      this.state.mood.loggedToday = false;
      this.state.reflection.savedToday = false;
      this.state.reflection.win = "";
      this.state.reflection.grateful = "";
      this.state.reflection.improve = "";

      // Reset habit daily checkmarks while maintaining streaks
      this.state.habits.forEach(h => {
        h.completedToday = false;
      });

      // Clear completed tasks or keep pending
      this.state.tasks = this.state.tasks.filter(t => !t.completed);

      this.saveState();
    }
  }

  getState() {
    return this.state;
  }

  update(mutationFn) {
    mutationFn(this.state);
    this.saveState();
    this.notify();
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    // Initial trigger
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (e) {
        console.error("Error executing store subscriber", e);
      }
    });
  }

  exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `DayCraft_Backup_${this.getTodayString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this.state = { ...this.getDefaultState(), ...parsed };
        this.saveState();
        this.notify();
        return true;
      }
    } catch (e) {
      console.error("Failed to parse backup JSON", e);
    }
    return false;
  }

  resetAllData() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.state = this.getDefaultState();
    this.saveState();
    this.notify();
  }
}

// Global Store Instance
window.store = new DayCraftStore();
