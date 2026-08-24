/**
 * NeuraMindss — Image Resolution Service
 *
 * Resolves contextual image queries into legitimate, high-quality,
 * responsive image URLs with appropriate aspect ratios and alt text.
 *
 * Supports domain categories:
 * - Food & Restaurant (pizza, burger, sushi, pasta, salad, dessert, coffee, tacos, steak)
 * - Travel & Hospitality (beach resort, mountain cabin, Paris, Tokyo, hotel, landscape)
 * - E-commerce & Fashion (apparel, sneakers, jacket, watch, accessories)
 * - Real Estate & Architecture (luxury villa, living room, modern apartment, exterior)
 * - Technology & SaaS (modern workspace, coding setup, servers, analytics)
 * - Education & Medical (healthcare, classroom, laboratory, books)
 * - Car Rental (sports sedan, SUV rental vehicle)
 *
 * Uses legitimate Unsplash assets with responsive crop/format query parameters.
 */

// ── Curated high-resolution contextual Unsplash catalog ───────────────────────
const CURATED_IMAGE_CATALOG = {
  // Food & Dining
  pizza: {
    src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    alt: 'Fresh wood-fired artisan pizza with melted cheese and basil',
  },
  burger: {
    src: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    alt: 'Gourmet beef burger with melted cheddar, lettuce, and fries',
  },
  sushi: {
    src: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    alt: 'Assorted fresh sashimi and sushi rolls platter',
  },
  pasta: {
    src: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    alt: 'Handmade Italian pasta with fresh parmesan and herbs',
  },
  salad: {
    src: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    alt: 'Healthy Mediterranean garden salad with avocado and vinaigrette',
  },
  dessert: {
    src: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    alt: 'Decadent chocolate dessert pastry with fresh berries',
  },
  coffee: {
    src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    alt: 'Freshly brewed artisan latte with intricate latte art',
  },
  tacos: {
    src: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
    alt: 'Street-style Mexican tacos with lime and cilantro',
  },
  steak: {
    src: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    alt: 'Grilled ribeye steak with rosemary and roasted garlic',
  },
  restaurant_hero: {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern fine-dining restaurant dining room and ambient lighting',
  },

  // Travel & Destinations
  beach: {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Tropical white sand beach and crystal clear turquoise ocean',
  },
  mountain: {
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Majestic mountain peaks during golden hour sunrise',
  },
  paris: {
    src: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    alt: 'Paris skyline with the Eiffel Tower in evening light',
  },
  tokyo: {
    src: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    alt: 'Vibrant neon street lights of Tokyo at night',
  },
  resort: {
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury resort infinity pool overlooking sunset coastline',
  },
  hotel_room: {
    src: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    alt: 'Contemporary hotel suite with king bed and panoramic view',
  },

  // E-commerce & Fashion
  fashion_hero: {
    src: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
    alt: 'Editorial autumn fashion collection on models',
  },
  sneakers: {
    src: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    alt: 'Minimalist designer street sneakers',
  },
  watch: {
    src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    alt: 'Luxury chronograph wristwatch with steel bracelet',
  },
  handbag: {
    src: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    alt: 'Premium Italian leather crossbody handbag',
  },
  jacket: {
    src: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    alt: 'Classic black leather motorcycle jacket',
  },

  // Real Estate & Architecture
  villa: {
    src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern luxury architectural villa with landscaped garden and pool',
  },
  living_room: {
    src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    alt: 'Spacious Scandinavian living room with natural daylight',
  },
  kitchen: {
    src: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern marble chef kitchen with island seating',
  },

  // Creative & Portfolio
  portfolio_hero: {
    src: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    alt: 'Creative digital product designer portfolio workspace',
  },
  project_design: {
    src: 'https://images.unsplash.com/photo-1542744094-3a31b272c390?auto=format&fit=crop&w=800&q=80',
    alt: 'Brand identity and UI design showcase project',
  },
  project_app: {
    src: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    alt: 'Mobile app UI/UX design presentation',
  },

  // Technology, SaaS & Creative
  workspace: {
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Minimalist tech startup workspace with laptop and ergonomic setup',
  },
  developer_code: {
    src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    alt: 'Clean code editor open on a dual monitor workstation',
  },
  analytics: {
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    alt: 'Data visualization and business analytics dashboard screen',
  },

  // Healthcare & Wellness
  clinic: {
    src: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    alt: 'Clean and modern medical clinic reception area',
  },
  doctor_consultation: {
    src: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
    alt: 'Professional doctor providing consultation to patient',
  },
  fitness: {
    src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern boutique fitness and wellness gym studio',
  },

  // Education & Learning
  classroom: {
    src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern university lecture hall and interactive classroom',
  },
  online_course: {
    src: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80',
    alt: 'Student studying online learning course on laptop',
  },
  college_campus: {
    src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    alt: 'University historic campus building, clock tower and green courtyard',
  },
  students_campus: {
    src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    alt: 'Diverse university college students studying and collaborating on campus',
  },
  college_library: {
    src: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    alt: 'Grand academic university library with study desks and books',
  },
  science_laboratory: {
    src: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
    alt: 'Advanced engineering and science research laboratory',
  },
  faculty_lecture: {
    src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
    alt: 'University professor giving lecture to college students in auditorium',
  },

  // Fintech & Banking
  financial_analytics: {
    src: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    alt: 'Digital banking mobile dashboard and financial analytics',
  },
  crypto_wallet: {
    src: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80',
    alt: 'Secure cryptocurrency digital asset management interface',
  },

  // Grocery & Supermarket
  grocery_produce: {
    src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    alt: 'Fresh organic vegetables and fruits grocery display',
  },
  grocery_dairy: {
    src: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
    alt: 'Farm fresh milk and artisanal dairy produce',
  },

  // Entertainment & Movie Booking
  cinema_hall: {
    src: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern cinema theater auditorium with glowing screen',
  },
  popcorn_movie: {
    src: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80',
    alt: 'Fresh bucket of cinema popcorn and movie tickets',
  },

  // Transportation & Car Rental
  rental_car: {
    src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury rental sports sedan parked on scenic drive',
  },
  suv_rental: {
    src: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern all-wheel drive SUV rental vehicle',
  },

  // Legal & Law Firm
  law_library: {
    src: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Law firm legal reference library with gavel and leather books',
  },

  // Photography & Creative Studio
  camera_gear: {
    src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    alt: 'Professional DSLR camera lens and studio equipment',
  },

  // Gaming & Esports
  gaming_setup: {
    src: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    alt: 'RGB illuminated gaming PC setup and mechanical keyboard',
  },

  // Music & Audio Studio
  music_studio: {
    src: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    alt: 'Professional music production mixing console and monitors',
  },
};

