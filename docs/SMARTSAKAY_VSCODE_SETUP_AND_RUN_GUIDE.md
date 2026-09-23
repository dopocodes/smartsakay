# SmartSakay Dagupan — Complete VS Code Setup & Run Guide
**A Step-by-Step Operator & Developer Manual for Running the Fullstack Transit Platform**

---

## 📌 1. Project Overview & Quick Reference

**SmartSakay Dagupan** is an intelligent, multi-tier commuter transit platform designed for Dagupan City and Pangasinan corridors. The repository is organized as a three-tier modular monolith:

| Component | Technology Stack | Default Port | Local URL / Access |
|---|---|---|---|
| **Backend REST API** | Node.js (v18+) + Express 5 + Mongoose | `5000` | `http://localhost:5000/api/health` |
| **Admin Web Dashboard** | React 18 + Vite SPA | `3001` | `http://localhost:3001` |
| **Mobile Commuter App** | React Native + Expo SDK 57 | `8081` | Web: `http://localhost:8081`<br>Mobile: Expo Go App |
| **Database** | MongoDB (Community or Atlas) | `27017` | `mongodb://localhost:27017/smartsakay` |

### Default Credentials (Pre-seeded)
- **Role:** System Administrator
- **Email:** `admin@smartsakay.com`
- **Password:** `Admin@12345`
- **Commuter Mobile Access:** Click **"Continue as Guest"** for instant access without registration, or log in with the Administrator account.

---

## 💻 2. System Prerequisites

Before starting, ensure the following software is installed on the host computer:

