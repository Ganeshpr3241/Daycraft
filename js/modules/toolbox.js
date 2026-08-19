/**
 * DAYCRAFT — MODULE: EVERYDAY MULTI-TOOLBOX
 * Combines Scratchpad, Daily Spend Logger, and Fast Tip/Split Calculator.
 */

class ToolboxModule {
  constructor() {
    // Tabs
    this.toolboxTabs = document.querySelectorAll('.toolbox-tab');
    this.toolboxPanels = document.querySelectorAll('.toolbox-panel');

    // Scratchpad elements
    this.scratchpadArea = document.getElementById('scratchpadArea');
    this.scratchStats = document.getElementById('scratchStats');
    this.copyScratchBtn = document.getElementById('copyScratchBtn');
    this.clearScratchBtn = document.getElementById('clearScratchBtn');

    // Expense elements
    this.addExpenseForm = document.getElementById('addExpenseForm');
    this.expenseDescInput = document.getElementById('expenseDescInput');
    this.expenseAmountInput = document.getElementById('expenseAmountInput');
    this.expenseCatSelect = document.getElementById('expenseCatSelect');
    this.spentTodayVal = document.getElementById('spentTodayVal');
    this.dailyBudgetVal = document.getElementById('dailyBudgetVal');
    this.remainingBudgetVal = document.getElementById('remainingBudgetVal');
    this.expenseBarFill = document.getElementById('expenseBarFill');
    this.expenseList = document.getElementById('expenseList');

    // Calculator elements
    this.calcBillAmount = document.getElementById('calcBillAmount');
    this.tipButtons = document.querySelectorAll('.tip-btn');
    this.splitMinus = document.getElementById('splitMinus');
    this.splitPlus = document.getElementById('splitPlus');
    this.splitCount = document.getElementById('splitCount');
    this.resTipTotal = document.getElementById('resTipTotal');
    this.resTotalBill = document.getElementById('resTotalBill');
    this.resPerPerson = document.getElementById('resPerPerson');

    this.selectedTip = 15;
    this.numPeople = 1;

    this.init();
  }

  init() {
    this.setupTabs();
    this.setupScratchpad();
    this.setupExpenses();
    this.setupCalculator();

    window.store.subscribe((state) => {
      this.renderScratchpad(state.scratchpad);
      this.renderExpenses(state.expenses);
    });
  }

