const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure directory exists synchronously at startup
if (!fsSync.existsSync(UPLOAD_DIR)) {
  fsSync.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Interface representing a Storage Adapter.
 * In a real production environment on Vercel/Serverless, we would swap
 * this local implementation for an S3 Storage Adapter.
 */
class LocalStorageAdapter {
  constructor(baseUrl) {
    this.uploadDir = UPLOAD_DIR;
    // We expect the baseUrl string without trailing slash, e.g. "http://localhost:5000"
    this.baseUrl = baseUrl || '';
  }

  /**
   * Save a file buffer to storage.
   * @param {Buffer} buffer - File data
   * @param {string} originalName - Original filename
   * @returns {Promise<string>} - The generated filename
   */
  async saveFile(buffer, originalName) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(originalName).toLowerCase();
    const filename = `wireframe-${uniqueSuffix}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.writeFile(filePath, buffer);
    return filename;
  }

  /**
   * Get the publicly accessible URL for a stored file.
   * @param {string} filename 
   * @returns {string} 
   */
  getFileUrl(filename) {
    return `${this.baseUrl}/uploads/${filename}`;
  }

  /**
   * Delete a file from storage.
   * @param {string} filename 
   */
  async deleteFile(filename) {
    const filePath = path.join(this.uploadDir, filename);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}

// In the future, this is where we'd conditionally export S3StorageAdapter
// based on process.env.STORAGE_PROVIDER

module.exports = LocalStorageAdapter;
