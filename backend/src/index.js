// NeuraMind Backend — Entry Point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./services/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const healthRoutes = require('./routes/health');
const generateRoutes = require('./routes/generate');
const uploadRoutes = require('./routes/upload');
const pagesRoutes = require('./routes/pages');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = CLIENT_URL.split(',').map(url => url.trim());

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl, Postman, or health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS error: origin ${origin} is not allowed.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static — serve uploaded wireframes ─────────────────────────────────────
// Files are accessible at: GET /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/review', reviewRoutes);

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
    console.log(`[SERVER] CORS allowed origin: ${CLIENT_URL}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start();
