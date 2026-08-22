// Error handling middleware
// Must be registered AFTER all routes (4-arg signature signals Express it is an error handler)

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} -`, err.message);

  // Multer-specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Maximum allowed size is 10 MB.',
    });
  }

  const statusCode = err.status || err.statusCode || 500;

  // Sanitize message: never expose API keys, credentials, MongoDB URIs, or internal server paths
  let safeMessage = err.message || 'Internal Server Error';
  if (safeMessage.includes('AI_API_KEY') || safeMessage.includes('key=')) {
    safeMessage = 'AI service authentication or configuration issue.';
  } else if (safeMessage.includes('mongodb://') || safeMessage.includes('mongodb+srv://') || safeMessage.includes('ECONNREFUSED')) {
    safeMessage = 'Database service unavailable or connection failed.';
  }

  res.status(statusCode).json({
    success: false,
    error: safeMessage,
  });
};

module.exports = errorHandler;
