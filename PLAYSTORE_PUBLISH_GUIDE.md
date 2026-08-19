# 🚀 DayCraft — Google Play Store Publishing Guide

This document contains all configurations, metadata, commands, and steps required to build and publish **DayCraft** to the **Google Play Store**.

---

## 1. 📱 App Package & Target Specifications

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **App Title** | `DayCraft: Focus & Daily OS` | Under 30 characters (Play Store limit) |
| **Package Name / Application ID** | `com.daycraft.app` | Unique identifier on Google Play |
| **Version Code** | `1` | Increment by 1 for each new update (1, 2, 3...) |
| **Version Name** | `1.0.0` | User-facing semantic version |
| **Target SDK** | `34` (Android 14) | **Required** by Google Play Console |
| **Min SDK** | `24` (Android 7.0) | Covers **99.2%+** of active Android devices |
| **App Category** | `Productivity / Lifestyle` | Recommended primary category |
| **Content Rating** | `Everyone / PEGI 3` | Zero violence, no user-to-user chat |

---

## 2. 🔑 Step 1: Generate a Production Signing Keystore

Run the following command in your terminal / PowerShell to generate your secure production release signing key:

```bash
keytool -genkey -v -keystore daycraft-release-key.jks -alias daycraft -keyalg RSA -keysize 2048 -validity 10000
```

> **⚠️ IMPORTANT:** Keep your `daycraft-release-key.jks` file and passwords safe! Google Play requires this exact key to sign all future app updates.

---

## 3. 📦 Step 2: Build the Android App Bundle (`.aab`)

Google Play Store requires the **Android App Bundle (`.aab`)** format for all new app releases.

### Option A: Using Gradle Command Line:
```bash
cd android
./gradlew bundleRelease
```
*Your signed `.aab` file will be generated at:*
`android/app/build/outputs/bundle/release/app-release.aab`

### Option B: Using Android Studio:
1. Open the `android` folder in **Android Studio**.
2. Click **Build** > **Generate Signed Bundle / APK...**
3. Select **Android App Bundle (`.aab`)**.
4. Choose your `daycraft-release-key.jks` file, enter passwords, and click **Finish**.

---

## 4. 📝 Google Play Console Listing Details (Ready to Copy)

### 🏷️ Short Description (Max 80 characters):
```text
Minimalist daily life OS for deep focus, Pomodoro, habit tracking, and wellness.
```

### 📖 Full Description (Optimized for Play Store SEO):
```text
DayCraft is your minimalist, privacy-first Everyday Life OS designed to eliminate digital noise, cultivate relentless daily focus, and build compounding habits.

Whether you're studying for exams, deep working on code, or structuring your daily routines, DayCraft equips you with powerful productivity instruments in a clean, distraction-free interface.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 FOCUS STUDIO & ZEN COCKPIT
• Science-backed Pomodoro & Flow timers (25m, 50m, Custom min/sec).
• Distraction-free Fullscreen Zen Mode with live session progress tracking.
• Lock-screen timer notifications and background execution.
• Loud, reliable completion alarm with one-tap instant dismissal.

🎧 AMBIENT SOUNDSCAPES & SLEEP TIMER
• Procedural binaural audio synthesizers: Deep Rain, Cafe Ambience, Forest Sanctuary, Ocean Waves, and 432Hz Alpha Waves.
• Continuous non-stop background playback with automatic sleep timer fade-outs.

💧 HYDRATION & 20-20-20 WELLNESS
• Customizable daily water targets and one-tap quick sip logging.
• Fullscreen 20-20-20 Eye Break relaxation timer to prevent screen fatigue.

⚡ DAILY GOALS & HABIT TRACKER
• Morning Kickoff popup to establish your #1 highest leverage daily priority.
• Re-use past goals with one tap.
• Streak tracking and weekly consistency pulse analytics.

🔒 100% PRIVATE & OFFLINE
• Zero ads. Zero trackers. Zero cloud logins.
• All your data remains strictly on your device's local storage.

Master the morning. Win the day with DayCraft.
```

---

## 5. 🛡️ Privacy Policy URL Statement (Required by Google Play)

Since **DayCraft is 100% offline and collects zero personal data**, your privacy policy is very simple:

> *"DayCraft does not collect, store, transmit, or share any personal user data, analytics, or device identifiers. All user notes, tasks, wellness metrics, and timer histories remain strictly on the local storage of the user's device."*

---

## 6. 🖼️ Store Graphics & Screenshots Checklist

| Graphic Asset | Dimensions | Status |
| :--- | :--- | :--- |
| **App Icon** | `512 x 512 px` (PNG) | ✅ Generated & saved at `assets/logo.png` |
| **Feature Graphic** | `1024 x 500 px` (JPG/PNG) | Recommended banner for top of Play Store listing |
| **Phone Screenshots** | Min 2 screenshots (1080x1920 or 1080x2400) | Capture Focus Studio, Zen Mode, Hydration & Tasks |
