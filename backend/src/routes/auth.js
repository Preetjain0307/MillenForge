// NeuraMinds — Auth Routes
const express = require('express');
const router = express.Router();

const {
  handleRequestOtp,
  handleVerifyOtp,
  handleGoogleAuthRedirect,
  handleGoogleAuthCallback,
  handleGetCurrentUser,
  handleLogout,
} = require('../controllers/authController');

const { requireAuth } = require('../middleware/auth');

// Public Auth Endpoints
router.post('/email/request-otp', handleRequestOtp);
router.post('/email/verify-otp', handleVerifyOtp);

router.get('/google', handleGoogleAuthRedirect);
router.get('/google/callback', handleGoogleAuthCallback);

// Protected Auth Endpoints
router.get('/me', requireAuth, handleGetCurrentUser);
router.post('/logout', handleLogout);

module.exports = router;