1. **Node.js (LTS Version 18.x, 20.x, or 22.x)**
   - Download: [https://nodejs.org/](https://nodejs.org/)
   - Verify in terminal:
     ```bash
     node -v
     npm -v
     ```
2. **Visual Studio Code (VS Code)**
   - Download: [https://code.visualstudio.com/](https://code.visualstudio.com/)
3. **MongoDB Database Engine**
   - **Option A (Recommended for Local Dev):** Install **MongoDB Community Server** and **MongoDB Compass**:
     [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
     *Ensure the MongoDB Windows Service is running (`services.msc` -> MongoDB Server).*
   - **Option B (Cloud / Zero Local Install):** Create a free **MongoDB Atlas M0** cluster at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and copy the connection string URI.
4. **Modern Web Browser:** Google Chrome, Microsoft Edge, or Mozilla Firefox.
5. **(Optional for Mobile Testing on Phone):** **Expo Go** app on Android (Google Play) or iOS (App Store). Both phone and PC must be connected to the same Wi-Fi network.

---

## 🚀 3. Step-by-Step Execution Guide

### Step 1: Extract the ZIP & Open in VS Code
1. Right-click the received `.zip` file and select **Extract All...** to a clean directory (e.g., `C:\Projects\smartsakay-dagupan`).
2. *Note:* Make sure you do not have double-nested folders (e.g., `smartsakay-dagupan/smartsakay-dagupan`). You should see `server`, `admin`, `mobile`, and `package.json` directly in the root.
3. Open **VS Code**.
4. Click **File** > **Open Folder...** (or press `Ctrl + K, Ctrl + O`).
5. Select the extracted root project folder (`smartsakay dagupan`).

---

### Step 2: Configure VS Code Terminal & Permissions
1. Open the Integrated Terminal in VS Code by pressing `` Ctrl + ` `` (backtick) or clicking **Terminal** > **New Terminal**.
2. **Windows PowerShell Execution Policy Fix (Crucial):**
   Windows often disables running npm scripts in PowerShell by default. If you see an error like `cannot be loaded because running scripts is disabled on this system`, run this command in PowerShell once:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
   *(Alternatively, you can switch the VS Code default terminal to **Command Prompt (cmd)** or **Git Bash**).*

---

### Step 3: Configure Environment Variables (`server/.env`)
Because `.env` files are ignored by git/zip archives for security, you must make sure `server/.env` exists.

1. In VS Code file explorer, expand the `server` folder.
2. Check if `.env` exists. If not, copy `.env.example` and name the new file `.env`:
   - *Windows Command:*
     ```powershell
     Copy-Item -Path "server\.env.example" -Destination "server\.env"
     ```
   - *Or manually:* Right-click `server/.env.example` in VS Code -> Copy -> Paste -> Rename to `.env`.
3. Open `server/.env` and verify the settings:
   ```env
   # Server
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/smartsakay

   # JWT Security
   JWT_SECRET=your-jwt-secret-min-256-bits-super-secure
   JWT_REFRESH_SECRET=your-jwt-refresh-secret-min-256-bits-super-secure

   # Email (Required only if sending real OTPs for new mobile registrations)
   GMAIL_USER=smartsakaydagupan@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password

   # Admin Defaults
   ADMIN_EMAIL=admin@smartsakay.com
   ADMIN_DEFAULT_PASSWORD=Admin@12345
   ```
   > **MongoDB Atlas Note:** If using MongoDB Atlas instead of local MongoDB, replace `MONGODB_URI` with your Atlas URI:
   > `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smartsakay?retryWrites=true&w=majority`

---

### Step 4: Install Dependencies Across All 3 Subprojects
> **⚠️ COMMON PITFALL:** Running `npm install` in the root folder alone is not enough because dependencies are segregated into `server/`, `admin/`, and `mobile/`.

Run the following commands in the VS Code terminal:

```bash
# 1. Install Backend dependencies
cd server
npm install

# 2. Install Admin Web dependencies
cd ../admin
npm install

# 3. Install Mobile App dependencies
cd ../mobile
npm install

# Return to root
cd ..
```

*Or run this single one-line command from the root directory:*
```powershell
npm --prefix server install; npm --prefix admin install; npm --prefix mobile install
```

---

### Step 5: Start MongoDB & Seed Default Data
1. Ensure your MongoDB service is running (if using local MongoDB).
2. Seed the initial admin account, official LTFRB fare rates, and Dagupan routes into the database:
   ```bash
   cd server
   npm run seed
   ```
3. You will see terminal output confirming:
   - `Admin created: admin@smartsakay.com`
   - `Seeded 2 fare records.`
   - `Seeded 5 routes.`
   - `Generated 10 fare matrix entries.`
   - `=== Seed completed successfully! ===`

---

### Step 6: Verify Backend with Automated Tests
Before starting the servers, run the automated test suite to verify system integrity:
```bash
cd server
npm test
```
*The test suite uses an in-memory database (`mongodb-memory-server`) to test authentication, fare calculations, route queries, and security rate limiters. All test suites should report **PASS**.*

---

### Step 7: Launch the Fullstack Services (The 3-Terminal Setup)

In VS Code, create **3 separate terminal panes** (Click the `+` icon or press `Ctrl + Shift + 5` to split):

#### Terminal 1 — Backend API Server:
```bash
cd server
npm run dev
```
- Server starts on **`http://localhost:5000`** with live auto-reload (nodemon).
- Test in your browser: Open `http://localhost:5000/api/health`.
- Expected response:
  ```json
  {"success":true,"message":"SmartSakay Dagupan API is running"}
  ```

#### Terminal 2 — Admin Web Dashboard:
```bash
cd admin
npm run dev
```
- Vite starts the frontend development server on **`http://localhost:3001`**.
- Open `http://localhost:3001` in your browser.
- Log in using the seeded credentials:
  - **Email:** `admin@smartsakay.com`
  - **Password:** `Admin@12345`
- You can now manage fare rates, view live routes, review commuter complaints, and manage users.

#### Terminal 3 — Mobile Commuter App:
```bash
cd mobile
npm start
```
This launches the **Expo Metro Bundler**. You have two great ways to interact with the mobile app:

##### Option A: Web Browser Mode (Fastest & Easiest — Zero Phone Setup)
- In Terminal 3 where Expo is running, press the **`w`** key on your keyboard.
- Expo will bundle and automatically open **`http://localhost:8081`** in your default web browser.
- The app renders fully responsively with interactive route lists, fare calculators, weather advisories, and the AI assistant!

##### Option B: On a Physical Smartphone (iOS / Android)
1. Install the free **Expo Go** app from the Google Play Store or Apple App Store.
2. Ensure your phone and your computer are connected to the **exact same Wi-Fi network**.
3. Scan the QR code displayed in your terminal using:
   - **Android:** Open the Expo Go app and tap "Scan QR code".
   - **iOS:** Open the native Camera app and tap the Expo notification banner.
4. **Wi-Fi / IP Address Note:**
   If the mobile app on your phone shows "Network Error" when calling the backend, open `mobile/src/utils/constants.js`. Ensure your computer's local Wi-Fi IP (e.g. `192.168.1.xxx` obtained via `ipconfig` in cmd) matches the backend URL, and ensure Windows Firewall permits inbound connections on port 5000.

---

## 🛠️ 4. Recommended VS Code Extensions

For the best developer experience, install these extensions from the VS Code Extensions Marketplace (`Ctrl + Shift + X`):

1. **MongoDB for VS Code** (`mongodb.mongodb-vscode`): Connect to `mongodb://localhost:27017` to inspect collections, documents, and indexes visually inside VS Code.
2. **Thunder Client** (`rangav.vscode-thunder-client`): Lightweight REST API client (alternative to Postman) built directly into VS Code to test endpoints.
3. **Prettier - Code formatter** (`esbenp.prettier-vscode`): Keeps code formatting clean and consistent.
4. **ESLint** (`dbaeumer.vscode-eslint`): Identifies potential JavaScript/React errors as you code.
5. **Expo Tools** (`expo.vscode-expo-tools`): Autocomplete and config debugging for Expo projects.

---

## ❓ 5. Troubleshooting & FAQ

### Issue 1: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`
- **Cause:** Local MongoDB service is not running.
- **Solution:**
  - Press `Win + R`, type `services.msc`, locate **MongoDB Server**, right-click and select **Start**.
  - Or in an Administrator Command Prompt, run:
    ```cmd
    net start MongoDB
    ```
  - Alternatively, switch `MONGODB_URI` in `server/.env` to a free MongoDB Atlas cloud URI.

---

### Issue 2: `nodemon : File ... cannot be loaded because running scripts is disabled on this system`
- **Cause:** Windows PowerShell execution policy restricts running downloaded scripts.
- **Solution:** Run this command once in PowerShell:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```
  Or change your default VS Code terminal profile to `Command Prompt` (cmd).

---

### Issue 3: `Error: Cannot find module 'express'` or `'nodemon' is not recognized`
- **Cause:** Dependencies were not installed in the `server` directory, or commands were run from the root folder instead of the `server/` subfolder.
- **Solution:**
  ```bash
  cd server
  npm install
  npm run dev
  ```

---

### Issue 4: Port Collision: `Error: listen EADDRINUSE: address already in use :::5000` (or `:::3001`)
- **Cause:** A previous instance of Node or another app is already using that port.
- **Solution:** Find and terminate the process holding the port:
  - *PowerShell:*
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
    ```
  - *Or Command Prompt:*
    ```cmd
    netstat -ano | findstr :5000
    taskkill /PID <PID_NUMBER> /F
    ```

---

### Issue 5: Mobile App on Phone shows `Network Error` when communicating with Backend
- **Cause:**
  1. Your phone and computer are on different Wi-Fi networks (or phone is on mobile data).
  2. Windows Defender Firewall is blocking inbound connections to port 5000.
  3. The local IP address changed.
- **Solution:**
  1. Connect both PC and phone to the same Wi-Fi.
  2. Run `ipconfig` in Command Prompt to find your PC's `IPv4 Address` (e.g. `192.168.1.15`).
  3. Open `mobile/src/utils/constants.js` and verify `DEV_IP` or replace with your exact PC IP.
  4. Allow Node.js through Windows Defender Firewall when prompted.

---

### Issue 6: Mobile Registration OTP Code is not sending to email
- **Cause:** `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `server/.env` are not configured or using invalid credentials.
- **Solution:**
  - **Quickest Solution:** Click **"Continue as Guest"** on the mobile welcome screen, or log in with the pre-seeded admin account (`admin@smartsakay.com` / `Admin@12345`).
  - **To configure real Gmail dispatch:** Generate a 16-character Google App Password under *Google Account > Security > 2-Step Verification > App Passwords*, and paste it into `GMAIL_APP_PASSWORD` in `server/.env`.

---

### Issue 7: Expo Metro Bundler cache is stuck or failing
- **Solution:** Clear Expo cache and restart:
  ```bash
  cd mobile
  npx expo start -c
  ```

---

## 📋 6. Complete Operator Checklist

Before handing off or demonstrating the system, verify this 8-point checklist:

- [ ] **Node.js LTS (v18+)** verified (`node -v`).
- [ ] **MongoDB** is running locally or Atlas URI is active.
- [ ] `server/.env` exists with valid configuration.
- [ ] `npm install` completed inside `server/`, `admin/`, and `mobile/`.
- [ ] `npm run seed` in `server/` succeeded with 0 errors.
- [ ] `npm test` in `server/` shows passing test suites.
- [ ] Backend is running (`http://localhost:5000/api/health` returns `success: true`).
- [ ] Admin dashboard is accessible at `http://localhost:3001` with admin login working.
- [ ] Mobile app is running in browser (`http://localhost:8081`) or via Expo Go.
