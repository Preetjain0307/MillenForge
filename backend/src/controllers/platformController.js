const aiService = require('../services/aiService');
const Version = require('../models/Version');
const { getConnectionStatus } = require('../services/db');

// Check if database is ready
const isDbReady = () => {
  const { connected, state } = getConnectionStatus();
  return connected && state === 1;
};

const generateTheme = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.length > 500) {
      return res.status(400).json({ success: false, error: 'Valid prompt required.' });
    }

    const theme = await aiService.generateTheme(prompt);

    // Validate generated colors
    if (theme.colors) {
      const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
      for (const [key, value] of Object.entries(theme.colors)) {
        if (!hexRegex.test(value)) {
           // Fallback to a safe color if AI hallunciates
           theme.colors[key] = '#000000';
        }
      }
    }

    res.json({ success: true, data: theme });
  } catch (err) {
    next(err);
  }
};

const generateDocs = async (req, res, next) => {
  try {
    const { page } = req.body;
    if (!page || !page.sections) {
      return res.status(400).json({ success: false, error: 'Valid UIPage required.' });
    }

    // Extract structure
    const docs = {
      pageName: page.page || 'Untitled',
      sections: page.sections.map(s => ({
        id: s.id,
        type: s.type,
        elementsCount: s.elements ? s.elements.length : 0
      })),
      components: [],
      interactions: ['Scroll', 'Click'],
      generatedAt: new Date().toISOString()
    };

    // Find interactive elements
    page.sections.forEach(s => {
      if (s.elements) {
        s.elements.forEach(el => {
           if (el.type === 'button' || el.type === 'link') {
             docs.components.push({ type: el.type, label: el.content || 'Action' });
           }
        });
      }
    });

    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
};

const analyzeImpact = async (req, res, next) => {
  try {
    const { page, elementId } = req.body;
    if (!page || !elementId) {
      return res.status(400).json({ success: false, error: 'Valid UIPage and elementId required.' });
    }

    const affectedAreas = ['CMS State', `Route: /preview/${page.page || 'unknown'}`];
    let risk = 'low';
    let reason = 'Change only affects localized element styling or content.';

    // Find element
    let foundSection = null;
    page.sections?.forEach(s => {
       const found = s.elements?.find(e => e.id === elementId);
       if (found) {
         foundSection = s;
         affectedAreas.push(`Section: ${s.type}`);
         if (s.type === 'hero' || s.type === 'navbar') {
            risk = 'medium';
            reason = 'Changes to global-level sections affect overall page layout and navigation.';
         }
       }
    });

    res.json({
       success: true,
       data: {
          affectedAreas,
          risk,
          reason
       }
    });
  } catch (err) {
    next(err);
  }
};

const createVersion = async (req, res, next) => {
  try {
    const { pageId, pageState, changeSummary } = req.body;
    if (!pageId || !pageState) {
      return res.status(400).json({ success: false, error: 'pageId and pageState required.' });
    }

    if (!isDbReady()) {
      return res.json({
         success: true,
         fallback: true,
         data: { version: 1, pageId, pageState, changeSummary, fallbackMode: true }
      });
    }

    // Get highest version
    const lastVersion = await Version.findOne({ pageId }).sort({ version: -1 });
    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    const newVersion = await Version.create({
       pageId,
       version: nextVersion,
       pageState,
       changeSummary: changeSummary || `Version ${nextVersion}`
    });

    res.json({ success: true, data: newVersion });
  } catch (err) {
    next(err);
  }
};

const listVersions = async (req, res, next) => {
  try {
    const { pageId } = req.params;
    if (!isDbReady()) {
      return res.json({ success: true, data: [], fallback: true });
    }

    const versions = await Version.find({ pageId })
      .select('-pageState') // Do not send full page state in list
      .sort({ version: -1 })
      .limit(20);

    res.json({ success: true, data: versions });
  } catch (err) {
    next(err);
  }
};

const restoreVersion = async (req, res, next) => {
  try {
    const { pageId, version } = req.params;
    if (!isDbReady()) {
       return res.status(503).json({ success: false, error: 'Database unavailable for restore.' });
    }

    const v = await Version.findOne({ pageId, version: Number(version) });
    if (!v) {
       return res.status(404).json({ success: false, error: 'Version not found.' });
    }

    res.json({ success: true, data: v });
  } catch (err) {
    next(err);
  }
};

const generateUiToFlow = async (req, res, next) => {
  try {
    const { imagePath, uiPage, uiContent, prompt } = req.body;
    const flowchartData = await aiService.generateUiToFlow({
      imagePath,
      uiPage,
      uiContent,
      prompt,
    });

    res.json({
      success: true,
      flowchart: flowchartData,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateTheme,
  generateDocs,
  analyzeImpact,
  createVersion,
  listVersions,
  restoreVersion,
  generateUiToFlow,
};
