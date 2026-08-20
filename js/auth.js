/**
 * Android App — Google Sign-In Authentication Manager
 */

class GoogleAuthManager {
  constructor() {
    this.STORAGE_KEY = 'nexus_android_auth_user';
    this.currentUser = this.loadSavedUser();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateUI();
  }

  loadSavedUser() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  }

  bindEvents() {
    const googleBtn = document.getElementById('googleSignInBtn');
    const signOutBtn = document.getElementById('signOutBtn');

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        this.triggerGoogleSignIn();
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        this.signOut();
      });
    }
  }

  triggerGoogleSignIn() {
    // 1. If Firebase Auth is available, trigger popup
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then(result => {
          this.setUser({
            name: result.user.displayName,
            email: result.user.email,
            photoUrl: result.user.photoURL,
            uid: result.user.uid
          });
        })
        .catch(err => {
          console.warn("Firebase Auth Error, launching interactive sign-in:", err);
          this.promptInteractiveSignIn();
        });
    } else {
      // 2. Interactive native simulation
      this.promptInteractiveSignIn();
    }
  }

  promptInteractiveSignIn() {
    const email = prompt("Enter your Google Account email:", "user@gmail.com");
    if (email && email.includes("@")) {
      const name = email.split("@")[0];
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      
      this.setUser({
        name: formattedName,
        email: email,
        photoUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
        uid: "g_" + Math.random().toString(36).substring(2, 10)
      });
    }
  }

  setUser(user) {
    this.currentUser = user;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (e) {}
    this.updateUI();
  }

  signOut() {
    this.currentUser = null;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
    this.updateUI();
  }

  updateUI() {
    const loginSection = document.getElementById('authLoginSection');
    const dashboardSection = document.getElementById('authenticatedDashboard');
    const avatarEl = document.getElementById('userAvatarImg');
    const nameEl = document.getElementById('userDisplayName');
    const emailEl = document.getElementById('userEmailText');

    if (this.currentUser) {
      if (loginSection) loginSection.style.display = 'none';
      if (dashboardSection) dashboardSection.classList.add('active');
      if (avatarEl) avatarEl.src = this.currentUser.photoUrl;
      if (nameEl) nameEl.textContent = this.currentUser.name;
      if (emailEl) emailEl.textContent = this.currentUser.email;
    } else {
      if (loginSection) loginSection.style.display = 'flex';
      if (dashboardSection) dashboardSection.classList.remove('active');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.googleAuth = new GoogleAuthManager();
  });
} else {
  window.googleAuth = new GoogleAuthManager();
}
