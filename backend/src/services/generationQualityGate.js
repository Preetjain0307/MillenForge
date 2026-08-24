/**
 * NeuraMinds — Generation Quality Gate
 *
 * Runs every generated UIPage through a deterministic pipeline:
 *   1. Schema Validation  (validateUIPage)
 *   2. Self-Healing       (healUIPage — fills missing IDs, fallbacks, invalid props, bad types)
 *   3. Quality Scoring    (calculateQualityScore — 10 categories, 0–100 score)
 *   4. Design-to-Prompt   (validateDesignToCode — domain intent verification)
 *   5. Domain Image Rules (rejectIrrelevantImages — blocks off-domain imagery)
 *
 * Consumed exclusively by generateController.js.
 * Never calls Gemini. Deterministic and synchronous (no await needed).
 *
 * Gate result shape:
 * {
 *   passed:           boolean,
 *   page:             UIPage,
 *   qualityScore:     number,
 *   qualityGrade:     'A'|'B'|'C'|'D'|'F',
 *   matchScore:       number,
 *   repairsApplied:   Repair[],
 *   issues:           string[],
 *   recommendations:  string[],
 *   rejectionReason:  string|null
 * }
 */

const { validateUIPage } = require('../utils/validateUI');
const { calculateQualityScore, validateDesignToCode } = require('../utils/qualityScorer');
const { healUIPage } = require('./aiReviewService');
const { extractPromptRequirements } = require('./promptRequirementExtractor');

// ── Domain detection helpers ──────────────────────────────────────────────────

const DOMAIN_RULES = [
  {
    name: 'food',
    keywords: ['food', 'pizza', 'restaurant', 'burger', 'cafe', 'dining', 'sushi', 'menu', 'meal', 'lunch', 'dinner', 'chef', 'cuisine', 'takeaway', 'delivery'],
    requiresImages: true,
    requiresCTA: true,
    requiredCTAHints: ['order', 'add to cart', 'menu', 'reserve'],
  },
  {
    name: 'travel',
    keywords: ['travel', 'hotel', 'booking', 'resort', 'tour', 'vacation', 'holiday', 'flight', 'destination', 'trip', 'hospitality'],
    requiresImages: true,
    requiresCTA: true,
    requiredCTAHints: ['book', 'reserve', 'explore', 'plan'],
  },
  {
    name: 'fashion',
    keywords: ['fashion', 'ecommerce', 'e-commerce', 'store', 'shop', 'clothing', 'apparel', 'wear', 'sneakers', 'accessories', 'boutique', 'collection'],
    requiresImages: true,
    requiresCTA: true,
    requiredCTAHints: ['buy', 'add to bag', 'shop', 'order'],
  },
  {
    name: 'realestate',
    keywords: ['real estate', 'property', 'house', 'villa', 'apartment', 'listing', 'mortgage', 'architecture', 'home for sale'],
    requiresImages: true,
    requiresCTA: true,
    requiredCTAHints: ['inquire', 'contact', 'schedule', 'view'],
  },
  {
    name: 'portfolio',
    keywords: ['portfolio', 'creative', 'designer', 'artist', 'photographer', 'showcase', 'projects', 'work', 'freelance'],
    requiresImages: true,
    requiresCTA: false,
    requiredCTAHints: ['view project', 'hire', 'contact'],
  },
  {
    name: 'saas',
    keywords: ['saas', 'dashboard', 'analytics', 'platform', 'software', 'crm', 'erp', 'monitoring', 'metrics', 'data', 'api', 'integration'],
    requiresImages: false, // SaaS typically uses data/charts not photos
    requiresCTA: true,
    requiredCTAHints: ['start', 'free trial', 'sign up', 'get started', 'demo'],
  },
  {
    name: 'documentation',
    keywords: ['documentation', 'docs', 'api reference', 'developer guide', 'readme', 'knowledge base', 'wiki', 'guide'],
    requiresImages: false,
    requiresCTA: false,
    requiredCTAHints: [],
  },
  {
    name: 'auth',
    keywords: ['login', 'signup', 'sign up', 'sign in', 'register', 'authentication', 'onboarding', 'create account'],
    requiresImages: false,
    requiresCTA: true,
    requiredCTAHints: ['sign up', 'login', 'create account', 'get started'],
  },
];

