const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// IMPORTANT: Serve static files FIRST
// ============================================
app.use(express.static(__dirname));

// Create storage directory
const STORAGE_DIR = path.join(__dirname, 'storage');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// ============================================
// PERSISTENT USER STORAGE
// ============================================

const USERS_FILE = path.join(__dirname, 'users.json');

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
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
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
const sessionActivity = new Map();

function updateSession(userId) {
  sessionActivity.set(userId, Date.now());
}

function isSessionExpired(userId) {
  const lastActivity = sessionActivity.get(userId);
  if (!lastActivity) return true;
  return (Date.now() - lastActivity) > SESSION_TIMEOUT;
}

function clearSession(userId) {
  sessionActivity.delete(userId);
}

setInterval(() => {
  const now = Date.now();
  for (const [userId, lastActivity] of sessionActivity) {
    if (now - lastActivity > SESSION_TIMEOUT) {
      console.log(`⏰ Session expired for user: ${userId}`);
      const user = users[userId];
      if (user) {
        delete user.token;
        saveUsers(users);
      }
      sessionActivity.delete(userId);
    }
  }
}, 30 * 1000);

// ============================================
// PASSWORD HASHING & TOKEN GENERATION
// ============================================

function generateToken(userId) {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  
  let foundUser = null;
  for (const [key, user] of Object.entries(users)) {
    if (user.token === token) {
      foundUser = user;
      break;
    }
  }
  
  if (!foundUser) {
    return res.status(401).json({ message: 'Invalid token. Please login again.' });
  }
  
  if (isSessionExpired(foundUser.id)) {
    delete foundUser.token;
    saveUsers(users);
    sessionActivity.delete(foundUser.id);
    return res.status(401).json({ 
      message: 'Session expired. Please login again.',
      expired: true 
    });
  }
  
  updateSession(foundUser.id);
  req.userId = foundUser.id;
  next();
}

// ============================================
// ROUTES
// ============================================

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  
  if (password.length < 4) {
    return res.status(400).json({ message: 'Password must be at least 4 characters' });
  }
  
  const hashedPassword = hashPassword(password);
  
  if (!users[username]) {
    users[username] = {
      id: username,
      name: username,
      passwordHash: hashedPassword,
      token: generateToken(username),
      createdAt: new Date().toISOString()
    };
    saveUsers(users);
    console.log(`✅ New user created: ${username}`);
  } else {
    if (users[username].passwordHash !== hashedPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    users[username].token = generateToken(username);
    saveUsers(users);
    console.log(`✅ User logged in: ${username}`);
  }
  
  const user = users[username];
  updateSession(user.id);
  
  res.json({
    token: user.token,
    user: { 
      id: user.id, 
      name: user.name,
      createdAt: user.createdAt
    },
    sessionTimeout: SESSION_TIMEOUT / 1000
  });
});

// Logout endpoint
app.post('/api/logout', authenticate, (req, res) => {
  const userId = req.userId;
  clearSession(userId);
  
  const user = users[userId];
  if (user) {
    delete user.token;
    saveUsers(users);
  }
  
  console.log(`👋 User logged out: ${userId}`);
  res.json({ 
    message: 'Logged out successfully',
    redirect: '/'
  });
});

// Session status endpoint
app.get('/api/session-status', authenticate, (req, res) => {
  const userId = req.userId;
  const lastActivity = sessionActivity.get(userId);
  const timeRemaining = lastActivity ? 
    Math.max(0, SESSION_TIMEOUT - (Date.now() - lastActivity)) : 0;
  
  res.json({
    active: true,
    timeRemaining: Math.floor(timeRemaining / 1000),
    expiresAt: new Date(Date.now() + timeRemaining).toISOString()
  });
});

// Get all users (debug)
app.get('/api/users', (req, res) => {
  const userList = Object.entries(users).map(([key, u]) => ({
    id: u.id,
    name: u.name,
    createdAt: u.createdAt,
    hasToken: !!u.token,
    isActive: sessionActivity.has(u.id)
  }));
  res.json({ users: userList, count: userList.length });
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
  const activeSessions = sessionActivity.size;
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
║   🔐 Username + Password Authentication   ║
║   👤 Any username + min 4 char password   ║
║   ⏰ Auto-logout after 5 minutes          ║
║   💾 Persistent user storage              ║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
  console.log(`\n⏰ Session timeout: ${SESSION_TIMEOUT / 1000} seconds`);
  console.log(`👥 ${Object.keys(users).length} users registered so far`);
});
