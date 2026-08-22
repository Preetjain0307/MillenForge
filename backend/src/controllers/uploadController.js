// Upload controller
// Handles wireframe image uploads via Multer.

const LocalStorageAdapter = require('../services/storageService');

/**
 * POST /api/upload
 * Accepts: multipart/form-data with field "wireframe"
 * Returns: uploaded file metadata including a publicly accessible url
 */
const uploadWireframe = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Use form-data with field name "wireframe".',
      });
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const storageService = new LocalStorageAdapter(baseUrl);
    const filename = await storageService.saveFile(req.file.buffer, req.file.originalname);
    const url = storageService.getFileUrl(filename);

    res.status(200).json({
      success: true,
      message: 'Wireframe uploaded successfully.',
      file: {
        filename: filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadWireframe };
