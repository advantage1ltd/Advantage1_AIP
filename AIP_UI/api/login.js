// NOTE: This file is not currently used in the application.
// The application uses the real .NET backend API for authentication.
// This file is kept for reference only.
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

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // TODO: Replace this with dynamic loading from db.json when this API is used
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid username or password' 
      });
    }

    // Don't send password in response
    const { password: _, ...userInfo } = user;

    return res.status(200).json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
} 