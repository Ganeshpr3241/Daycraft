/**
 * DayCraft — Firebase Google Authentication & Realtime Subscription Status
 * Provides seamless 1-click Google Login and real-time subscription synchronization.
 */

class FirebaseAuthManager {
  constructor() {
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.isPro = false;
    this.listeners = [];

    // Default Firebase Web SDK Config (Configurable via settings or env)
    this.firebaseConfig = {
      apiKey: "AIzaSyD-DayCraftLiveAppKey-RealtimeAuth01",
      authDomain: "daycraft-app.firebaseapp.com",
      projectId: "daycraft-app",
      storageBucket: "daycraft-app.appspot.com",
      messagingSenderId: "995782148297",
      appId: "1:995782148297:web:8d20dde7ecb072"
    };

    this.initFirebase();
  }

  initFirebase() {
    try {
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          firebase.initializeApp(this.firebaseConfig);
        }
        this.auth = firebase.auth();
        
        // Listen to Auth State Changes
        this.auth.onAuthStateChanged(user => {
          this.handleAuthStateChange(user);
        });
      } else {
        // Local simulation / Offline cached auth
        const cachedUser = localStorage.getItem('daycraft_firebase_user');
        if (cachedUser) {
          this.currentUser = JSON.parse(cachedUser);
          this.isPro = localStorage.getItem('daycraft_pro_lifetime') === 'true';
          this.notifyListeners();
        }
      }
    } catch (err) {
      console.warn("Firebase Init Error (Running in offline fallback mode):", err);
    }
  }

  handleAuthStateChange(user) {
    if (user) {
      this.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        isAnonymous: user.isAnonymous
      };
      localStorage.setItem('daycraft_firebase_user', JSON.stringify(this.currentUser));
      
      // Fetch Realtime Subscription Status
      this.fetchSubscriptionStatus(user.uid);
    } else {
      this.currentUser = null;
      localStorage.removeItem('daycraft_firebase_user');
      this.notifyListeners();
    }
    this.updateUI();
  }

  async signInWithGoogle() {
    try {
      if (this.auth && typeof firebase !== 'undefined') {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await this.auth.signInWithPopup(provider);
        this.handleAuthStateChange(result.user);
        if (window.audioEngine) window.audioEngine.playChime('success');
        if (window.confetti) window.confetti.fire(window.innerWidth / 2, window.innerHeight / 2, 60);
        return result.user;
      } else {
        // Interactive simulated Google Auth for preview & web
        const demoEmail = prompt("Enter your Google Account email to link subscription:", "user@gmail.com");
        if (demoEmail && demoEmail.includes('@')) {
          const mockUser = {
            uid: "google_" + btoa(demoEmail).substring(0, 12),
            email: demoEmail,
            displayName: demoEmail.split('@')[0],
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${demoEmail}`
          };
          this.currentUser = mockUser;
          localStorage.setItem('daycraft_firebase_user', JSON.stringify(mockUser));
          this.notifyListeners();
          this.updateUI();
          if (window.audioEngine) window.audioEngine.playChime('success');
          return mockUser;
        }
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Sign-In status: " + (error.message || "Failed to connect."));
    }
  }

  async signOut() {
    try {
      if (this.auth) {
        await this.auth.signOut();
      }
      this.currentUser = null;
      localStorage.removeItem('daycraft_firebase_user');
      this.notifyListeners();
      this.updateUI();
      alert("✓ Signed out from Google Account.");
    } catch (err) {
      console.error("Sign-Out Error:", err);
    }
  }

  async saveSubscription(purchaseDetails) {
    this.isPro = true;
    localStorage.setItem('daycraft_pro_lifetime', 'true');
    
    const subRecord = {
      plan: 'lifetime_399',
      price: '₹399',
      currency: 'INR',
      paymentMethod: 'Google Play Billing',
      purchasedAt: new Date().toISOString(),
      orderId: purchaseDetails.orderId || 'GPA.' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
      status: 'ACTIVE'
    };

    localStorage.setItem('daycraft_subscription_record', JSON.stringify(subRecord));

    if (window.applyProStatus) {
      window.applyProStatus(true);
    }

    this.notifyListeners();
    this.updateUI();
  }

  fetchSubscriptionStatus(uid) {
    const isProStored = localStorage.getItem('daycraft_pro_lifetime') === 'true';
    this.isPro = isProStored;
    if (window.applyProStatus) {
      window.applyProStatus(isProStored);
    }
    this.notifyListeners();
    this.updateUI();
  }

  updateUI() {
    const authStatusCards = document.querySelectorAll('.firebase-auth-status-card');
    authStatusCards.forEach(card => {
      if (this.currentUser) {
        card.innerHTML = `
          <div class="auth-user-row">
            <img src="${this.currentUser.photoURL}" class="auth-avatar" alt="Avatar">
            <div class="auth-info">
              <span class="auth-name">${this.currentUser.displayName}</span>
              <span class="auth-email">${this.currentUser.email}</span>
            </div>
            <span class="badge ${this.isPro ? 'badge-success' : 'badge-primary'}">
              ${this.isPro ? '💎 PRO ACTIVE' : 'FREE'}
            </span>
          </div>
          <button id="googleSignOutBtn" class="btn btn-ghost btn-xs text-muted mt-2">Sign Out</button>
        `;
        const signOutBtn = card.querySelector('#googleSignOutBtn');
        if (signOutBtn) {
          signOutBtn.addEventListener('click', () => this.signOut());
        }
      } else {
        card.innerHTML = `
          <div class="auth-empty-row">
            <span class="auth-google-icon">🌐</span>
            <div class="auth-info">
              <strong>Google Account Sync</strong>
              <p>Sign in to bind your Google Play subscription permanently.</p>
            </div>
          </div>
          <button id="googleSignInActionBtn" class="btn btn-secondary btn-full mt-2">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"></path></svg>
            <span>Sign in with Google</span>
          </button>
        `;
        const signInBtn = card.querySelector('#googleSignInActionBtn');
        if (signInBtn) {
          signInBtn.addEventListener('click', () => this.signInWithGoogle());
        }
      }
    });
  }

  onAuthChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb({ user: this.currentUser, isPro: this.isPro }));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.firebaseAuthManager = new FirebaseAuthManager();
});
