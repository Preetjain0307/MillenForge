/**
 * NeuraMindss Frontend Utilities
 * General-purpose helper functions.
 */

/**
 * Format file size in human-readable form.
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Slugify a string for use as a URL segment or ID.
 * @param {string} str
 * @returns {string}
 */
export const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Truncate a string to maxLength, appending '…' if truncated.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (str, maxLength = 100) =>
  str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
