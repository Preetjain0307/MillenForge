// NeuraMind — OTP Service
// Cryptographically secure OTP generation, hashing, rate-limiting, and verification.
// Dual storage engine: Mongoose Otp model (primary) with In-Memory fallback if DB is disconnected.

const crypto = require('crypto');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('./emailService');
const { getConnectionStatus } = require('./db');

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;  // 60 seconds
const MAX_VERIFY_ATTEMPTS = 5;

// In-memory fallback cache when MongoDB is disconnected
const inMemoryOtpStore = new Map();

function isDbReady() {
  const status = getConnectionStatus();
  return Boolean(status.connected && status.state === 1);
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp.toString()).digest('hex');
}

/**
 * Validates email format.
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Requests a new OTP for an email.
 */
async function requestOtp(rawEmail) {
  if (!isValidEmail(rawEmail)) {
    return {
      success: false,
      code: 'INVALID_EMAIL',
      message: 'Please enter a valid email address.',
    };
  }

  const email = rawEmail.trim().toLowerCase();
  const now = new Date();
  const useDb = isDbReady();

  // Check resend cooldown
  let existingRecord = null;
  if (useDb) {
    try {
      existingRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
    } catch (_) {
      existingRecord = inMemoryOtpStore.get(email);
    }
  } else {
    existingRecord = inMemoryOtpStore.get(email);
  }

  if (existingRecord) {
    const timeSinceLastRequest = now.getTime() - new Date(existingRecord.lastRequestedAt).getTime();
    // Allow 2000ms grace window for client timer rounding / network latency
    if (timeSinceLastRequest < RESEND_COOLDOWN_MS - 2000) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastRequest) / 1000);
      return {
        success: false,
        code: 'COOLDOWN_ACTIVE',
        message: `Please wait ${waitSeconds} seconds before requesting another code.`,
        cooldownSeconds: waitSeconds,
      };
    }
  }

  // Invalidate previous OTPs for this email
  if (useDb) {
    try {
      await Otp.deleteMany({ email });
    } catch (_) {
      inMemoryOtpStore.delete(email);
    }
  } else {
    inMemoryOtpStore.delete(email);
  }

  // Generate 6-digit numeric OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(rawOtp);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  // Save to DB or in-memory fallback
  if (useDb) {
    try {
      await Otp.create({
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        maxAttempts: MAX_VERIFY_ATTEMPTS,
        lastRequestedAt: now,
        used: false,
      });
    } catch (_) {
      inMemoryOtpStore.set(email, {
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        maxAttempts: MAX_VERIFY_ATTEMPTS,
        lastRequestedAt: now,
        used: false,
        rawOtpForTest: rawOtp,
      });
    }
  } else {
    inMemoryOtpStore.set(email, {
      email,
      otpHash,
      expiresAt,
      attempts: 0,
      maxAttempts: MAX_VERIFY_ATTEMPTS,
      lastRequestedAt: now,
      used: false,
      rawOtpForTest: rawOtp,
    });
  }

  // Send Email (never expose rawOtp to caller return value)
  await sendOtpEmail(email, rawOtp);

  return {
    success: true,
    message: 'Verification code sent to your email.',
    email,
    expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
    cooldownSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000),
    // NOTE: rawOtp is deliberately NOT included in the return object!
  };
}

/**
 * Verifies an OTP for an email.
 */
async function verifyOtp(rawEmail, inputOtp) {
  if (!isValidEmail(rawEmail)) {
    return {
      success: false,
      code: 'INVALID_EMAIL',
      message: 'Please enter a valid email address.',
    };
  }

  if (!inputOtp || typeof inputOtp !== 'string' || inputOtp.trim().length !== 6) {
    return {
      success: false,
      code: 'INVALID_OTP_FORMAT',
      message: 'Incorrect verification code. Please enter a 6-digit code.',
    };
  }

  const email = rawEmail.trim().toLowerCase();
  const cleanOtp = inputOtp.trim();
  const now = new Date();

  let record = null;
  const useDb = isDbReady();

  if (useDb) {
    try {
      record = await Otp.findOne({ email, used: false }).sort({ createdAt: -1 });
    } catch (_) {
      record = inMemoryOtpStore.get(email);
    }
  } else {
    record = inMemoryOtpStore.get(email);
  }

  if (!record || record.used) {
    return {
      success: false,
      code: 'OTP_NOT_FOUND',
      message: 'No active verification code found for this email. Please request a new one.',
    };
  }

  // Check attempt limit
  if (record.attempts >= record.maxAttempts) {
    return {
      success: false,
      code: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'Too many attempts. Please request a new code.',
    };
  }

  // Check expiration
  if (new Date(record.expiresAt).getTime() < now.getTime()) {
    return {
      success: false,
      code: 'OTP_EXPIRED',
      message: 'This code has expired. Please request a new code.',
    };
  }

  // Verify hash
  const inputHash = hashOtp(cleanOtp);
  const isValid = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(record.otpHash));

  if (!isValid) {
    // Increment attempts
    record.attempts += 1;
    if (useDb && typeof record.save === 'function') {
      await record.save();
    } else {
      inMemoryOtpStore.set(email, record);
    }

    if (record.attempts >= record.maxAttempts) {
      return {
        success: false,
        code: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Too many attempts. Please request a new code.',
      };
    }

    return {
      success: false,
      code: 'INCORRECT_OTP',
      message: `Incorrect verification code. ${record.maxAttempts - record.attempts} attempts remaining.`,
      attemptsRemaining: record.maxAttempts - record.attempts,
    };
  }

  // Mark as used / delete
  if (useDb && typeof record.save === 'function') {
    record.used = true;
    await record.save();
    await Otp.deleteMany({ email });
  } else {
    inMemoryOtpStore.delete(email);
  }

  return {
    success: true,
    email,
  };
}

module.exports = {
  requestOtp,
  verifyOtp,
  isValidEmail,
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
  MAX_VERIFY_ATTEMPTS,
  // Export helper for tests in no-DB dev mode
  _getInMemoryOtp: (email) => inMemoryOtpStore.get(email?.toLowerCase()?.trim()),
};
