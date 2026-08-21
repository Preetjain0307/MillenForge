// Upload controller
// Handles wireframe image uploads via Multer.

/**
 * POST /api/upload
 * Accepts: multipart/form-data with field "wireframe"
 * Returns: uploaded file metadata including a publicly accessible url
 */
const uploadWireframe = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Use form-data with field name "wireframe".',
    });
  }

  // Build the public URL for the uploaded file.
  // In dev: http://localhost:5000/uploads/<filename>
  // In production: the host will differ; the path segment stays the same.
  const protocol = req.protocol;
  const host = req.get('host');
  const url = `${protocol}://${host}/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: 'Wireframe uploaded successfully.',
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url,
    },
  });
};

module.exports = { uploadWireframe };
