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
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
