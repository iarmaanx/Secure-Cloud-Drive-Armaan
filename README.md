
# 🔐 Secure Cloud Drive Prototype

*A local file-storage prototype with Google-verified sign-in and browser-side encryption.*
<p align="center">
  <img src="logo1.gif" width="180px" alt="Secure Cloud Drive Animated Logo"/>
</p>

---

## 🚀 What is this?

This prototype encrypts files in the browser before sending them to a local Express server. It uses Google OAuth for account sign-in and stores files on the server's local filesystem.

---

### 🧠 Core Idea

> Files use browser-side AES-GCM encryption. The current key is derived from the Google account ID, which is not secret; this is **not zero-knowledge encryption** and is not suitable for sensitive files.

---

## ✨ Features

| Feature                                    | Status |
| ------------------------------------------ | ------ |
| 🔐 Client-side AES-GCM encryption          | ✔      |
| ☁ Local filesystem storage (prototype)     | ✔      |
| 🔑 Google OAuth authentication             | ✔      |
| 🧍 Per-user isolated files                 | ✔      |
| 🖥 Modern dashboard UI (dark, glass theme) | ✔      |
| 📊 Storage bar visualization               | ✔      |
| 📁 Drag-and-Drop File Upload               | ✔      |
| 🗑 Delete files                            | ✔      |
| 🔐 Vault Lock/Unlock Security              | ✔      |
| 📜 Activity logs (optional server)         | ✔      |

---

## 🏗 Tech Used

| Layer         | Technology                       |
| ------------- | -------------------------------- |
| Frontend      | HTML, TailwindCSS, JavaScript    |
| Crypto        | WebCrypto API (AES-256-GCM)      |
| Storage       | Local filesystem                 |
| Auth          | Google Identity Services         |
| Extras        | Drag-Drop, Icons, Storage Chart  |

---

## 🔐 Security Architecture

```
Google Sign-In → Server verifies Google ID token → App session (memory only)
Client Browser → AES-GCM Encrypt → Express API → Local filesystem

```

Account tokens are held in server memory and expire after five minutes.
The server blocks direct static access to user records and stored files.
The account-ID-based file encryption key is not secret; this is not zero-knowledge.

---

## 🧭 User Flow

1. Sign in with Google
2. Upload → Encrypt in the browser → Store on the local server
4. Download → Decrypt Locally
5. Manage files from dashboard

---


### 🌐 Project Interface Preview

### 🖥 Dashboard UI  
<p align="center">
  <img src="UI Screenshot 2.png" width="90%" alt="Dashboard UI"/>
</p>

### 📊 Event & Activity Logs  
<p align="center">
  <img src="UI Screenshot 3.png" width="90%" alt="Logs UI"/>
</p>


---

## 📥 Setup Locally

Requires Node.js 18 or newer. Configure Google Identity Services before signing in:

1. Create a Web OAuth client in the [Google Cloud Console](https://console.cloud.google.com/).
2. Add `http://localhost:3000` to its authorized JavaScript origins.
3. Copy `.env.example` to `.env` and set `GOOGLE_CLIENT_ID` to that client ID.

```bash
git clone <repo-url>
cd repo-folder
npm install
npm start
```

Open `http://localhost:3000`. The first Google sign-in creates an account. Do not open `index.html` directly; the app requires its Express API.

Note: Google sign-in secures account authentication, but this prototype still derives its file-encryption key from the account ID. Do not store sensitive files until a separate secret vault key is implemented.

Existing username-based accounts and their files are not automatically migrated to Google accounts. Their encrypted files remain under the old local storage IDs and cannot be decrypted through Google sign-in.

## 🚀 Deploy on Render

1. Push the project to a GitHub repository and create a **Web Service** in Render connected to that repository.
2. Use `npm install` as the build command and `npm start` as the start command.
3. Add a persistent disk with mount path `/var/data`.
4. Add the environment variables `GOOGLE_CLIENT_ID` (your Google Web OAuth client ID) and `DATA_DIR=/var/data` in the Render service settings. Render supplies `PORT` automatically.
5. Deploy, then add the service's exact HTTPS origin (for example, `https://your-service.onrender.com`) to the OAuth client's **Authorized JavaScript origins** in Google Cloud Console.
6. If the OAuth consent screen is still in Testing, add your Google account as a test user.

Keep the service to one instance because active sessions are held in memory. The persistent disk stores account records and uploaded files; authentication sessions expire when the service restarts. This remains a prototype: its file-encryption key is derived from the account ID, so do not store sensitive files.

---

## 🧩 Future Improvements

| Idea                         | Potential                       |
| ---------------------------- | ------------------------------- |
| 🔗 Encrypted file sharing    | Send vault-safe files to others |
| ⏳ File Versioning            | Restore old file states         |
| 🔥 Desktop Sync (Electron)   | Like Google Drive but private   |
| 🔑 MFA Vault + Hardware Keys | Bullet-proof privacy            |

---

## ⭐ If you like this project…

Support by ⭐ starring the repo!

```