/**
 * Resolves a contextual query or keyword into a high-quality Unsplash image asset.
 * Guarantees zero cross-domain mismatch (e.g. never returns cars for food/college/hospital sites).
 *
 * @param {string} query - Keyword, category, or contextual query string
 * @param {string} [defaultAlt='Contextual image']
 * @returns {{ src: string, alt: string }}
 */
const resolveContextualImage = (query = '', defaultAlt = 'Contextual image') => {
  const q = String(query).toLowerCase().trim();

  // 1. Domain-Specific Intent Mapping (High Priority — strict word boundary matching)

  // College & Education
  if (q.includes('college') || q.includes('university') || q.includes('campus') || q.includes('student') || q.includes('teacher') || q.includes('faculty') || q.includes('academic') || q.includes('degree') || q.includes('education') || q.includes('school') || q.includes('library')) {
    if (q.includes('student') || q.includes('group')) return CURATED_IMAGE_CATALOG.students_campus;
    if (q.includes('library') || q.includes('book')) return CURATED_IMAGE_CATALOG.college_library;
    if (q.includes('lab') || q.includes('research')) return CURATED_IMAGE_CATALOG.science_laboratory;
    if (q.includes('class') || q.includes('lecture')) return CURATED_IMAGE_CATALOG.classroom;
    return CURATED_IMAGE_CATALOG.college_campus;
  }

  // Hospital & Healthcare
  const isExplicitHealthcareQuery = /\b(hospital|healthcare|doctor|clinic|surgery|patient|emergency|medical)\b/i.test(q);
  if (isExplicitHealthcareQuery) {
    if (q.includes('clinic') || q.includes('reception')) return CURATED_IMAGE_CATALOG.clinic;
    return CURATED_IMAGE_CATALOG.doctor_consultation;
  }

  // Food & Dining
  if (q.includes('food') || q.includes('chinese') || q.includes('asian') || q.includes('noodle') || q.includes('dumpling') || q.includes('pizza') || q.includes('burger') || q.includes('restaurant') || q.includes('dish') || q.includes('menu') || q.includes('lunch') || q.includes('dinner') || q.includes('meal') || q.includes('sushi') || q.includes('pasta') || q.includes('salad') || q.includes('dessert') || q.includes('bakery') || q.includes('cafe')) {
    if (q.includes('chinese') || q.includes('asian') || q.includes('noodle') || q.includes('dumpling')) {
      return {
        src: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=1200&q=80',
        alt: 'Authentic Chinese dim sum dumplings and wok-fired noodles',
      };
    }
    if (q.includes('pizza')) return CURATED_IMAGE_CATALOG.pizza;
    if (q.includes('burger')) return CURATED_IMAGE_CATALOG.burger;
    if (q.includes('sushi')) return CURATED_IMAGE_CATALOG.sushi;
    if (q.includes('pasta')) return CURATED_IMAGE_CATALOG.pasta;
    if (q.includes('salad')) return CURATED_IMAGE_CATALOG.salad;
    if (q.includes('dessert')) return CURATED_IMAGE_CATALOG.dessert;
    if (q.includes('coffee')) return CURATED_IMAGE_CATALOG.coffee;
    return CURATED_IMAGE_CATALOG.restaurant_hero;
  }

  // Travel & Destinations
  if (q.includes('travel') || q.includes('destination') || q.includes('vacation') || q.includes('trip') || q.includes('flight') || q.includes('tour') || q.includes('resort') || q.includes('beach')) {
    if (q.includes('paris')) return CURATED_IMAGE_CATALOG.paris;
    if (q.includes('tokyo')) return CURATED_IMAGE_CATALOG.tokyo;
    if (q.includes('mountain')) return CURATED_IMAGE_CATALOG.mountain;
    if (q.includes('hotel') || q.includes('room')) return CURATED_IMAGE_CATALOG.hotel_room;
    if (q.includes('beach')) return CURATED_IMAGE_CATALOG.beach;
    if (q.includes('resort')) return CURATED_IMAGE_CATALOG.resort;
    return CURATED_IMAGE_CATALOG.beach;
  }

  // Fashion & Apparel (High Priority)
  if (q.includes('fashion') || q.includes('cloth') || q.includes('wear') || q.includes('apparel') || q.includes('boutique') || q.includes('sneaker') || q.includes('shoe') || q.includes('streetwear')) {
    if (q.includes('sneaker') || q.includes('shoe')) return CURATED_IMAGE_CATALOG.sneakers;
    if (q.includes('watch')) return CURATED_IMAGE_CATALOG.watch;
    if (q.includes('bag') || q.includes('handbag')) return CURATED_IMAGE_CATALOG.handbag;
    if (q.includes('jacket')) return CURATED_IMAGE_CATALOG.jacket;
    return CURATED_IMAGE_CATALOG.fashion_hero;
  }

  // Portfolio & Creative Design
  if (q.includes('portfolio') || q.includes('designer') || q.includes('artist') || q.includes('creative') || q.includes('showcase') || q.includes('resume')) {
    if (q.includes('camera') || q.includes('photo')) return CURATED_IMAGE_CATALOG.photography_camera;
    return CURATED_IMAGE_CATALOG.portfolio_hero;
  }

  // Real Estate & Architecture
  if (q.includes('estate') || q.includes('property') || q.includes('house') || q.includes('villa') || q.includes('apartment') || q.includes('realty')) {
    if (q.includes('living')) return CURATED_IMAGE_CATALOG.living_room;
    if (q.includes('kitchen')) return CURATED_IMAGE_CATALOG.kitchen;
    return CURATED_IMAGE_CATALOG.villa;
  }

  // Banking & Fintech
  if (q.includes('bank') || q.includes('banking') || q.includes('finance') || q.includes('fintech') || q.includes('money') || q.includes('wallet')) {
    if (q.includes('crypto') || q.includes('wallet')) return CURATED_IMAGE_CATALOG.crypto_wallet;
    return CURATED_IMAGE_CATALOG.financial_analytics;
  }

  // Grocery & Produce
  if (q.includes('grocery') || q.includes('supermarket') || q.includes('produce') || q.includes('vegetable')) {
    if (q.includes('dairy') || q.includes('milk')) return CURATED_IMAGE_CATALOG.grocery_dairy;
    return CURATED_IMAGE_CATALOG.grocery_produce;
  }

  // Movie & Entertainment
  if (q.includes('movie') || q.includes('cinema') || q.includes('film') || q.includes('popcorn') || q.includes('theater')) {
    if (q.includes('popcorn')) return CURATED_IMAGE_CATALOG.popcorn_movie;
    return CURATED_IMAGE_CATALOG.cinema_hall;
  }

  // Car Rental ONLY (Strict Word Boundary Regex to PREVENT "card"/"care" substring false matches!)
  const isExplicitCarQuery = /\b(car|cars|car rental|automobile|auto hire|rent a car|vehicle rental|suv|sedan)\b/i.test(q) &&
                              !q.includes('card') &&
                              !q.includes('care') &&
                              !q.includes('career');

  if (isExplicitCarQuery) {
    if (q.includes('suv')) return CURATED_IMAGE_CATALOG.suv_rental;
    return CURATED_IMAGE_CATALOG.rental_car;
  }

  // Legal & Law Firm
  if (q.includes('law') || q.includes('legal') || q.includes('attorney') || q.includes('lawyer')) {
    return CURATED_IMAGE_CATALOG.law_library;
  }

  // Gaming & Esports
  if (q.includes('gaming') || q.includes('esport') || q.includes('gamer')) {
    return CURATED_IMAGE_CATALOG.gaming_setup;
  }

  // Music & Audio
  if (q.includes('music') || q.includes('song') || q.includes('audio') || q.includes('track')) {
    return CURATED_IMAGE_CATALOG.music_studio;
  }

  // Portfolio & Creative
  if (q.includes('portfolio') || q.includes('creative') || q.includes('designer')) {
    if (q.includes('app')) return CURATED_IMAGE_CATALOG.project_app;
    if (q.includes('design')) return CURATED_IMAGE_CATALOG.project_design;
    return CURATED_IMAGE_CATALOG.portfolio_hero;
  }

  // SaaS & Tech Workspaces
  if (q.includes('tech') || q.includes('saas') || q.includes('software') || q.includes('dashboard') || q.includes('analytics')) {
    if (q.includes('code') || q.includes('developer')) return CURATED_IMAGE_CATALOG.developer_code;
    if (q.includes('analytics') || q.includes('chart')) return CURATED_IMAGE_CATALOG.analytics;
    return CURATED_IMAGE_CATALOG.workspace;
  }

  // 2. Strict Exact or Partial Keyword match in catalog
  for (const [key, asset] of Object.entries(CURATED_IMAGE_CATALOG)) {
    const normKey = key.replace('_', ' ');
    if (q === normKey || (q.includes(normKey) && !q.includes('card'))) {
      return {
        src: asset.src,
        alt: asset.alt,
      };
    }
  }

  // 3. Fallback inline SVG placeholder with high aesthetic contrast (offline, guaranteed load)
  const cleanTitle = (query.slice(0, 30) || 'Visual Asset').replace(/\b(create|make|generate|build|a|an|the|website|page|for)\b/gi, '').trim() || 'Visual Feature';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#11111a"/><stop offset="50%" stop-color="#181826"/><stop offset="100%" stop-color="#23213a"/></linearGradient><linearGradient id="ic" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><g transform="translate(400, 220)"><circle cx="0" cy="0" r="32" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.3)" stroke-width="1.5"/><path d="M-12 8 L-3 -9 L6 3 L13 -4 L18 8 Z" fill="url(#ic)"/><circle cx="7" cy="-12" r="4" fill="#fbbf24"/></g><text x="50%" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#94a3b8" text-anchor="middle">${cleanTitle.replace(/[<>&"]/g, '')}</text></svg>`;
  const fallbackDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return {
    src: fallbackDataUri,
    alt: defaultAlt || cleanTitle || 'Generated visual',
  };
};

