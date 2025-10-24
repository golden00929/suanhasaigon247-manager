// Vercel serverless function - Proxy to backend Express app with CORS
const app = require('../backend/dist/app').default || require('../backend/dist/app');

// Wrap Express app to handle CORS in Vercel serverless environment
module.exports = async (req, res) => {
  // Set CORS headers for all requests
  const allowedOrigins = [
    'https://suanhasaigon247-manager.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173'
  ];

  const origin = req.headers.origin;

  // Always set CORS headers first
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // For debugging: log blocked origins
    console.log('CORS: Origin not in allowlist:', origin);
    res.setHeader('Access-Control-Allow-Origin', origin); // Allow anyway for now
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS preflight request IMMEDIATELY
  if (req.method === 'OPTIONS') {
    console.log('CORS: Handling OPTIONS preflight from', origin);
    res.statusCode = 204; // No Content
    res.end();
    return;
  }

  // Pass to Express app for all other requests
  try {
    return await app(req, res);
  } catch (error) {
    console.error('Error in Express app:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
