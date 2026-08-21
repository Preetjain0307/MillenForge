// Database connection service
// Uses Mongoose to connect to MongoDB.
// The app continues to run even if MongoDB is unavailable (warns instead of crashes).

const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[DB] MONGODB_URI is not set. Running without database.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // fail fast in dev
    });
    isConnected = true;
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[DB] MongoDB connection failed: ${err.message}`);
    console.warn('[DB] Application will run without database. Some features may be unavailable.');
    // Do NOT throw — allow the server to start without DB
  }
};

const getConnectionStatus = () => ({
  connected: isConnected,
  state: mongoose.connection.readyState,
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
});

module.exports = { connectDB, getConnectionStatus };
