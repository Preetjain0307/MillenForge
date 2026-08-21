// NeuraMind Backend — Entry Point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./services/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const healthRoutes = require('./routes/health');
const generateRoutes = require('./routes/generate');
const uploadRoutes = require('./routes/upload');
const pagesRoutes = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pages', pagesRoutes);

// 404 handler for unmatched API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, error: 'API route not found.' });
});

// ── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB(); // Gracefully handles missing/unreachable MongoDB

  app.listen(PORT, () => {
    console.log(`[SERVER] NeuraMind API running on http://localhost:${PORT}`);
    console.log(`[SERVER] CORS allowed origin: ${FRONTEND_URL}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start();
