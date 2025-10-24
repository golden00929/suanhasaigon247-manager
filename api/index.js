// Vercel serverless function - Proxy to backend Express app
const app = require('../backend/dist/app').default || require('../backend/dist/app');

module.exports = app;
