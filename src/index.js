const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream/promises');

// Register CORS support
fastify.register(require('@fastify/cors'), {
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3001', // UI preview server
    'http://localhost:4173', // Vite preview server
    'http://localhost:5174', // New Vite dev server port
    'http://localhost:5176', // Another common Vite port
    /^https:\/\/.*\.vercel\.app$/, // Vercel deployments
    /^https:\/\/.*\.netlify\.app$/, // Netlify deployments
    /^https:\/\/.*\.share\.dreamflow\.app$/, // Dreamflow share deployments
    /^http:\/\/localhost:\d+$/, // Any localhost port for development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

// ... (rest of the file unchanged)