/**
 * Detect the domain from the user prompt.
 * Returns the matched domain rule or null.
 */
const detectDomain = (prompt = '') => {
  const p = String(prompt).toLowerCase();
  for (const rule of DOMAIN_RULES) {
    if (rule.keywords.some((kw) => p.includes(kw))) {
      return rule;
    }
  }
  return null;
};

// ── Image relevance guard ─────────────────────────────────────────────────────

const SAAS_IRRELEVANT_QUERIES = ['pizza', 'burger', 'food', 'beach', 'resort', 'villa', 'fashion', 'sneakers', 'wedding'];
const DOC_IRRELEVANT_QUERIES  = ['pizza', 'burger', 'beach', 'resort', 'fashion', 'villa', 'concert'];

/**
 * Removes or replaces images that are clearly domain-irrelevant.
 * E.g. a SaaS page should never have food photos.
 *
 * @param {object} uiPage
 * @param {object|null} domainRule
 * @returns {object} cleaned UIPage
 */
const rejectIrrelevantImages = (uiPage, domainRule) => {
  if (!domainRule || !uiPage || !Array.isArray(uiPage.sections)) return uiPage;

  const domainName = (domainRule.name || '').toLowerCase();
  const OFF_DOMAIN_MAP = {
    college: ['pizza', 'burger', 'food', 'hotel', 'resort', 'villa', 'fashion', 'sneakers'],
    hospital: ['pizza', 'burger', 'food', 'hotel', 'resort', 'villa', 'fashion', 'sneakers', 'concert'],
    saas: SAAS_IRRELEVANT_QUERIES,
    documentation: DOC_IRRELEVANT_QUERIES,
    food: ['campus', 'university', 'college', 'hospital', 'clinic', 'villa', 'sneakers'],
    travel: ['food', 'pizza', 'burger', 'hospital', 'clinic', 'campus', 'university'],
    fashion: ['pizza', 'burger', 'hospital', 'clinic', 'campus', 'university', 'resort'],
    banking: ['pizza', 'burger', 'food', 'resort', 'villa', 'fashion'],
  };

  const blockList = OFF_DOMAIN_MAP[domainName] || [];
  if (blockList.length === 0) return uiPage;

  const cleanedSections = uiPage.sections.map((section) => {
    if (!Array.isArray(section.elements)) return section;

    const cleanedElements = section.elements.map((el) => {
      if (el.type !== 'image') return el;

      const query = (el.content?.imageQuery || el.props?.imageQuery || el.props?.alt || el.props?.src || '').toLowerCase();
      const isIrrelevant = blockList.some((blocked) => query.includes(blocked));

      if (isIrrelevant) {
        // Resolve a relevant domain-specific asset instead
        const { resolveContextualImage } = require('./imageService');
        const resolved = resolveContextualImage(domainName, `${domainName} visual asset`);
        return {
          ...el,
          content: {
            src: resolved.src,
            alt: resolved.alt,
            imageQuery: domainName,
          },
          props: {
            ...el.props,
            src: resolved.src,
            alt: resolved.alt,
          },
        };
      }

      return el;
    });

    return { ...section, elements: cleanedElements };
  });

  return { ...uiPage, sections: cleanedSections };
};

/**
 * Cleans non-semantic ecommerce artifacts (price, rating, reviews, quantity, select buttons)
 * from authentication pages or non-ecommerce domain pages.
 */
