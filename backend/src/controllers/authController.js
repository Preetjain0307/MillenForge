const { requestOtp, verifyOtp } = require('../services/otpService');
const { isGoogleOauthConfigured, getGoogleAuthUrl, exchangeCodeForUser } = require('../services/googleAuthService');
const { signToken, getAuthCookieOptions } = require('../utils/token');
const User = require('../models/User');
const { saveMemoryUser } = require('../middleware/auth');
const { getConnectionStatus } = require('../services/db');

function isDbReady() {
  const status = getConnectionStatus();
  return Boolean(status.connected && status.state === 1);
}

/**
 * Finds or creates user by email. Handles MongoDB with memory fallback.
 */
async function findOrCreateUserByEmail(email, name = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const userName = name || normalizedEmail.split('@')[0];

  if (isDbReady()) {
    try {
      let user = await User.findOne({ email: normalizedEmail });
      if (user) {
        user.lastLoginAt = new Date();
        await user.save();
        return user.toPublicJSON();
      }

      user = await User.create({
        email: normalizedEmail,
        name: userName,
        provider: 'email',
        emailVerified: true,
        lastLoginAt: new Date(),
      });
      return user.toPublicJSON();
    } catch (_) {}
  }

  // Memory store fallback for no-DB mode
  const fakeId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const memoryUser = {
    id: fakeId,
    _id: fakeId,
    email: normalizedEmail,
    name: userName,
    avatar: '',
    provider: 'email',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  };
  saveMemoryUser(memoryUser);
  return memoryUser;
}

/**
 * Finds or creates user from Google OAuth callback.
 */
async function findOrCreateGoogleUser(googleProfile) {
  const { googleId, email, name, avatar } = googleProfile;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Existing Google user
    let user = await User.findOne({ googleId });
    if (user) {
      user.lastLoginAt = new Date();
      if (avatar && !user.avatar) user.avatar = avatar;
      await user.save();
      return user.toPublicJSON();
    }

    // 2. Existing user by email -> Account linking
    user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.googleId = googleId;
      user.provider = 'hybrid';
      if (avatar && !user.avatar) user.avatar = avatar;
      user.lastLoginAt = new Date();
      await user.save();
      return user.toPublicJSON();
    }

    // 3. New Google User
    user = await User.create({
      email: normalizedEmail,
      name,
      avatar,
      googleId,
      provider: 'google',
      emailVerified: true,
      lastLoginAt: new Date(),
    });
    return user.toPublicJSON();
  } catch (_) {
    // Fallback memory store
    const fakeId = 'usr_g_' + Date.now().toString(36);
    const memoryUser = {
      id: fakeId,
      _id: fakeId,
      email: normalizedEmail,
      name,
      avatar,
      googleId,
      provider: 'google',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };
    saveMemoryUser(memoryUser);
    return memoryUser;
  }
}

/**
 * POST /api/auth/email/request-otp
 */
const handleRequestOtp = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    const result = await requestOtp(email);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/email/verify-otp
 */
const handleVerifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body || {};
    const verifyResult = await verifyOtp(email, otp);

    if (!verifyResult.success) {
      return res.status(400).json(verifyResult);
    }

    // Authenticate / Register User
    const user = await findOrCreateUserByEmail(email);

    // Issue JWT Token
    const tokenPayload = {
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    };
    const token = signToken(tokenPayload);

    // Set HTTP-Only Cookie
    res.cookie('nm_auth', token, getAuthCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      user,
      token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/google
 */
const handleGoogleAuthRedirect = (req, res) => {
  if (!isGoogleOauthConfigured()) {
    return res.status(400).json({
      success: false,
      code: 'GOOGLE_AUTH_UNCONFIGURED',
      error: 'Google OAuth is not configured on this server.',
      message: 'Google Client ID and Secret environment variables must be provided.',
      requiredEnv: {
        GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
        GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
        GOOGLE_CALLBACK_URL: Boolean(process.env.GOOGLE_CALLBACK_URL),
      },
    });
  }

  const authUrl = getGoogleAuthUrl();
  return res.redirect(authUrl);
};

/**
 * GET /api/auth/google/callback
 */
const handleGoogleAuthCallback = async (req, res, next) => {
  try {
    const { code, error } = req.query || {};

    if (error || !code) {
      const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${clientUrl}/login?error=Google%20sign-in%20could%20not%20be%20completed`);
    }

    const googleProfile = await exchangeCodeForUser(code);
    const user = await findOrCreateGoogleUser(googleProfile);

    const tokenPayload = {
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    };
    const token = signToken(tokenPayload);

    res.cookie('nm_auth', token, getAuthCookieOptions());

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/workspace?auth=success`);
  } catch (err) {
    console.error('[GoogleAuthCallback] Error:', err.message);
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(err.message)}`);
  }
};

/**
 * GET /api/auth/me
 */
const handleGetCurrentUser = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * POST /api/auth/logout
 */
const handleLogout = (_req, res) => {
  const { maxAge, ...clearOptions } = getAuthCookieOptions();
  res.clearCookie('nm_auth', clearOptions);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  handleRequestOtp,
  handleVerifyOtp,
  handleGoogleAuthRedirect,
  handleGoogleAuthCallback,
  handleGetCurrentUser,
  handleLogout,
};
