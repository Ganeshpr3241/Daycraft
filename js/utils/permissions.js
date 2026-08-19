/**
 * DAYCRAFT — PERMISSIONS, NOTIFICATIONS, WAKELOCK & HAPTICS MANAGER
 * Handles graceful in-app permission banners, push notifications, screen wakelock, and vibrations.
 */

class DayCraftPermissionsManager {
  constructor() {
    this.wakeLockSentinel = null;
    this.notificationGranted = false;
    this.banner = document.getElementById('permissionBanner');
    this.bannerTitle = document.getElementById('permBannerTitle');
    this.bannerDesc = document.getElementById('permBannerDesc');
    this.bannerAllowBtn = document.getElementById('permBannerAllow');
    this.bannerDismissBtn = document.getElementById('permBannerDismiss');

    this.init();
  }

  init() {
    // Check existing Notification permission
    if ('Notification' in window) {
      this.notificationGranted = Notification.permission === 'granted';
    }

    this.setupBannerListeners();

    // Auto-reacquire wake lock on tab visibility change if timer is active
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && window.focusModule && window.focusModule.isRunning) {
        await this.requestWakeLock();
      }
    });

    // If permission is default and user hasn't dismissed it previously in session, show banner after 2s
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'default' && !sessionStorage.getItem('daycraft_perm_dismissed')) {
        this.showPermissionPrompt("Welcome to DayCraft", "Enable alerts for completed focus timers, breaks, and wellness reminders.");
      }
    }, 2000);
  }

  setupBannerListeners() {
    if (this.bannerAllowBtn) {
      this.bannerAllowBtn.addEventListener('click', async () => {
        const granted = await this.requestNotificationPermission();
        this.hidePermissionPrompt();
        if (granted) {
          this.vibrate([60]);
        }
      });
    }

    if (this.bannerDismissBtn) {
      this.bannerDismissBtn.addEventListener('click', () => {
        this.hidePermissionPrompt();
        sessionStorage.setItem('daycraft_perm_dismissed', 'true');
      });
    }
  }

  /**
   * Display the In-App Permission Request Banner
   */
  showPermissionPrompt(title = "Enable Notifications", desc = "Get alerts for completed focus timers and wellness breaks.") {
    if (!('Notification' in window) || Notification.permission !== 'default') {
      return;
    }

    if (this.bannerTitle) this.bannerTitle.textContent = title;
    if (this.bannerDesc) this.bannerDesc.textContent = desc;
    if (this.banner) this.banner.classList.remove('hidden');
  }

  /**
   * Hide the In-App Permission Request Banner
   */
  hidePermissionPrompt() {
    if (this.banner) this.banner.classList.add('hidden');
  }

  /**
   * Request push notification permission natively from the browser
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn("Notifications not supported in this environment.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.notificationGranted = permission === 'granted';
      
      const enableBtn = document.getElementById('enableNotificationsBtn');
      if (enableBtn) {
        if (this.notificationGranted) {
          enableBtn.textContent = "✓ Push Notifications Active";
          enableBtn.style.color = "var(--success)";
        } else {
          enableBtn.textContent = "⚠️ Permission Blocked";
        }
      }

      if (this.notificationGranted) {
        this.sendNotification("DayCraft Notifications Active", {
          body: "You will now receive sound & popup alerts when your focus sessions finish and when it's time for wellness breaks.",
          tag: "daycraft-welcome"
        });
      }
      return this.notificationGranted;
    } catch (e) {
      console.error("Error requesting notification permission:", e);
      return false;
    }
  }

  /**
   * Trigger a system popup notification (Desktop & Android)
   */
  sendNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const defaultOptions = {
      badge: "assets/icon-192.png",
      icon: "assets/icon-192.png",
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false
    };

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, { ...defaultOptions, ...options });
        });
      } else {
        new Notification(title, { ...defaultOptions, ...options });
      }
    } catch (e) {
      console.warn("Notification trigger failed:", e);
    }
  }

  /**
   * Haptic vibration feedback for Android touch devices
   */
  vibrate(pattern = [60, 40, 60]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  /**
   * Screen WakeLock API: Prevents Android and Laptop screens from dimming/sleeping during focus
   */
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        console.log("DayCraft: Screen WakeLock active.");
      } catch (err) {
        console.warn(`DayCraft: WakeLock error: ${err.name}, ${err.message}`);
      }
    }
  }

  /**
   * Release Screen WakeLock
   */
  async releaseWakeLock() {
    if (this.wakeLockSentinel !== null) {
      try {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
        console.log("DayCraft: Screen WakeLock released.");
      } catch (err) {
        console.warn("DayCraft: Failed to release WakeLock:", err);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.permissionsManager = new DayCraftPermissionsManager();
});
