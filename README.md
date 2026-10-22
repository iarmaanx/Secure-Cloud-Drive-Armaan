# 🔐 Secure Cloud Drive

A secure file-storage prototype with Google Sign-In and browser-side AES-256-GCM encryption.

Secure Cloud Drive is a web-based file storage application that allows users to authenticate using Google, upload files, encrypt them directly in their browser, and store the encrypted files on a Node.js server. It provides a modern dashboard for managing files, monitoring storage usage, and tracking activity.

## ✨ Features

- 🔑 **Google Authentication** — Sign in using Google Identity Services.
- 🔐 **Client-Side Encryption** — Encrypt files in the browser using the Web Crypto API and AES-256-GCM.
- ☁️ **File Storage** — Store encrypted files on the server's local filesystem.
- 👤 **User-Specific File Isolation** — Organize files by authenticated user.
- 📤 **File Upload** — Upload files through the dashboard with drag-and-drop support.
- 📥 **Secure File Download** — Retrieve files and decrypt them locally in the browser.
- 🗑️ **File Management** — View and delete uploaded files.
- 🔒 **Vault Lock/Unlock** — Lock and unlock the vault interface.
- 📊 **Storage Visualization** — Monitor storage usage through a visual progress bar.
- 📜 **Activity Logs** — Track file operations and other application activities.
- 🌙 **Modern Dashboard** — Responsive dark-themed interface with glassmorphism styling.

## 🛠️ Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript |
| Styling | Custom CSS, Tailwind CSS (if configured) |
| Backend | Node.js, Express.js |
| Authentication | Google Identity Services |
| Encryption | Web Crypto API, AES-256-GCM |
| Storage | Local filesystem |
| Deployment | Render |
| Version Control | Git and GitHub |

## 🏗️ System Architecture

The application follows a client-server architecture in which encryption and decryption are performed in the user's browser.

```text
                 USER
                   |
                   v
       +------------------------+
       |    Frontend Interface  |
       |     HTML, CSS, JS      |
       +------------------------+
                   |
                   v
       +------------------------+
       |    Google Sign-In      |
       |   Identity Verification|
       +------------------------+
                   |
                   v
       +------------------------+
       |   Node.js + Express    |
       | Authentication & APIs  |
       +------------------------+
                   |
                   v
       +------------------------+
       |      File Storage      |
       |   Encrypted File Data  |
       +------------------------+
```

### How It Works

1. The user signs in using Google Identity Services.
2. The server verifies the Google ID token.
3. The application establishes a temporary server-side session.
4. When a file is uploaded, the browser encrypts it using AES-256-GCM.
5. The encrypted file is sent to the Express API.
6. The server stores the encrypted data on its local filesystem.
7. When the user downloads a file, the browser retrieves and decrypts it locally.
8. The dashboard allows the user to manage files and view activity information.

## 🔐 Security Design

The prototype includes several security-related mechanisms:

- **Browser-side encryption:** File contents are encrypted before upload.
- **Authenticated access:** Google ID tokens are verified by the server.
- **User isolation:** Files are organized by user account.
- **Restricted file access:** Stored files are served through protected application routes rather than direct public static access.
- **Temporary sessions:** Authentication sessions are held in server memory and expire after five minutes.
- **Local decryption:** Downloaded files are decrypted in the browser.

### Current Limitations

- The encryption key is derived from the Google account ID, which is public or otherwise obtainable and must not be treated as a secret.
- The application is **not zero-knowledge encrypted**.
- Vault lock/unlock should not be considered a strong security boundary unless it is backed by independent key protection.
- Server-memory sessions are lost when the server restarts.
- The local filesystem is suitable for development and prototyping, but persistent storage must be configured for deployment.
- Existing username-based accounts are not automatically migrated to Google accounts.

> **Security note:** Do not use the current account-ID-based encryption key to protect sensitive data. A recommended improvement is to introduce a separate secret vault key, securely derived or generated and protected independently of the Google account ID. A production design should also address key recovery, session security, rate limiting, input validation, and secure transport.