const cleanAuthenticationAndDomainSemantics = (uiPage, reqSpec) => {
  if (!uiPage || !Array.isArray(uiPage.sections)) return uiPage;
  const isAuthPage = reqSpec.pageType?.includes('auth') || reqSpec.pageType?.includes('login') || reqSpec.loginTypes?.length > 0;
  if (!isAuthPage) return uiPage;

  const cleanedSections = uiPage.sections.map((section) => {
    if (!Array.isArray(section.elements)) return section;

    const cleanedElements = section.elements.map((el) => {
      if (el.type === 'cards' || el.type === 'card') {
        const props = { ...(el.props || {}) };
        if (Array.isArray(props.items)) {
          props.items = props.items.map((item) => {
            const copy = { ...item };
            delete copy.price;
            delete copy.rating;
            delete copy.reviews;
            delete copy.quantity;
            if (copy.buttonText === 'Select' || copy.buttonText === 'Add to Cart') {
              copy.buttonText = 'Login';
            }
            return copy;
          });
        }
        delete props.price;
        delete props.rating;
        delete props.reviews;
        delete props.quantity;
        return { ...el, props };
      }
      return el;
    });

    return { ...section, elements: cleanedElements };
  });

  return { ...uiPage, sections: cleanedSections };
};

// ── Domain-specific missing section detection ─────────────────────────────────

/**
 * Returns a list of critical missing elements for the detected domain.
 * Only flags things that would make the site feel hollow or wrong.
 */
const detectMissingRequiredSections = (uiPage, domainRule) => {
  const missing = [];
  if (!domainRule || !uiPage || !Array.isArray(uiPage.sections)) return missing;

  const allElements = uiPage.sections.flatMap((s) => s.elements || []);
  const sectionTypes = uiPage.sections.map((s) => s.type || '');

  // Check for CTA requirement
  if (domainRule.requiresCTA) {
    const hasCTA = allElements.some((el) => el.type === 'button' || el.type === 'link');
    if (!hasCTA) {
      missing.push(`Missing required CTA button for ${domainRule.name} page (e.g. "${domainRule.requiredCTAHints[0] || 'Get Started'}")`);
    }
  }

  // Check for imagery requirement
  if (domainRule.requiresImages) {
    const hasImage = allElements.some(
      (el) => el.type === 'image' || (Array.isArray(el.props?.items) && el.props.items.some((i) => i.src || i.image || i.imageQuery))
    );
    if (!hasImage) {
      missing.push(`Missing required imagery for ${domainRule.name} page — visuals are essential for this domain`);
    }
  }

  // Food: must have a menu/cards section
  if (domainRule.name === 'food') {
    const hasMenuCards = sectionTypes.some((t) => t === 'cards') ||
      allElements.some((el) => el.type === 'cards' && Array.isArray(el.props?.items) && el.props.items.length > 0);
    if (!hasMenuCards) {
      missing.push('Food site missing menu items cards section with dishes, prices, and ratings');
    }
  }

  // Auth: must have form inputs
  if (domainRule.name === 'auth') {
    const hasInput = allElements.some((el) => el.type === 'input' || el.type === 'textfield');
    if (!hasInput) {
      missing.push('Authentication page missing form input fields (email, password)');
    }
  }

  return missing;
};

// ── Quality Gate Threshold ────────────────────────────────────────────────────

/** Minimum quality score to pass without retry */
const QUALITY_THRESHOLD = 55;

/** Minimum design-to-prompt match to pass */
const MATCH_THRESHOLD = 60;

// ── Prompt Requirement Healing Helper ─────────────────────────────────────────

