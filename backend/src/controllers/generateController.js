// Generate controller
// Placeholder — AI generation will be implemented in a future task.

/**
 * POST /api/generate
 * Accepts: { prompt, pageName, existingCode, architectureFlow }
 * Returns: 501 Not Implemented (placeholder)
 */
const generate = (req, res) => {
  res.status(501).json({
    success: false,
    message: 'AI generation not yet implemented. This endpoint is reserved for future LLM/Vision integration.',
    receivedPayload: {
      pageName: req.body.pageName || null,
      prompt: req.body.prompt ? '[received]' : null,
      existingCode: req.body.existingCode ? '[received]' : null,
      architectureFlow: req.body.architectureFlow ? '[received]' : null,
    },
  });
};

module.exports = { generate };
