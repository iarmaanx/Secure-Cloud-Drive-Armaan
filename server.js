const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ============================================
// IMPORTANT: Serve static files FIRST
// ============================================
app.use((req, res, next) => {
  let pathname;
  try {
    pathname = path.posix.normalize(decodeURIComponent(new URL(req.originalUrl, 'http://localhost').pathname));
  } catch {
    return res.sendStatus(400);
  }

  if (pathname === '/users.json' || pathname === '/storage' || pathname.startsWith('/storage/')) {
    return res.sendStatus(404);
  }
  next();
});
app.use(express.static(__dirname));

// Create storage directory
const DATA_DIR = process.env.DATA_DIR || __dirname;
const STORAGE_DIR = path.join(DATA_DIR, 'storage');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// ============================================
// PERSISTENT USER STORAGE
// ============================================

const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Load users from file or create empty object
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      console.log(`👥 Loaded ${Object.keys(parsed).length} users from storage`);
      return parsed;
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  console.log('📝 No existing users found, starting fresh');
  return {};
}

// Save users to file
function saveUsers(users) {
  try {
    const persistedUsers = Object.fromEntries(
      Object.entries(users).map(([id, user]) => {
        const { token, ...profile } = user;
        return [id, profile];
      })
    );
    fs.writeFileSync(USERS_FILE, JSON.stringify(persistedUsers, null, 2));
    console.log(`💾 Saved ${Object.keys(users).length} users to storage`);
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

// Initialize users from file
let users = loadUsers();

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// ============================================
// SESSION MANAGEMENT (Auto-logout after 5 mins)
// ============================================

const SESSION_TIMEOUT = 5 * 60 * 1000;
const sessions = new Map();

function createSession(userId) {
  const token = generateToken();
  sessions.set(token, { userId, lastActivity: Date.now() });
  return token;
}

function clearSession(token) {
  sessions.delete(token);
}

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      console.log(`⏰ Session expired for user: ${session.userId}`);
      sessions.delete(token);
    }
  }
}, 30 * 1000);

// ============================================
// PASSWORD HASHING & TOKEN GENERATION
// ============================================

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ message: 'Invalid token. Please login again.' });
  }

  if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    clearSession(token);
    return res.status(401).json({ 
      message: 'Session expired. Please login again.',
      expired: true 
    });
  }

  session.lastActivity = Date.now();
  req.sessionToken = token;
  req.userId = session.userId;
  next();
}

// ============================================
// ROUTES
// ============================================

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/auth/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID || null });
});

app.post('/api/auth/google', async (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: 'Google sign-in is not configured on this server' });
  }

  const { credential } = req.body;
  if (typeof credential !== 'string' || !credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const profile = ticket.getPayload();

    if (!profile?.sub || !/^[A-Za-z0-9_-]{1,128}$/.test(profile.sub) ||
        !profile.email || profile.email_verified !== true) {
      return res.status(401).json({ message: 'Google account must have a verified email' });
    }

    const userId = `google_${profile.sub}`;
    const user = users[userId] || {
      id: userId,
      createdAt: new Date().toISOString()
    };
    user.name = profile.name || profile.email;
    user.email = profile.email;
    user.provider = 'google';
    delete user.token;
    users[userId] = user;
    const token = createSession(userId);

    saveUsers(users);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        createdAt: user.createdAt
      },
      sessionTimeout: SESSION_TIMEOUT / 1000
    });
  } catch {
    res.status(401).json({ message: 'Google sign-in could not be verified' });
  }
});

// Logout endpoint
app.post('/api/logout', authenticate, (req, res) => {
  const userId = req.userId;
  clearSession(req.sessionToken);
  
  console.log(`👋 User logged out: ${userId}`);
  res.json({ 
    message: 'Logged out successfully',
    redirect: '/'
  });
});

