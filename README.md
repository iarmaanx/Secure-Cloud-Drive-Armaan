
# 🔐 Zero-Knowledge Encrypted Cloud Drive                                                                     

*A private cloud vault where **only the user** holds the keys.*
<p align="center">
  <img src="logo1.gif" width="180px" alt="Secure Cloud Drive Animated Logo"/>
</p>

---

## 🚀 What is this?

This is a **fully client-side encrypted cloud storage app** — similar to ProtonDrive/Mega — where files are **encrypted before upload**, and the cloud never sees the real data.

You own your files.
You own your encryption keys.
The server sees **only ciphertext.**

---

### 🧠 Core Idea

> 💡 *Trust no server.*
> Encrypt everything **before upload** using **AES-GCM WebCrypto**.
> Store only encrypted blobs in **AWS S3**.
> Login & permissions handled via **AWS Cognito**.
> Result: Zero-Knowledge Cloud Vault.

---

## ✨ Features

| Feature                                    | Status |
| ------------------------------------------ | ------ |
| 🔐 Client-side AES-GCM encryption          | ✔      |
| ☁ Secure AWS S3 storage                    | ✔      |
| 🔑 Cognito authentication                  | ✔      |
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
| Cloud Storage | AWS S3                           |
| Auth          | AWS Cognito                      |
| IAM           | Access Policies & S3 Permissions |
| Extras        | Drag-Drop, Icons, Storage Chart  |

---

## 🔐 Security Architecture

```
Client Browser → AES-GCM Encrypt → Upload to AWS S3 (Ciphertext Only)
                                   ↓
                               Cognito Auth
                                   ↓
                            IAM-Restricted Access

```

✔ Password never leaves device
✔ Cloud stores encrypted bytes only
✔ No plaintext exposure
✔ Zero-Knowledge guarantee

---

## 🧭 User Flow

1. Sign-In with Cognito
2. Unlock Vault (password = key)
3. Upload → Encrypt → Store in S3
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

```bash
git clone <repo-url>
cd repo-folder
open index.html  OR  live-server .
```

You must add your AWS Credentials + Cognito details in:

```
/js/config.js or inside <script> block
```

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
⭐ → Motivation ++
```
## 👥 Contributors
| Contributor                               | Responsibilities                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **🔐 Jashan** *(Cybersecurity & Encryption)* | Zero-knowledge design • Client-side AES-GCM crypto • Vault lock system • Security architecture • Authentication hardening        |
| **☁ Armaan** *(Cloud & Deployment)*          | AWS S3 storage integration • IAM permission setup • Cognito configuration • Backend connectivity • Cloud workflow implementation |