const healMissingPromptRequirements = (uiPage, userPrompt = '') => {
  if (!uiPage || !Array.isArray(uiPage.sections)) return { page: uiPage, missingRequirements: [] };

  const reqSpec = extractPromptRequirements(userPrompt);
  const sections = [...uiPage.sections];
  const allElements = sections.flatMap((s) => s.elements || []);
  const missing = [];

  // Check 1: GST Breakdown requirement
  if (reqSpec.requiresGST && reqSpec.financials) {
    const hasGstElement = allElements.some((el) => {
      const txt = (el.content || el.fallback || el.props?.title || '').toString().toLowerCase();
      return txt.includes('gst') || txt.includes('tax');
    });

    if (!hasGstElement) {
      missing.push('GST tax breakdown calculation element');

      // Inject GST Price Breakdown section
      const gstSection = {
        id: 'sec-gst-tax-breakdown',
        type: 'checkout',
        elements: [
          {
            id: 'gst-title',
            type: 'text',
            content: `Price Breakdown & GST Tax (${reqSpec.financials.gstPercentage}%)`,
            props: { tag: 'h3' },
            fallback: 'Price Breakdown & GST Tax',
          },
          {
            id: 'gst-cards-grid',
            type: 'cards',
            props: {
              columns: 3,
              items: [
                {
                  id: 'item-base-price',
                  title: 'Base Price',
                  description: 'Original item price',
                  price: reqSpec.financials.basePriceFormatted,
                  badge: 'Subtotal',
                  icon: 'pi pi-tag',
                },
                {
                  id: 'item-gst-amount',
                  title: `GST (${reqSpec.financials.gstPercentage}%)`,
                  description: `Calculated GST Amount`,
                  price: reqSpec.financials.gstAmountFormatted,
                  badge: 'Tax',
                  icon: 'pi pi-percentage',
                },
                {
                  id: 'item-total-price',
                  title: 'Final Total Amount',
                  description: 'Price inclusive of all taxes',
                  price: reqSpec.financials.totalPriceFormatted,
                  badge: 'Total Payable',
                  icon: 'pi pi-check-circle',
                },
              ],
            },
            fallback: 'GST Price Breakdown',
          },
        ],
      };

      // Insert before footer or at end
      const footerIdx = sections.findIndex((s) => s.type === 'footer');
      if (footerIdx !== -1) {
        sections.splice(footerIdx, 0, gstSection);
      } else {
        sections.push(gstSection);
      }
    }
  }

  // Check 2: Mandatory Action Buttons
  reqSpec.requiredActions.forEach((actionLabel) => {
    const hasAction = allElements.some((el) => {
      const btnTxt = (el.content || el.props?.label || el.fallback || '').toString().toLowerCase();
      return btnTxt.includes(actionLabel.toLowerCase());
    });

    if (!hasAction) {
      missing.push(`Required action button: "${actionLabel}"`);
      // Add button to hero section or first non-navbar section
      const heroSec = sections.find((s) => s.type === 'hero') || sections.find((s) => s.type !== 'navbar');
      if (heroSec && Array.isArray(heroSec.elements)) {
        heroSec.elements.push({
          id: `btn-${actionLabel.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'button',
          content: actionLabel,
          props: { variant: 'primary', label: actionLabel, icon: 'pi pi-shopping-bag' },
          fallback: actionLabel,
        });
      }
    }
  });

  // Check 3: Theme Requirement (Light/White theme)
  if (reqSpec.isLightThemeRequested) {
    uiPage.props = uiPage.props || {};
    uiPage.props.theme = 'light';
    uiPage.meta = { ...(uiPage.meta || {}), theme: 'light' };
  }

  // Check 3b: Dynamic Theme & Explicit Color Requirements
  uiPage.props = uiPage.props || {};
  uiPage.meta = uiPage.meta || {};

  if (reqSpec.themeTokens) {
    uiPage.props.themeTokens = reqSpec.themeTokens;
    uiPage.meta.themeTokens = reqSpec.themeTokens;
    uiPage.themeTokens = reqSpec.themeTokens;
  }

  if (reqSpec.primaryButtonColor || reqSpec.customBgColor || reqSpec.colorSpec?.buttonBackground) {
    if (reqSpec.primaryButtonColor || reqSpec.colorSpec?.buttonBackground) {
      const btnCol = reqSpec.colorSpec?.buttonBackground || reqSpec.primaryButtonColor;
      uiPage.props.buttonColor = btnCol;
      uiPage.meta.primaryButtonColor = btnCol;
      allElements.forEach((el) => {
        if (el.type === 'button') {
          el.props = el.props || {};
          el.props.buttonColor = btnCol;
          el.props.style = {
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-text)',
            ...(el.props.style || {}),
          };
          if (el.props.className) {
            // Remove hardcoded static purple/indigo classes if user requested explicit color
            el.props.className = el.props.className
              .replace(/\bbg-(purple|indigo|violet)-\d+\b/g, '')
              .replace(/\btext-(purple|indigo|violet)-\d+\b/g, '')
              .trim();
          }
        }
      });
    }

    if (reqSpec.customBgColor || reqSpec.colorSpec?.background) {
      const bgCol = reqSpec.colorSpec?.background || reqSpec.customBgColor;
      uiPage.props.bgColor = bgCol;
      uiPage.meta.customBgColor = bgCol;
      if (bgCol === 'white' || bgCol === 'grey' || bgCol === 'light grey') uiPage.props.theme = 'light';
      else if (bgCol === 'black' || bgCol === 'dark' || bgCol === 'navy') uiPage.props.theme = 'dark';
    }
  }

  // Check 4: Login & Role Authentication Portals Requirement (Student Login, Teacher Login)
  if (reqSpec.loginTypes?.length > 0) {
    const hasAuthSection = allElements.some((el) => {
      const txt = (el.content || el.fallback || el.props?.label || '').toString().toLowerCase();
      return txt.includes('student login') || txt.includes('teacher login') || txt.includes('faculty login') || txt.includes('user login');
    });

    if (!hasAuthSection) {
      missing.push(`Role authentication portals (${reqSpec.loginTypes.join(', ')})`);

      const authElements = [
        {
          id: 'auth-header',
          type: 'text',
          content: `${reqSpec.domain === 'college' ? 'College' : 'Portal'} Role Login & Access`,
          props: { tag: 'h2' },
          fallback: 'Role Login & Access',
        },
      ];

      const loginCards = reqSpec.loginTypes.map((roleTitle, idx) => ({
        id: `card-${roleTitle.toLowerCase().replace(/\s+/g, '-')}`,
        title: roleTitle,
        description: `Access your personal ${roleTitle.replace('Login', '')} dashboard, announcements, and resources.`,
        price: 'Secure Auth',
        badge: roleTitle.includes('Student') ? 'Student Portal' : 'Faculty Portal',
        icon: roleTitle.includes('Student') ? 'pi pi-user' : 'pi pi-briefcase',
      }));

      authElements.push({
        id: 'auth-cards-grid',
        type: 'cards',
        props: {
          columns: loginCards.length,
          items: loginCards,
        },
        fallback: 'Login Portals Grid',
      });

      reqSpec.loginTypes.forEach((roleTitle) => {
        authElements.push({
          id: `btn-action-${roleTitle.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'button',
          content: roleTitle,
          props: { variant: 'primary', label: roleTitle, icon: 'pi pi-sign-in' },
          fallback: roleTitle,
        });
      });

      const authSection = {
        id: 'sec-auth-portal',
        type: 'features',
        elements: authElements,
      };

      const heroIdx = sections.findIndex((s) => s.type === 'hero');
      if (heroIdx !== -1) {
        sections.splice(heroIdx + 1, 0, authSection);
      } else {
        sections.unshift(authSection);
      }
    }
  }

  // Check 5: Explicit Brand Name Enforced on Page & Navbar
  if (reqSpec.explicitBrand) {
    uiPage.page = reqSpec.explicitBrand;
    uiPage.meta = uiPage.meta || {};
    uiPage.meta.title = reqSpec.explicitBrand;

    const navSec = sections.find((s) => s.type === 'navbar');
    if (navSec && Array.isArray(navSec.elements)) {
      const logoEl = navSec.elements.find((el) => (el.id || '').includes('logo') || (el.props?.tag || '').toLowerCase().startsWith('h'));
      if (logoEl) {
        logoEl.content = reqSpec.explicitBrand;
        logoEl.fallback = reqSpec.explicitBrand;
      }
    }
  }

  // Check 6: Explicit Hero Headline Enforced
  if (reqSpec.explicitHeadline) {
    const heroSec = sections.find((s) => s.type === 'hero');
    if (heroSec && Array.isArray(heroSec.elements)) {
      const titleEl = heroSec.elements.find((el) => (el.id || '').includes('title') || (el.props?.tag || '').toLowerCase() === 'h1');
      if (titleEl) {
        titleEl.content = reqSpec.explicitHeadline;
        titleEl.fallback = reqSpec.explicitHeadline;
      }
    }
  }

  // Check 7: Interactive FAQ Section Requirement
  if (reqSpec.requiredSections.includes('faq')) {
    const hasFaq = sections.some((s) => s.type === 'faq' || (s.id || '').includes('faq'));
    if (!hasFaq) {
      missing.push('Interactive FAQ accordion section');
      const faqSection = {
        id: 'sec-faq-accordion',
        type: 'features',
        elements: [
          { id: 'faq-title', type: 'text', content: 'Frequently Asked Questions', props: { tag: 'h2' }, fallback: 'Frequently Asked Questions' },
          {
            id: 'faq-cards',
            type: 'cards',
            props: {
              columns: 2,
              items: [
                { id: 'faq-1', title: 'How does this service work?', description: 'Our platform provides automated, streamlined workflows designed to deliver instant results with 24/7 reliability.', badge: 'General', icon: 'pi pi-question-circle' },
                { id: 'faq-2', title: 'What are the pricing and billing options?', description: 'We offer flexible month-to-month subscriptions as well as discounted annual plans with no hidden fees.', badge: 'Billing', icon: 'pi pi-credit-card' },
                { id: 'faq-3', title: 'Is customer support available?', description: 'Yes, our dedicated support team is available 24/7 via live chat, email, and scheduled onboarding calls.', badge: 'Support', icon: 'pi pi-phone' },
                { id: 'faq-4', title: 'Can I cancel or upgrade anytime?', description: 'You can upgrade, downgrade, or cancel your subscription at any time directly from your account settings.', badge: 'Policy', icon: 'pi pi-shield' },
              ],
            },
            fallback: 'FAQ Items',
          },
        ],
      };
      const footerIdx = sections.findIndex((s) => s.type === 'footer');
      if (footerIdx !== -1) sections.splice(footerIdx, 0, faqSection);
      else sections.push(faqSection);
    }
  }

  // Check 8: Contact / Inquiry Form Requirement
  if (reqSpec.requiredSections.includes('contact')) {
    const hasContact = sections.some((s) => s.type === 'contact' || (s.id || '').includes('contact'));
    if (!hasContact) {
      missing.push('Interactive contact & inquiry form');
      const contactSection = {
        id: 'sec-contact-form',
        type: 'cta',
        elements: [
          { id: 'contact-heading', type: 'text', content: 'Get in Touch with Us', props: { tag: 'h2' }, fallback: 'Get in Touch' },
          { id: 'contact-desc', type: 'text', content: 'Have a question or looking to start a new project? Send us a message and our team will get back to you within 24 hours.', props: { tag: 'p' }, fallback: 'Send us a message' },
          { id: 'input-name', type: 'input', content: 'Full Name', props: { label: 'Full Name', placeholder: 'Enter your full name' }, fallback: 'Full Name' },
          { id: 'input-email', type: 'input', content: 'Email Address', props: { label: 'Email Address', placeholder: 'name@example.com', inputType: 'email' }, fallback: 'Email Address' },
          { id: 'btn-contact-submit', type: 'button', content: 'Send Message', props: { variant: 'primary', label: 'Send Message', icon: 'pi pi-send' }, fallback: 'Send Message' },
        ],
      };
      const footerIdx = sections.findIndex((s) => s.type === 'footer');
      if (footerIdx !== -1) sections.splice(footerIdx, 0, contactSection);
      else sections.push(contactSection);
    }
  }

  return {
    page: { ...uiPage, sections },
    reqSpec,
    missingRequirements: missing,
  };
};

// ── Main Gate Function ────────────────────────────────────────────────────────

/**
 * Run the full quality gate pipeline on a freshly generated UIPage.
 *
 * @param {object} rawPage - raw Gemini output (already parsed JSON)
 * @param {string} userPrompt - original user prompt
 * @returns {object} GateResult
 */
const runGenerationQualityGate = (rawPage, userPrompt = '') => {
  const issues = [];
  const recommendations = [];
  let repairsApplied = [];

  // ── Early rejection: null / non-object / empty sections ───────────────────
  if (
    rawPage === null ||
    rawPage === undefined ||
    typeof rawPage !== 'object' ||
    !Array.isArray(rawPage.sections) ||
    rawPage.sections.length === 0
  ) {
    return {
      passed: false,
      page: null,
      qualityScore: 0,
      qualityGrade: 'F',
      matchScore: 0,
      repairsApplied: [],
      issues: ['AI output is null, empty, or missing sections — cannot produce a valid page'],
      recommendations: ['Retry generation with a more detailed prompt'],
      rejectionReason: 'Null or empty page — generation failed',
    };
  }

  // ── Step 1: Schema validation ──────────────────────────────────────────────
  const validation = validateUIPage(rawPage);
  if (!validation.valid) {
    issues.push(...(validation.errors || []).map((e) => `Schema: ${e}`));
  }
  if (validation.warnings?.length > 0) {
    recommendations.push(...validation.warnings.map((w) => `Warning: ${w}`));
  }

  // ── Step 2: Self-healing pass ──────────────────────────────────────────────
  const { healedPage, repairs } = healUIPage(validation.valid ? validation.page : rawPage);
  repairsApplied = repairs;

  // Re-validate after healing
  const healedValidation = validateUIPage(healedPage);
  if (!healedValidation.valid) {
    return {
      passed: false,
      page: healedPage,
      qualityScore: 0,
      qualityGrade: 'F',
      matchScore: 0,
      repairsApplied,
      issues: [...issues, 'UIPage failed schema validation even after self-healing attempt'],
      recommendations,
      rejectionReason: 'Schema validation failed after self-healing',
    };
  }

  const page = healedValidation.page;

  // ── Step 3: Domain detection ───────────────────────────────────────────────
  const domainRule = detectDomain(userPrompt);

  // ── Step 4: Image relevance gate ───────────────────────────────────────────
  const cleanedPage = rejectIrrelevantImages(page, domainRule);

  // ── Step 5: Requirement Coverage & Financial Healing Pass ──────────────────
  const { page: rawReqHealedPage, reqSpec, missingRequirements } = healMissingPromptRequirements(cleanedPage, userPrompt);
  const reqHealedPage = cleanAuthenticationAndDomainSemantics(rawReqHealedPage, reqSpec);
  if (missingRequirements.length > 0) {
    repairsApplied.push(...missingRequirements.map((m) => ({ type: 'requirement-heal', detail: m })));
  }

  // ── Step 6: Missing required sections check ────────────────────────────────
  const missingSections = detectMissingRequiredSections(reqHealedPage, domainRule);
  if (missingSections.length > 0) {
    issues.push(...missingSections);
  }

  // ── Step 7: Quality score ──────────────────────────────────────────────────
  const qualityResult = calculateQualityScore(reqHealedPage, userPrompt);
  const qualityScore = qualityResult.score;
  const qualityGrade = qualityResult.grade;

  if (qualityResult.issues) {
    qualityResult.issues.forEach((iss) => {
      if (!iss.includes('No critical quality')) issues.push(`Quality: ${iss}`);
    });
  }
  if (qualityResult.recommendations) {
    qualityResult.recommendations.forEach((rec) => {
      if (!rec.includes('meets high production')) recommendations.push(rec);
    });
  }

  // ── Step 8: Design-to-prompt match ────────────────────────────────────────
  const matchResult = validateDesignToCode(userPrompt, reqHealedPage);
  const matchScore = matchResult.matchScore;

  matchResult.missingSections?.forEach((ms) => recommendations.push(`Add missing section: ${ms}`));
  matchResult.missingCTAs?.forEach((mc) => issues.push(`Missing CTA: ${mc}`));
  matchResult.missingImages?.forEach((mi) => issues.push(`Missing imagery: ${mi}`));

  // ── Step 9: Gate decision ──────────────────────────────────────────────────
  const passed = qualityScore >= QUALITY_THRESHOLD && matchScore >= MATCH_THRESHOLD;
  const rejectionReason = !passed
    ? `Quality score ${qualityScore}/100 (min ${QUALITY_THRESHOLD}) and match score ${matchScore}/100 (min ${MATCH_THRESHOLD})`
    : null;

  return {
    passed,
    page: reqHealedPage,
    qualityScore,
    qualityGrade,
    matchScore,
    reqSpec,
    repairsApplied,
    issues,
    recommendations,
    rejectionReason,
  };
};

module.exports = {
  runGenerationQualityGate,
  detectDomain,
  detectMissingRequiredSections,
  rejectIrrelevantImages,
  QUALITY_THRESHOLD,
  MATCH_THRESHOLD,
};
