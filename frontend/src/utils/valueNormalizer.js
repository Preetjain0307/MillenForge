/**
 * NeuraMind — Safe Value Normalizer & Display Resolver
 *
 * Prevents "Objects are not valid as a React child" errors by safely
 * extracting displayable primitive values (strings, numbers) from any
 * JavaScript data structure (string, number, boolean, null, undefined, object, array).
 *
 * Implements intelligent display key resolution:
 *   { id: "pizza", label: "Pizza" } -> "Pizza"
 *   { text: "Fresh pizza" } -> "Fresh pizza"
 *   { title: "Margherita", description: "Classic tomato" } -> "Margherita" / "Classic tomato"
 *   [{ label: "Pizza" }, { label: "Pasta" }] -> "Pizza, Pasta"
 *   Malformed / cyclic objects -> safe fallback without React crashes
 */

/**
 * Safely extracts a displayable string from any JavaScript value.
 *
 * @param {*} value - Any value that might be passed to a React child or prop
 * @param {string} [fallback=''] - Safe fallback string if extraction yields empty
 * @param {string} [preferredKey=null] - Preferred object key to check first (e.g. 'title', 'label', 'description')
 * @returns {string} Safe display string (guaranteed never to return a raw object)
 */
export const resolveDisplayString = (value, fallback = '', preferredKey = null) => {
  if (value === null || value === undefined) {
    return typeof fallback === 'string' ? fallback : '';
  }

  // Primitive strings
  if (typeof value === 'string') {
    if (value.trim() === '') {
      return typeof fallback === 'string' ? fallback : '';
    }
    return value;
  }

  // Primitive numbers and booleans
  if (typeof value === 'number') {
    return isNaN(value) ? (typeof fallback === 'string' ? fallback : '') : String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // Arrays: safely resolve each item and join
  if (Array.isArray(value)) {
    const resolvedItems = value
      .map((item) => resolveDisplayString(item, ''))
      .filter((s) => s.trim().length > 0);
    return resolvedItems.length > 0 ? resolvedItems.join(', ') : (typeof fallback === 'string' ? fallback : '');
  }

  // Objects
  if (typeof value === 'object') {
    try {
      // 1. Try preferred key if specified
      if (preferredKey && typeof value[preferredKey] !== 'undefined' && value[preferredKey] !== null) {
        const prefResolved = resolveDisplayString(value[preferredKey], '');
        if (prefResolved.trim().length > 0) {
          return prefResolved;
        }
      }

      // 2. Try common display keys in priority order
      const candidateKeys = [
        'label',
        'text',
        'title',
        'name',
        'description',
        'content',
        'value',
        'caption',
        'heading',
        'message',
        'alt',
        'src',
      ];

      for (const key of candidateKeys) {
        if (key in value && value[key] !== null && value[key] !== undefined) {
          const candidateResolved = resolveDisplayString(value[key], '');
          if (candidateResolved.trim().length > 0) {
            return candidateResolved;
          }
        }
      }

      // 3. If object only has an 'id' string and no other candidate keys
      if ('id' in value && typeof value.id === 'string' && value.id.trim().length > 0) {
        return value.id;
      }

      // 4. Look for any primitive string/number values on the object
      const values = Object.values(value).filter(
        (v) => (typeof v === 'string' && v.trim().length > 0) || typeof v === 'number'
      );
      if (values.length > 0) {
        return String(values[0]);
      }
    } catch (_) {
      // Fall through to fallback on any object inspection error
    }

    return typeof fallback === 'string' ? fallback : '';
  }

  return typeof fallback === 'string' ? fallback : '';
};

/**
 * Normalizes element content and props so that any nested objects
 * or arrays are safely structured for React rendering.
 *
 * @param {object} element
 * @returns {object} Normalized element clone
 */
export const normalizeElementData = (element) => {
  if (!element || typeof element !== 'object') {
    return {
      id: 'unknown',
      type: 'text',
      content: '',
      fallback: '',
      props: {},
    };
  }

  const rawType = typeof element.type === 'string' ? element.type.toLowerCase().trim() : 'text';
  const rawId = typeof element.id === 'string' && element.id.trim() !== ''
    ? element.id.trim()
    : `el-${Math.random().toString(36).slice(2, 8)}`;

  const fallbackStr = resolveDisplayString(element.fallback, '');
  const baseProps = (element.props && typeof element.props === 'object' && !Array.isArray(element.props))
    ? { ...element.props }
    : {};

  // For image elements, preserve structured src/alt while resolving string content
  let contentStr = '';
  if (rawType === 'image') {
    if (typeof element.content === 'string') {
      contentStr = element.content;
    } else if (element.content && typeof element.content === 'object') {
      contentStr = element.content.src || element.content.url || '';
      if (!baseProps.src && contentStr) baseProps.src = contentStr;
      if (!baseProps.alt && element.content.alt) baseProps.alt = resolveDisplayString(element.content.alt, 'Image');
    }
    if (!baseProps.src && contentStr) baseProps.src = contentStr;
  } else if (rawType === 'card' || rawType === 'cards') {
    // For cards, extract title and description if content is an object
    if (element.content && typeof element.content === 'object' && !Array.isArray(element.content)) {
      if (!baseProps.title && element.content.title) baseProps.title = resolveDisplayString(element.content.title, '');
      if (!baseProps.description && element.content.description) baseProps.description = resolveDisplayString(element.content.description, '');
      if (!baseProps.badge && element.content.badge) baseProps.badge = resolveDisplayString(element.content.badge, '');
      if (!baseProps.icon && element.content.icon) baseProps.icon = typeof element.content.icon === 'string' ? element.content.icon : '';
      if (!baseProps.src && (element.content.src || element.content.image)) baseProps.src = element.content.src || element.content.image;
      if (!baseProps.price && element.content.price) baseProps.price = resolveDisplayString(element.content.price, '');
    }
    contentStr = resolveDisplayString(element.content, fallbackStr, 'description');
  } else {
    contentStr = resolveDisplayString(element.content, fallbackStr);
  }

  // Normalize repeating items if present
  const items = Array.isArray(element.items)
    ? element.items
    : (Array.isArray(baseProps.items) ? baseProps.items : undefined);

  if (items) {
    baseProps.items = items.map((item, idx) => {
      if (!item || typeof item !== 'object') {
        return {
          id: `item-${idx}`,
          title: resolveDisplayString(item, `Item ${idx + 1}`),
          description: '',
        };
      }
      return {
        ...item,
        id: typeof item.id === 'string' ? item.id : `item-${idx}`,
        title: resolveDisplayString(item.title, `Item ${idx + 1}`, 'title'),
        description: resolveDisplayString(item.description || item.content, '', 'description'),
        icon: typeof item.icon === 'string' ? item.icon : (item.icon?.name || item.icon?.icon || ''),
        badge: resolveDisplayString(item.badge, '', 'badge'),
        price: resolveDisplayString(item.price, '', 'price'),
        src: item.src || item.image || (typeof item.content === 'object' ? item.content.src : '') || '',
        alt: resolveDisplayString(item.alt || item.title, 'Item image', 'alt'),
      };
    });
  }

  return {
    ...element,
    id: rawId,
    type: rawType,
    content: contentStr,
    fallback: fallbackStr,
    props: baseProps,
    ...(items ? { items: baseProps.items } : {}),
  };
};