// Session status endpoint
app.get('/api/session-status', authenticate, (req, res) => {
  const session = sessions.get(req.sessionToken);
  const timeRemaining = Math.max(0, SESSION_TIMEOUT - (Date.now() - session.lastActivity));
  
  res.json({
    active: true,
    timeRemaining: Math.floor(timeRemaining / 1000),
    expiresAt: new Date(Date.now() + timeRemaining).toISOString()
  });
});

// Upload file
app.post('/uploadEncrypted', authenticate, async (req, res) => {
  const userId = req.userId;
  const { fileName, encryptedData, fileSize, fileType } = req.body;
  
  if (!fileName || !encryptedData) {
    return res.status(400).json({ message: 'Missing fileName or encryptedData' });
  }
  
  try {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const userDir = path.join(STORAGE_DIR, userId);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    const filePath = path.join(userDir, `${safeName}.json`);
    
    const fileData = {
      fileName: safeName,
      originalName: fileName,
      data: encryptedData,
      fileSize: fileSize || 0,
      fileType: fileType || 'unknown',
      uploadedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
    
    console.log(`📁 File uploaded: ${fileName} by ${userId}`);
    
    res.json({ 
      fileId: safeName, 
      message: 'File stored successfully! 🎉',
      fileName: safeName,
      uploadedAt: fileData.uploadedAt
    });
  } catch (err) {
    console.error('Error saving file:', err);
    res.status(500).json({ message: 'Error saving file' });
  }
});

// List files
app.get('/files', authenticate, (req, res) => {
  const userId = req.userId;
  const userDir = path.join(STORAGE_DIR, userId);
  
  if (!fs.existsSync(userDir)) {
    return res.json({ files: [] });
  }
  
  try {
    const files = fs.readdirSync(userDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    const fileMetadata = files.map(fileId => {
      try {
        const filePath = path.join(userDir, `${fileId}.json`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return {
          id: fileId,
          name: data.originalName || fileId,
          size: data.fileSize || 0,
          type: data.fileType || 'unknown',
          uploadedAt: data.uploadedAt || new Date().toISOString()
        };
      } catch {
        return {
          id: fileId,
          name: fileId,
          size: 0,
          type: 'unknown',
          uploadedAt: new Date().toISOString()
        };
      }
    });
    
    res.json({ files: fileMetadata });
  } catch (err) {
    console.error('Error listing files:', err);
    res.status(500).json({ message: 'Error listing files' });
  }
});

// Get file
app.get('/files/:id', authenticate, (req, res) => {
  const userId = req.userId;
  const id = req.params.id;
  const filePath = path.join(STORAGE_DIR, userId, `${id}.json`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (err) {
    console.error('Error reading file:', err);
    res.status(500).json({ message: 'Error reading file' });
  }
});

// Delete file
app.delete('/files/:id', authenticate, (req, res) => {
  const userId = req.userId;
  const id = req.params.id;
  const filePath = path.join(STORAGE_DIR, userId, `${id}.json`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  try {
    fs.unlinkSync(filePath);
    console.log(`🗑️ File deleted: ${id} by ${userId}`);
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const activeSessions = sessions.size;
  const totalUsers = Object.keys(users).length;
  
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    users: totalUsers,
    activeSessions: activeSessions,
    sessionTimeout: SESSION_TIMEOUT / 1000,
    files: fs.readdirSync(STORAGE_DIR).filter(f => fs.statSync(path.join(STORAGE_DIR, f)).isDirectory()).length
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 Secure Cloud Drive Server v2.0      ║
║                                           ║
║   📡 Running at: http://localhost:${PORT}   ║
║   📁 Files stored in: ${STORAGE_DIR}      ║
║   💾 Users stored in: ${USERS_FILE}       ║
║                                           ║
║   🔐 Google Sign-In Authentication         ║
║   ⏰ Auto-logout after 5 minutes          ║
║   💾 Persistent user storage              ║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
  console.log(`\n⏰ Session timeout: ${SESSION_TIMEOUT / 1000} seconds`);
  console.log(`👥 ${Object.keys(users).length} users registered so far`);
});