## 🖥️ Project Interface

### Dashboard

The dashboard provides a centralized interface for uploading, downloading, deleting, and managing files.

<!-- Add a dashboard screenshot here, for example:
![Secure Cloud Drive Dashboard](./UI%20Screenshot%202.png)
-->

### Activity Logs

The activity interface displays file-related operations and other recorded events.

<!-- Add an activity logs screenshot here, for example:
![Activity Logs](./UI%20Screenshot%203.png)
-->

### Animated Logo

<!-- Add the animated logo here, for example:
![Secure Cloud Drive Logo](./logo1.gif)
-->

## ⚙️ Prerequisites

Before running the project, make sure you have:

- [Node.js](https://nodejs.org/) version 18 or newer
- npm, included with Node.js
- A Google account
- A Google Cloud project with a Web OAuth client configured

## 🚀 Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/iarmaanx/Secure-Cloud-Drive-Armaan.git
cd Secure-Cloud-Drive-Armaan
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Google Authentication

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a Google Cloud project.
3. Configure Google Identity Services and create a Web OAuth client ID.
4. Add the following authorized JavaScript origin:

   ```text
   http://localhost:3000
   ```

5. Copy the example environment file.

   **macOS/Linux:**
   ```bash
   cp .env.example .env
   ```

   **Windows Command Prompt:**
   ```bat
   copy .env.example .env
   ```

6. Open `.env` and configure your Google client ID:

   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

Use the environment variable names required by the project's existing configuration.

### 4. Start the Application

```bash
npm start
```

### 5. Open the Application

Visit the following address in your browser:

```text
http://localhost:3000
```

> **Important:** Run the application through the Node.js server. Do not open `index.html` directly because the application requires its Express API.

## ☁️ Deployment on Render

The application can be deployed as a Render Web Service.

1. Push the project to GitHub.
2. Sign in to [Render](https://render.com/).
3. Create a new Web Service and connect your repository.
4. Configure the build and start commands.

**Build command**

```bash
npm install
```

**Start command**

```bash
npm start
```

5. Add a persistent disk with the mount path:

   ```text
   /var/data
   ```

6. Configure the following environment variables in Render:

   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   DATA_DIR=/var/data
   ```

7. Render supplies the `PORT` environment variable automatically.
8. After deployment, add your actual HTTPS service origin to the authorized JavaScript origins in Google Cloud Console.
9. If the OAuth consent screen is in Testing mode, add your Google account as a test user.
10. Deploy the service and test authentication, file uploads, downloads, and deletion.

### Deployment Notes

- Use a single service instance while sessions are stored in memory.
- A persistent disk is required to retain uploaded files across deployments or restarts.
- Sessions will need to be re-established after a server restart.
- Review Render's current persistent-disk availability and pricing before deployment.
- Do not use the current account-ID-based encryption key for sensitive data, even when deployed over HTTPS.

## 📂 Project Structure

The exact structure may vary depending on your implementation. A typical layout is:

```text
Secure-Cloud-Drive-Armaan/
│
├── public/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── assets/
│
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── logo1.gif
├── UI Screenshot 2.png
└── UI Screenshot 3.png
```

Keep the file names and directories consistent with the actual repository.

## 🔮 Future Enhancements

- 🔑 Independent vault keys and secure key management
- 🔗 Encrypted file sharing
- 🕒 File versioning and recovery
- 📱 Responsive improvements for mobile devices
- 🔐 Multi-factor authentication
- 🛡️ Hardware security key support
- ☁️ Integration with cloud object storage
- 💻 Desktop synchronization using Electron
- 📈 Enhanced activity monitoring and audit logs

## 🎯 Project Objective

The objective of Secure Cloud Drive is to demonstrate how client-side encryption, authentication, backend APIs, and file storage can work together in a web application. It also explores the importance of encryption key management and the security limitations of relying on account identifiers as encryption keys.

## 👨‍💻 Author

**Armaan**

- GitHub: [@iarmaanx](https://github.com/iarmaanx)