  setupTabs() {
    this.toolboxTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.toolboxTabs.forEach(t => t.classList.remove('active'));
        this.toolboxPanels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPanel = document.getElementById(`panel${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  // --- SCRATCHPAD ---
  setupScratchpad() {
    if (!this.scratchpadArea) return;

    this.scratchpadArea.addEventListener('input', () => {
      const text = this.scratchpadArea.value;
      window.store.update(state => {
        state.scratchpad = text;
      });
      this.updateScratchStats(text);
    });

    if (this.copyScratchBtn) {
      this.copyScratchBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(this.scratchpadArea.value).then(() => {
          this.copyScratchBtn.textContent = "Copied! ✓";
          setTimeout(() => { this.copyScratchBtn.textContent = "Copy"; }, 1500);
        });
      });
    }

    if (this.clearScratchBtn) {
      this.clearScratchBtn.addEventListener('click', () => {
        if (confirm("Clear all scratchpad notes?")) {
          this.scratchpadArea.value = "";
          window.store.update(state => { state.scratchpad = ""; });
          this.updateScratchStats("");
        }
      });
    }
  }

  updateScratchStats(text) {
    if (!this.scratchStats) return;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    this.scratchStats.textContent = `${words} words (${chars} chars) | Auto-saved`;
  }

  renderScratchpad(text = "") {
    if (this.scratchpadArea && this.scratchpadArea.value !== text) {
      this.scratchpadArea.value = text;
      this.updateScratchStats(text);
    }
  }

  // --- DAILY EXPENSES ---
  setupExpenses() {
    if (!this.addExpenseForm) return;

    this.addExpenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const desc = this.expenseDescInput.value.trim();
      const amount = parseFloat(this.expenseAmountInput.value);
      const category = this.expenseCatSelect.value;

      if (!desc || isNaN(amount) || amount <= 0) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newExpense = {
        id: `e_${Date.now()}`,
        desc,
        amount,
        category,
        time: timeStr
      };

      window.store.update(state => {
        if (!state.expenses) state.expenses = { dailyBudget: 40, items: [] };
        state.expenses.items.unshift(newExpense);
      });

      this.expenseDescInput.value = "";
      this.expenseAmountInput.value = "";
      window.audioEngine.playChime('success');
    });
  }

  deleteExpense(expenseId) {
    window.store.update(state => {
      state.expenses.items = state.expenses.items.filter(e => e.id !== expenseId);
    });
  }

  renderExpenses(expenses = { dailyBudget: 40, items: [] }) {
    const items = expenses.items || [];
    const budget = expenses.dailyBudget || 40;
    const spent = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const remaining = budget - spent;
    const percent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

    if (this.spentTodayVal) this.spentTodayVal.textContent = `$${spent.toFixed(2)}`;
    if (this.dailyBudgetVal) this.dailyBudgetVal.textContent = `$${budget.toFixed(2)}`;
    if (this.remainingBudgetVal) {
      this.remainingBudgetVal.textContent = `$${remaining.toFixed(2)}`;
      this.remainingBudgetVal.style.color = remaining >= 0 ? 'var(--emerald)' : 'var(--coral)';
    }

    if (this.expenseBarFill) {
      this.expenseBarFill.style.width = `${percent}%`;
    }

    if (this.expenseList) {
      if (items.length === 0) {
        this.expenseList.innerHTML = `<li style="font-size:0.75rem; color:var(--text-dim); text-align:center; padding:0.5rem 0;">No expenses logged today</li>`;
        return;
      }

      this.expenseList.innerHTML = items.map(item => `
        <li class="expense-item">
          <span>${this.escapeHTML(item.desc)} <small style="color:var(--text-dim)">(${item.category})</small></span>
          <div>
            <span class="exp-amount">$${parseFloat(item.amount).toFixed(2)}</span>
            <button class="task-delete-btn delete-exp-btn" data-id="${item.id}" style="margin-left: 0.4rem;" title="Delete">✕</button>
          </div>
        </li>
      `).join('');

      this.expenseList.querySelectorAll('.delete-exp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.deleteExpense(btn.dataset.id);
        });
      });
    }
  }

  // --- TIP & BILL SPLITTER ---
  setupCalculator() {
    this.tipButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tipButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedTip = parseFloat(btn.dataset.tip);
        this.recalculateSplit();
      });
    });

    if (this.splitMinus) {
      this.splitMinus.addEventListener('click', () => {
        if (this.numPeople > 1) {
          this.numPeople--;
          if (this.splitCount) this.splitCount.textContent = `${this.numPeople} Person${this.numPeople > 1 ? 's' : ''}`;
          this.recalculateSplit();
        }
      });
    }

    if (this.splitPlus) {
      this.splitPlus.addEventListener('click', () => {
        this.numPeople++;
        if (this.splitCount) this.splitCount.textContent = `${this.numPeople} Persons`;
        this.recalculateSplit();
      });
    }

    if (this.calcBillAmount) {
      this.calcBillAmount.addEventListener('input', () => this.recalculateSplit());
    }
  }

  recalculateSplit() {
    const bill = parseFloat(this.calcBillAmount.value) || 0;
    const tip = (bill * this.selectedTip) / 100;
    const total = bill + tip;
    const perPerson = this.numPeople > 0 ? total / this.numPeople : total;

    if (this.resTipTotal) this.resTipTotal.textContent = `$${tip.toFixed(2)}`;
    if (this.resTotalBill) this.resTotalBill.textContent = `$${total.toFixed(2)}`;
    if (this.resPerPerson) this.resPerPerson.textContent = `$${perPerson.toFixed(2)}`;
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

window.toolboxModule = new ToolboxModule();
