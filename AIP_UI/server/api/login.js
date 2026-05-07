const express = require('express');
const router = express.Router();

// NOTE: This file is not currently used in the application.
// The application uses the real .NET backend API for authentication.
// This file is kept for reference only.

// This is a temporary solution. In production, you should:
// 1. Use a real database (or load from db.json dynamically)
// 2. Hash passwords
// 3. Use proper session management
// 4. Implement rate limiting
const users = [
  // This hardcoded array should be replaced with dynamic database loading
  // when this API is actually used.
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    displayName: 'Alice Admin',
    role: 'Administrator',
    pageAccessRole: 'administrator'
  }
  // Additional users should be loaded from db.json dynamically
];

router.post('/login', (req, res) => {
  try {
    // TODO: Replace this with dynamic loading from db.json when this API is used
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Don't send password in response
    const { password: _, ...userInfo } = user;

    return res.status(200).json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 