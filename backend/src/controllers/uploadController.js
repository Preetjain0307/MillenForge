// Upload controller
// Handles wireframe image uploads via Multer.

/**
 * POST /api/upload
 * Accepts: multipart/form-data with field "wireframe"
 * Returns: uploaded file metadata
 */
const uploadWireframe = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Use form-data with field name "wireframe".',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Wireframe uploaded successfully.',
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    },
  });
};

module.exports = { uploadWireframe };
