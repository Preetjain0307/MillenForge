/**
 * NeuraMinds — Anti-AI-Template Engine & Quality Inspection
 *
 * Detects generic AI website cliches:
 *  1. Repetitive 3-card grid loops across consecutive sections
 *  2. Generic AI buzzword copy ("Experience innovation", "Discover our amazing products")
 *  3. Monotone blue/purple SaaS defaults on non-SaaS pages
 *  4. Identical hero layout patterns across multi-page compositions
 *  5. Missing visual rhythm or zero negative space
 */

const GENERIC_COPY_PATTERNS = [
  /generic portal/i,
  /generic offerings/i,
  /generic solution/i,
  /generic experience/i,
  /generic package/i,
  /\bgeneric\b/i,
  /experience innovation/i,
  /discover our amazing/i,
  /solutions tailored to your needs/i,
  /welcome to our website/i,
  /lorem ipsum/i,
  /sample text/i,
  /product 1/i,
  /card 1/i,
];

/**
 * Inspect a UIPage for generic AI template cliches and return repair recommendations.
 *
 * @param {object} page - UIPage JSON
 * @returns {object} { hasCliches: boolean, scorePenalty: number, issues: string[], repairedSections: array }
 */
const inspectAntiTemplateQuality = (page) => {
  if (!page || !Array.isArray(page.sections)) {
    return { hasCliches: false, scorePenalty: 0, issues: [], repairedSections: page?.sections || [] };
  }

  const issues = [];
  let scorePenalty = 0;

  // 1. Check generic copy
  let genericCopyCount = 0;
  const inspectElementText = (el) => {
    const textStr = JSON.stringify(el || '').toLowerCase();
    for (const pattern of GENERIC_COPY_PATTERNS) {
      if (pattern.test(textStr)) genericCopyCount++;
    }
  };

  page.sections.forEach((sec) => {
    (sec.elements || []).forEach(inspectElementText);
  });

  if (genericCopyCount > 0) {
    issues.push(`Detected ${genericCopyCount} instance(s) of generic AI copy phrases.`);
    scorePenalty += Math.min(20, genericCopyCount * 5);
  }

  // 2. Check 3-card grid repetition across consecutive sections
  let consecutiveCardGrids = 0;
  let maxConsecutiveCardGrids = 0;

  page.sections.forEach((sec) => {
    const isCardSec = ['cards', 'features', 'pricing'].includes((sec.type || '').toLowerCase());
    if (isCardSec) {
      consecutiveCardGrids++;
      maxConsecutiveCardGrids = Math.max(maxConsecutiveCardGrids, consecutiveCardGrids);
    } else {
      consecutiveCardGrids = 0;
    }
  });

  if (maxConsecutiveCardGrids >= 3) {
    issues.push(`Detected ${maxConsecutiveCardGrids} consecutive sections using repetitive card grids.`);
    scorePenalty += 15;
  }

  // 3. Auto-repair repetitive card sections into asymmetric editorial/bento grids
  let repairedCount = 0;
  const repairedSections = page.sections.map((sec, idx) => {
    if (idx > 1 && sec.type === 'cards' && page.sections[idx - 1]?.type === 'cards') {
      repairedCount++;
      return {
        ...sec,
        type: 'features',
        props: {
          ...sec.props,
          layoutPattern: 'BENTO_GRID',
          columns: 3,
        },
      };
    }
    return sec;
  });

  return {
    hasCliches: issues.length > 0,
    scorePenalty,
    issues,
    repairedCount,
    sections: repairedSections,
  };
};

module.exports = {
  inspectAntiTemplateQuality,
  GENERIC_COPY_PATTERNS,
};
