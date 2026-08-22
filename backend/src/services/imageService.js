/**
 * NeuraMind — Image Resolution Service
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
  fitness: {
    src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern boutique fitness and wellness gym studio',
  },
};

/**
 * Resolves a contextual query or keyword into a high-quality Unsplash image asset.
 *
 * @param {string} query - Keyword, category, or contextual query string
 * @param {string} [defaultAlt='Contextual image']
 * @returns {{ src: string, alt: string }}
 */
const resolveContextualImage = (query = '', defaultAlt = 'Contextual image') => {
  const q = String(query).toLowerCase().trim();

  // 1. Exact or partial keyword match in catalog
  for (const [key, asset] of Object.entries(CURATED_IMAGE_CATALOG)) {
    const normKey = key.replace('_', ' ');
    if (q.includes(normKey) || normKey.includes(q)) {
      return {
        src: asset.src,
        alt: asset.alt,
      };
    }
  }

  // 2. Keyword association mapping
  if (q.includes('food') || q.includes('dish') || q.includes('menu') || q.includes('lunch') || q.includes('dinner') || q.includes('meal')) {
    return CURATED_IMAGE_CATALOG.restaurant_hero;
  }
  if (q.includes('travel') || q.includes('flight') || q.includes('trip') || q.includes('holiday') || q.includes('tour') || q.includes('vacation')) {
    return CURATED_IMAGE_CATALOG.beach;
  }
  if (q.includes('hotel') || q.includes('stay') || q.includes('suite') || q.includes('room')) {
    return CURATED_IMAGE_CATALOG.hotel_room;
  }
  if (q.includes('shop') || q.includes('store') || q.includes('cloth') || q.includes('wear') || q.includes('apparel')) {
    return CURATED_IMAGE_CATALOG.fashion_hero;
  }
  if (q.includes('home') || q.includes('house') || q.includes('property') || q.includes('estate') || q.includes('apartment')) {
    return CURATED_IMAGE_CATALOG.villa;
  }
  if (q.includes('tech') || q.includes('saas') || q.includes('app') || q.includes('software') || q.includes('platform')) {
    return CURATED_IMAGE_CATALOG.workspace;
  }
  if (q.includes('code') || q.includes('develop') || q.includes('api') || q.includes('program')) {
    return CURATED_IMAGE_CATALOG.developer_code;
  }
  if (q.includes('health') || q.includes('med') || q.includes('doctor') || q.includes('care')) {
    return CURATED_IMAGE_CATALOG.clinic;
  }

  // 3. Fallback placeholder with high aesthetic contrast
  const encodedQuery = encodeURIComponent(query.slice(0, 30) || 'Visual Asset');
  return {
    src: `https://placehold.co/800x500/1a1a2e/6c63ff?text=${encodedQuery}`,
    alt: defaultAlt || query || 'Generated visual',
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

  // Determine if domain needs visual content
  const isFoodSite = promptLower.includes('food') || promptLower.includes('pizza') || promptLower.includes('restaurant') || promptLower.includes('burger') || promptLower.includes('cafe');
  const isTravelSite = promptLower.includes('travel') || promptLower.includes('hotel') || promptLower.includes('booking') || promptLower.includes('resort') || promptLower.includes('tour');
  const isFashionSite = promptLower.includes('fashion') || promptLower.includes('ecommerce') || promptLower.includes('store') || promptLower.includes('shop') || promptLower.includes('clothing');
  const isRealEstate = promptLower.includes('estate') || promptLower.includes('property') || promptLower.includes('house') || promptLower.includes('villa');

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

        // If existingSrc is placeholder or empty, resolve a contextual image
        if (!existingSrc || existingSrc.includes('placehold.co') || existingSrc.includes('placeholder')) {
          const resolved = resolveContextualImage(imageQuery, elProps.alt || 'Contextual image');
          elProps.src = resolved.src;
          elProps.alt = elProps.alt || resolved.alt;

          return {
            ...el,
            content: {
              src: resolved.src,
              alt: elProps.alt,
              imageQuery,
            },
            props: elProps,
          };
        }
      }

      // Case 2: Cards / Card element
      if (elType === 'cards' || elType === 'card') {
        if (Array.isArray(elProps.items)) {
          elProps.items = elProps.items.map((item, idx) => {
            if (!item || typeof item !== 'object') return item;

            const existingItemSrc = item.src || item.image || '';
            const itemQuery = item.imageQuery || item.title || `${userPrompt} item ${idx + 1}`;

            // If it's a food, travel, fashion, or real estate site, ensure card has appropriate photo
            if (isFoodSite || isTravelSite || isFashionSite || isRealEstate || existingItemSrc.includes('placehold.co')) {
              const resolved = resolveContextualImage(itemQuery, item.title || 'Card image');
              return {
                ...item,
                src: item.src || resolved.src,
                image: item.image || resolved.src,
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