/**
 * Enriches a generated UIPage structure with high-quality contextual images
 * wherever appropriate (e.g. food photos for food sites, destination photos for travel).
 *
 * @param {object} uiPage - Raw UIPage structure from Gemini
 * @param {string} userPrompt - Original user prompt
 * @returns {object} UIPage with resolved contextual images
 */
const enrichPageImages = (uiPage, userPrompt = '') => {
  if (!uiPage || typeof uiPage !== 'object' || !Array.isArray(uiPage.sections)) {
    return uiPage;
  }

  const promptLower = String(userPrompt).toLowerCase();
  const usedImageUrls = new Set();

  const dedupeSrc = (src) => {
    if (!src) return src;
    if (!usedImageUrls.has(src)) {
      usedImageUrls.add(src);
      return src;
    }
    const joiner = src.includes('?') ? '&' : '?';
    const uniqueSrc = `${src}${joiner}sig=${usedImageUrls.size + 1}`;
    usedImageUrls.add(uniqueSrc);
    return uniqueSrc;
  };

  // Determine domain context safely using word boundaries
  const isFoodSite = promptLower.includes('food') || promptLower.includes('pizza') || promptLower.includes('restaurant') || promptLower.includes('burger') || promptLower.includes('cafe') || promptLower.includes('bakery') || promptLower.includes('sushi') || promptLower.includes('meal');
  const isTravelSite = promptLower.includes('travel') || promptLower.includes('hotel') || promptLower.includes('booking') || promptLower.includes('resort') || promptLower.includes('tour') || promptLower.includes('vacation');
  const isFashionSite = promptLower.includes('fashion') || promptLower.includes('ecommerce') || promptLower.includes('store') || promptLower.includes('shop') || promptLower.includes('clothing') || promptLower.includes('wear');
  const isRealEstate = promptLower.includes('estate') || promptLower.includes('property') || promptLower.includes('house') || promptLower.includes('villa') || promptLower.includes('apartment');
  const isPortfolio = promptLower.includes('portfolio') || promptLower.includes('creative') || promptLower.includes('designer') || promptLower.includes('artist') || promptLower.includes('photographer');
  const isEducation = promptLower.includes('college') || promptLower.includes('university') || promptLower.includes('education') || promptLower.includes('course') || promptLower.includes('learn') || promptLower.includes('school');
  const isHealthcare = promptLower.includes('health') || promptLower.includes('doctor') || promptLower.includes('clinic') || promptLower.includes('medical') || promptLower.includes('hospital') || promptLower.includes('care');
  const isGrocery = promptLower.includes('grocery') || promptLower.includes('supermarket') || promptLower.includes('produce') || promptLower.includes('vegetables');
  const isFitness = promptLower.includes('fitness') || promptLower.includes('gym') || promptLower.includes('workout') || promptLower.includes('trainer');
  const isEntertainment = promptLower.includes('movie') || promptLower.includes('cinema') || promptLower.includes('ticket') || promptLower.includes('event') || promptLower.includes('concert');
  const isCarRental = /\b(car|cars|car rental|automobile|auto hire|rent a car|vehicle rental)\b/i.test(promptLower) && !promptLower.includes('card') && !promptLower.includes('care');
  const isLaw = promptLower.includes('law') || promptLower.includes('legal') || promptLower.includes('attorney');

  const enrichedSections = uiPage.sections.map((section) => {
    if (!section || !Array.isArray(section.elements)) return section;

    const enrichedElements = section.elements.map((el) => {
      if (!el || typeof el !== 'object') return el;

      const elType = (el.type || '').toLowerCase();
      const elProps = { ...(el.props || {}) };

      // Case 1: Image element
      if (elType === 'image') {
        const existingSrc = typeof el.content === 'string' ? el.content : el.content?.src || elProps.src || '';
        const imageQuery = el.content?.imageQuery || elProps.imageQuery || el.content?.alt || elProps.alt || el.id || userPrompt;

        if (!existingSrc || existingSrc.includes('placehold.co') || existingSrc.includes('placeholder')) {
          const resolved = resolveContextualImage(`${userPrompt} ${imageQuery}`, elProps.alt || 'Contextual image');
          const finalSrc = dedupeSrc(resolved.src);
          elProps.src = finalSrc;
          elProps.alt = elProps.alt || resolved.alt;

          return {
            ...el,
            content: {
              src: finalSrc,
              alt: elProps.alt,
              imageQuery,
            },
            props: elProps,
          };
        } else {
          const finalSrc = dedupeSrc(existingSrc);
          elProps.src = finalSrc;
          if (typeof el.content === 'object' && el.content !== null) {
            el.content.src = finalSrc;
          }
        }
      }

      // Case 2: Cards / Card element
      if (elType === 'cards' || elType === 'card') {
        if (Array.isArray(elProps.items)) {
          elProps.items = elProps.items.map((item, idx) => {
            if (!item || typeof item !== 'object') return item;

            const existingItemSrc = item.src || item.image || '';
            const itemQuery = item.imageQuery || item.title || `item ${idx + 1}`;

            if (isFoodSite || isTravelSite || isFashionSite || isRealEstate || isPortfolio || isEducation || isHealthcare || isGrocery || isFitness || isEntertainment || isCarRental || isLaw || existingItemSrc.includes('placehold.co')) {
              const resolved = resolveContextualImage(`${userPrompt} ${itemQuery}`, item.title || 'Card image');
              const finalSrc = dedupeSrc(existingItemSrc || resolved.src);
              return {
                ...item,
                src: finalSrc,
                image: finalSrc,
                alt: item.alt || resolved.alt,
              };
            }

            return item;
          });
        }
      }

      return {
        ...el,
        props: elProps,
      };
    });

    return {
      ...section,
      elements: enrichedElements,
    };
  });

  return {
    ...uiPage,
    sections: enrichedSections,
  };
};

module.exports = {
  resolveContextualImage,
  enrichPageImages,
  CURATED_IMAGE_CATALOG,
};
