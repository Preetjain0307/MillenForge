// Pages controller
// Placeholder — page persistence will be implemented in a future task.

/**
 * GET /api/pages/:pageName
 * Returns: 501 Not Implemented (placeholder)
 */
const getPage = (req, res) => {
  const { pageName } = req.params;
  res.status(501).json({
    success: false,
    message: 'Page retrieval not yet implemented. This endpoint is reserved for future database integration.',
    pageName,
  });
};

/**
 * GET /api/pages
 * Returns: 501 Not Implemented (placeholder)
 */
const listPages = (_req, res) => {
  res.status(501).json({
    success: false,
    message: 'Page listing not yet implemented.',
  });
};

module.exports = { getPage, listPages };
