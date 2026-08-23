/**
 * NeuraMind Backend Utilities
 */

/**
 * Create a standard success response object.
 * @param {object} data
 * @param {string} [message]
 */
const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
});

/**
 * Create a standard error response object.
 * @param {string} error
 * @param {number} [status]
 */
const errorResponse = (error, status = 500) => ({
  success: false,
  error,
  status,
});

module.exports = { successResponse, errorResponse };
