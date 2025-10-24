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

  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Pass to Express app
  return app(req, res);
};
