/**
 * UIRenderer — Renders a UIPage structure into React components
 *
 * Architecture:
 *   UIPage → UISection[] → UIElement[]
 *              ↓                ↓
 *       SectionRenderer   ElementRenderer
 *                              ↓
 *                    ELEMENT_REGISTRY[element.type]
 *                              ↓
 *                       React component
 *
 * Supported element types:
 *   text | image | button | input | textfield | card | cards |
 *   carousel | wizard | icon | divider | link | list | badge
 *
 * Safety Guarantees:
 * - Never throws "Objects are not valid as a React child".
 * - Intelligently resolves display fields: text, label, title, name, description, value, content, src, alt.
 * - Handles string, number, boolean, null, undefined, object, and array values gracefully.
 * - Unknown types: renders a safe placeholder — never crashes.
 * - Malformed elements: caught by ElementErrorBoundary — never crashes.
 */

import { Component } from 'react';
import NmButton from './NmButton';
import { resolveDisplayString, normalizeElementData } from '../utils/valueNormalizer';

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Safely resolve display content from string, object, or fallback.
 * @param {object} element
 * @param {string} [preferredKey=null]
 * @returns {string}
 */
const safeContent = (element, preferredKey = null) => {
  if (!element) return '';
  const c = resolveDisplayString(element.content, '', preferredKey);
  if (c.trim() !== '') return c;
  const f = resolveDisplayString(element.fallback, '', preferredKey);
  if (f.trim() !== '') return f;
  return '';
};

/**
 * Safely read element.props with fallback to empty object.
 * @param {object} element
 * @returns {object}
 */
const safeProps = (element) =>
  element && typeof element.props === 'object' && element.props !== null && !Array.isArray(element.props)
    ? element.props
    : {};

/**
 * Normalize an element object using the central value normalizer.
 * @param {*} raw
 * @returns {object}
 */
const normalizeElement = (raw) => normalizeElementData(raw);

// ─── Error Boundary ───────────────────────────────────────────────────────────

/**
 * Wraps each individual element render.
 * If one element throws, the rest of the page still renders safely.
 */
class ElementErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || 'Render error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="px-3 py-2 rounded-[var(--nm-radius-sm)] border border-dashed border-[var(--nm-error)]
                     text-xs text-[var(--nm-error)] flex items-center gap-2"
        >
          <i className="pi pi-exclamation-triangle" aria-hidden="true" />
          Element render error: {resolveDisplayString(this.state.message, 'Render error')}
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Element Registry ─────────────────────────────────────────────────────────
// Each entry is a function: (element) => JSX

const ELEMENT_REGISTRY = {

  // ── Text ──────────────────────────────────────────────────────────────────
  text: (element) => {
    const display = safeContent(element, 'text');
    const props = safeProps(element);
    const ALLOWED_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'strong', 'em'];
    const Tag = ALLOWED_TAGS.includes(props.tag) ? props.tag : 'p';

    const tagClasses = {
      h1: 'text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight nm-gradient-text leading-tight mb-3',
      h2: 'text-2xl sm:text-3xl font-bold tracking-tight text-[var(--nm-text-primary)] mb-2.5',
      h3: 'text-xl sm:text-2xl font-bold text-[var(--nm-text-primary)] mb-2',
      h4: 'text-lg font-semibold text-[var(--nm-text-primary)] mb-1',
      p: 'text-sm sm:text-base text-[var(--nm-text-secondary)] leading-relaxed mb-1',
      span: 'text-sm text-[var(--nm-text-secondary)]',
      label: 'text-xs font-semibold text-[var(--nm-text-muted)] uppercase tracking-wider',
    }[Tag] || 'text-sm text-[var(--nm-text-primary)] leading-relaxed';

    return (
      <Tag
        id={element.id}
        className={`${tagClasses} ${props.className || ''}`}
      >
        {display || <span className="text-[var(--nm-text-muted)] italic">(empty text)</span>}
      </Tag>
    );
  },

  // ── Image ─────────────────────────────────────────────────────────────────
  image: (element) => {
    const props = safeProps(element);
    let src = '';
    if (typeof element.content === 'string' && element.content.trim() !== '') {
      src = element.content;
    } else if (element.content && typeof element.content === 'object') {
      src = element.content.src || element.content.url || '';
    }
    if (!src) src = props.src || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';

    const alt = resolveDisplayString(
      props.alt || (typeof element.content === 'object' ? element.content.alt : '') || element.fallback,
      'Generated visual',
      'alt'
    );

    return (
      <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] group">
        <img
          id={element.id}
          src={src}
          alt={alt}
          className={`w-full h-auto max-h-[480px] object-cover transition-transform duration-500 group-hover:scale-102 ${props.className || ''}`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';
            e.currentTarget.alt = 'Visual asset';
          }}
        />
      </div>
    );
  },

  // ── Button ────────────────────────────────────────────────────────────────
  button: (element) => {
    const display = resolveDisplayString(element.content || element.fallback, 'Button', 'label');
    const props = safeProps(element);
    const label = resolveDisplayString(props.label || display, 'Button', 'label');
    const icon = typeof props.icon === 'string' ? props.icon : (props.icon?.name || props.icon?.icon || '');

    return (
      <NmButton
        id={element.id}
        variant={props.variant || 'primary'}
        label={label}
        icon={icon || undefined}
        className={`font-semibold shadow-md ${props.className || ''}`}
        aria-label={resolveDisplayString(props['aria-label'] || label, 'Button')}
        onClick={() => {}}
        type="button"
      />
    );
  },

  // ── Input / Textfield ─────────────────────────────────────────────────────
  input: (element) => {
    const display = safeContent(element);
    const props = safeProps(element);
    const labelText = resolveDisplayString(props.label || display, 'Input', 'label');
    const placeholderText = resolveDisplayString(props.placeholder || display || labelText, labelText, 'placeholder');
    const inputId = element.id;

    return (
      <div className={`flex flex-col gap-1.5 ${props.className || ''}`}>
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--nm-text-secondary)]"
        >
          {labelText}
        </label>
        <input
          id={inputId}
          type={props.inputType || 'text'}
          placeholder={placeholderText}
          aria-label={labelText}
          className="
            w-full px-4 py-2.5 rounded-[var(--nm-radius-sm)]
            bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]
            text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)]
            text-sm focus:outline-none focus:border-[var(--nm-accent)]
            focus:ring-1 focus:ring-[var(--nm-accent)] transition-colors"
          readOnly
        />
      </div>
    );
  },

  // textfield is an alias for input
  textfield: null,

  // ── Card (single) ─────────────────────────────────────────────────────────
  card: (element) => {
    const props = safeProps(element);
    const rawContent = element.content;

    const title = resolveDisplayString(
      props.title || (typeof rawContent === 'object' ? rawContent.title : ''),
      '',
      'title'
    );
    const description = resolveDisplayString(
      props.description || rawContent || element.fallback,
      '',
      'description'
    );
    const badge = resolveDisplayString(
      props.badge || (typeof rawContent === 'object' ? rawContent.badge : ''),
      '',
      'badge'
    );
    const price = resolveDisplayString(
      props.price || (typeof rawContent === 'object' ? rawContent.price : ''),
      '',
      'price'
    );
    const icon = typeof props.icon === 'string' ? props.icon : (props.icon?.name || props.icon?.icon || '');

    const imgSrc = props.src || props.image || (typeof rawContent === 'object' ? (rawContent.src || rawContent.image) : '') || '';
    const imgAlt = resolveDisplayString(props.alt || title || 'Card image', 'Card image');

    return (
      <article
        id={element.id}
        className={`group relative overflow-hidden rounded-2xl border border-[var(--nm-border-subtle)] bg-gradient-to-b from-[var(--nm-bg-card)] to-[var(--nm-bg-surface)] p-6 flex flex-col gap-4 h-full transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--nm-accent)] hover:shadow-[0_12px_36px_var(--nm-accent-glow)] ${props.className || ''}`}
        aria-label={title || description || 'Card'}
      >
        {/* Card Top Image if present (for food/travel/product cards) */}
        {imgSrc && (
          <div className="w-full h-48 sm:h-52 rounded-xl -mt-6 -mx-6 mb-1 overflow-hidden bg-[var(--nm-bg-surface)] self-center relative">
            <img
              src={imgSrc}
              alt={imgAlt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {badge && (
              <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold font-mono bg-black/70 backdrop-blur-md text-[var(--nm-accent-light)] border border-[var(--nm-border)] shadow-md">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Badge & Icon Header (if no top image) */}
        {!imgSrc && (badge || icon) && (
          <div className="flex items-center justify-between gap-2">
            {icon && (
              <div
                className="w-11 h-11 rounded-xl bg-[rgba(108,99,255,0.15)] border border-[rgba(108,99,255,0.3)] flex items-center justify-center text-[var(--nm-accent-light)] shadow-sm"
                aria-hidden="true"
              >
                <i className={`${icon} text-xl`} />
              </div>
            )}
            {badge && (
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)] ml-auto">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Card Title */}
        {title && (
          <h4 className="font-bold text-[var(--nm-text-primary)] text-lg leading-snug tracking-tight">
            {title}
          </h4>
        )}

        {/* Card Description */}
        {description && (
          <p className="text-sm text-[var(--nm-text-secondary)] leading-relaxed flex-1">
            {description}
          </p>
        )}

        {/* Price & Action Footer (for food menu / products / bookings) */}
        {price && (
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--nm-border-subtle)]">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--nm-text-muted)] font-semibold uppercase tracking-wider">Price</span>
              <span className="font-extrabold text-lg text-[var(--nm-accent-light)] font-mono">
                {price}
              </span>
            </div>
            <span className="px-3.5 py-1.5 rounded-lg bg-[var(--nm-accent)] text-white font-semibold text-xs transition-all group-hover:shadow-[0_0_16px_var(--nm-accent-glow)]">
              Select
            </span>
          </div>
        )}
      </article>
    );
  },

  // ── Cards — repeating loop ────────────────────────────────────────────────
  cards: (element) => {
    const props = safeProps(element);
    const items = Array.isArray(props.items)
      ? props.items
      : (Array.isArray(element.items) ? element.items : []);
    const cols = props.columns || 3;
    const colClass = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    }[cols] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    if (items.length === 0) {
      return (
        <div
          id={element.id}
          className="px-4 py-6 rounded-[var(--nm-radius-sm)] border border-dashed
                     border-[var(--nm-border)] text-sm text-[var(--nm-text-muted)] text-center"
        >
          <i className="pi pi-th-large mr-2" aria-hidden="true" />
          No card items provided
        </div>
      );
    }

    return (
      <div id={element.id} className={`grid ${colClass} gap-5`}>
        {items.map((item, idx) => {
          const cardElement = normalizeElement({
            id: item.id || `${element.id}-card-${idx}`,
            type: 'card',
            content: resolveDisplayString(item.description || item.content || item.title || '', ''),
            fallback: '',
            props: {
              title: resolveDisplayString(item.title, `Item ${idx + 1}`, 'title'),
              description: resolveDisplayString(item.description || item.content, '', 'description'),
              icon: typeof item.icon === 'string' ? item.icon : (item.icon?.name || item.icon?.icon || ''),
              badge: resolveDisplayString(item.badge, '', 'badge'),
              price: resolveDisplayString(item.price, '', 'price'),
              src: item.src || item.image || '',
              alt: resolveDisplayString(item.alt || item.title, 'Card image', 'alt'),
              className: item.className,
            },
          });
          return (
            <ElementErrorBoundary key={cardElement.id}>
              {ELEMENT_REGISTRY.card(cardElement)}
            </ElementErrorBoundary>
          );
        })}
      </div>
    );
  },

  // ── Carousel ──────────────────────────────────────────────────────────────
  carousel: (element) => {
    const props = safeProps(element);
    const slides = Array.isArray(props.slides) ? props.slides : [];

    if (slides.length === 0) {
      return (
        <div
          id={element.id}
          className="px-4 py-6 rounded-[var(--nm-radius-sm)] border border-dashed
                     border-[var(--nm-border)] text-sm text-[var(--nm-text-muted)] text-center"
        >
          <i className="pi pi-images mr-2" aria-hidden="true" />
          No carousel slides provided
        </div>
      );
    }

    return (
      <div id={element.id} className={`nm-carousel-wrapper ${props.className || ''}`}>
        <div
          className="nm-carousel"
          role="region"
          aria-label={resolveDisplayString(props['aria-label'] || safeContent(element), 'Image carousel')}
          tabIndex={0}
        >
          {slides.map((slide, idx) => {
            const slideTitle = resolveDisplayString(slide.title, '', 'title');
            const slideDesc = resolveDisplayString(slide.description || slide.content, '', 'description');
            const slideSrc = slide.src || slide.image || '';
            const slideAlt = resolveDisplayString(slide.alt || slideTitle || `Slide ${idx + 1}`, `Slide ${idx + 1}`);

            return (
              <div
                key={slide.id || `${element.id}-slide-${idx}`}
                className="nm-carousel__slide"
                role="group"
                aria-label={`Slide ${idx + 1} of ${slides.length}: ${slideTitle}`}
              >
                {slideSrc ? (
                  <img
                    src={slideSrc}
                    alt={slideAlt}
                    className="nm-carousel__img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/800x400/1a1a2e/6c63ff?text=Slide';
                    }}
                  />
                ) : (
                  <div className="nm-carousel__placeholder" aria-hidden="true">
                    <i className="pi pi-image text-[var(--nm-accent)] text-3xl" />
                  </div>
                )}
                {(slideTitle || slideDesc) && (
                  <div className="nm-carousel__caption">
                    {slideTitle && (
                      <p className="text-sm font-semibold text-[var(--nm-text-primary)]">
                        {slideTitle}
                      </p>
                    )}
                    {slideDesc && (
                      <p className="text-xs text-[var(--nm-text-secondary)]">
                        {slideDesc}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-[var(--nm-text-muted)] text-center mt-2">
          ← scroll to see more →
        </p>
      </div>
    );
  },

  // ── Wizard ────────────────────────────────────────────────────────────────
  wizard: (element) => {
    const props = safeProps(element);
    const steps = Array.isArray(props.steps) ? props.steps : [];
    const activeStep = typeof props.activeStep === 'number' ? props.activeStep : 0;

    if (steps.length === 0) {
      return (
        <div
          id={element.id}
          className="px-4 py-6 rounded-[var(--nm-radius-sm)] border border-dashed
                     border-[var(--nm-border)] text-sm text-[var(--nm-text-muted)] text-center"
        >
          <i className="pi pi-list-check mr-2" aria-hidden="true" />
          No wizard steps provided
        </div>
      );
    }

    return (
      <div
        id={element.id}
        className={`nm-wizard ${props.className || ''}`}
        role="list"
        aria-label={resolveDisplayString(safeContent(element), 'Wizard steps')}
      >
        <ol className="nm-wizard__steps">
          {steps.map((step, idx) => {
            const isDone = idx < activeStep;
            const isActive = idx === activeStep;
            const stepLabel = resolveDisplayString(step.label || step.title, `Step ${idx + 1}`, 'label');
            const stepDesc = resolveDisplayString(step.description || step.content, '', 'description');
            const statusLabel = isDone ? 'Completed' : isActive ? 'Current step' : 'Upcoming';

            return (
              <li
                key={step.id || `${element.id}-step-${idx}`}
                className={`nm-wizard__step ${isDone ? 'nm-wizard__step--done' : ''} ${isActive ? 'nm-wizard__step--active' : ''}`}
                role="listitem"
                aria-label={`Step ${idx + 1}: ${stepLabel} — ${statusLabel}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={`nm-wizard__circle ${isDone ? 'nm-wizard__circle--done' : isActive ? 'nm-wizard__circle--active' : ''}`}>
                  {isDone ? (
                    <i className="pi pi-check text-xs" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>

                <div className="nm-wizard__content">
                  <p className={`text-sm font-semibold ${isActive ? 'text-[var(--nm-accent-light)]' : isDone ? 'text-[var(--nm-text-secondary)]' : 'text-[var(--nm-text-muted)]'}`}>
                    {stepLabel}
                  </p>
                  {stepDesc && (
                    <p className="text-xs text-[var(--nm-text-muted)] mt-0.5">
                      {stepDesc}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  icon: (element) => {
    const props = safeProps(element);
    const iconClass = typeof element.content === 'string' && element.content.trim() !== ''
      ? element.content
      : (props.icon || 'pi pi-star');
    const label = resolveDisplayString(props['aria-label'] || props.label, '');

    return (
      <i
        id={element.id}
        className={`${iconClass} text-[var(--nm-accent)] text-xl ${props.className || ''}`}
        aria-hidden={!label}
        aria-label={label || undefined}
        role={label ? 'img' : undefined}
      />
    );
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: (element) => {
    const props = safeProps(element);
    return (
      <hr
        id={element.id}
        className={`border-[var(--nm-border-subtle)] my-4 ${props.className || ''}`}
        role="separator"
        aria-hidden="true"
      />
    );
  },

  // ── Link ──────────────────────────────────────────────────────────────────
  link: (element) => {
    const display = resolveDisplayString(element.content || element.fallback, 'Link', 'label');
    const props = safeProps(element);
    return (
      <a
        id={element.id}
        href={props.href || '#'}
        className={`text-[var(--nm-accent-light)] hover:underline text-sm ${props.className || ''}`}
        onClick={(e) => e.preventDefault()}
        aria-label={resolveDisplayString(props['aria-label'] || display, 'Link')}
        rel="noopener noreferrer"
      >
        {display}
      </a>
    );
  },

  // ── List ──────────────────────────────────────────────────────────────────
  list: (element) => {
    const display = safeContent(element);
    const props = safeProps(element);
    const items = Array.isArray(props.items)
      ? props.items
      : (Array.isArray(element.items)
          ? element.items
          : display.split(',').map((s) => s.trim()).filter(Boolean));
    const isOrdered = props.ordered === true;
    const Tag = isOrdered ? 'ol' : 'ul';

    return (
      <Tag
        id={element.id}
        className={`${isOrdered ? 'list-decimal' : 'list-disc'} list-inside text-sm text-[var(--nm-text-secondary)] space-y-1 ${props.className || ''}`}
        aria-label={resolveDisplayString(props['aria-label'], undefined)}
      >
        {items.length > 0 ? (
          items.map((item, i) => (
            <li key={i}>
              {resolveDisplayString(item, `Item ${i + 1}`, 'label')}
            </li>
          ))
        ) : (
          <li className="text-[var(--nm-text-muted)] italic">(no items)</li>
        )}
      </Tag>
    );
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: (element) => {
    const display = resolveDisplayString(propsLabel(element), 'Badge', 'label');
    const props = safeProps(element);

    return (
      <span
        id={element.id}
        className={`nm-badge ${props.className || ''}`}
        aria-label={resolveDisplayString(props['aria-label'] || display, 'Badge')}
      >
        {display}
      </span>
    );
  },
};

const propsLabel = (element) => {
  if (!element) return 'Badge';
  const props = safeProps(element);
  return props.label || element.content || element.fallback || 'Badge';
};

/**
 * Resolve the renderer function for a given element type.
 * @param {string} type
 * @returns {function|null}
 */
const getRenderer = (type) => {
  if (type === 'textfield') return ELEMENT_REGISTRY.input;
  return ELEMENT_REGISTRY[type] ?? null;
};

// ─── ElementRenderer ──────────────────────────────────────────────────────────

const ElementRenderer = ({ element: rawElement }) => {
  const element = normalizeElement(rawElement);
  const renderer = getRenderer(element.type);

  if (renderer) {
    return (
      <ElementErrorBoundary>
        {renderer(element)}
      </ElementErrorBoundary>
    );
  }

  // Unknown type — safe placeholder, never crashes
  const display = safeContent(element);
  return (
    <div
      id={element.id}
      role="note"
      className="px-3 py-2 rounded-[var(--nm-radius-sm)] border border-dashed
                 border-[var(--nm-border)] text-xs text-[var(--nm-text-muted)]
                 flex items-center gap-2"
      aria-label={`Unknown element type: ${element.type}`}
    >
      <i className="pi pi-box" aria-hidden="true" />
      <span>
        <strong className="text-[var(--nm-text-secondary)]">{element.type}</strong>
        {display ? `: ${display}` : ' (unknown type)'}
      </span>
    </div>
  );
};

// ─── Section Layout Helpers ───────────────────────────────────────────────────

const getLayoutClasses = (section) => {
  const layout = section.props?.layout || '';
  const type = (section.type || '').toLowerCase();

  if (type === 'hero') {
    if (layout === 'split' || layout === 'split-left') {
      return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full';
    }
    if (layout === 'split-right') {
      return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center [direction:rtl] [&>*]:[direction:ltr] w-full';
    }
    return 'flex flex-col items-center text-center gap-6 max-w-4xl mx-auto w-full';
  }

  if (layout === 'split' || layout === 'split-left') {
    return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full';
  }
  if (layout === 'split-right') {
    return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start [direction:rtl] [&>*]:[direction:ltr] w-full';
  }

  if (layout === 'center' || type === 'cta') {
    return 'flex flex-col items-center text-center gap-6 w-full';
  }

  if (type === 'navbar') return 'flex items-center justify-between gap-4 flex-wrap w-full';
  if (type === 'footer') return 'flex flex-wrap items-center justify-between gap-4 w-full';

  return 'flex flex-col gap-6 w-full';
};

// ─── Section Renderer ─────────────────────────────────────────────────────────

const SectionRenderer = ({ section }) => {
  if (!section || typeof section !== 'object') return null;

  const safeSection = {
    id: section.id || `sec-${Math.random().toString(36).slice(2, 8)}`,
    type: typeof section.type === 'string' ? section.type.toLowerCase() : 'custom',
    elements: Array.isArray(section.elements) ? section.elements : [],
    props: (section.props && typeof section.props === 'object' && !Array.isArray(section.props)) ? section.props : {},
  };

  const bg = safeSection.props.background || '';
  const bgClass =
    bg === 'gradient' ? 'bg-gradient-to-br from-[var(--nm-bg-card)] to-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]'
    : bg === 'surface' ? 'bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]'
    : bg === 'accent'  ? 'bg-[var(--nm-accent-glow)] border border-[rgba(108,99,255,0.3)]'
    : '';

  if (safeSection.elements.length === 0) {
    return (
      <section
        id={safeSection.id}
        aria-label={`${safeSection.type} section (empty)`}
        className={`py-8 px-6 rounded-[var(--nm-radius)] border border-dashed border-[var(--nm-border-subtle)] ${bgClass}`}
      >
        <p className="text-sm text-[var(--nm-text-muted)] text-center">
          <i className="pi pi-inbox mr-2" aria-hidden="true" />
          Section &ldquo;{safeSection.type}&rdquo; has no elements.
        </p>
      </section>
    );
  }

  // 1. Special Layout: HERO Section Intelligence
  if (safeSection.type === 'hero') {
    const mediaTypes = new Set(['image', 'carousel']);
    const mediaElements = safeSection.elements.filter((el) => mediaTypes.has((el?.type || '').toLowerCase()));
    const nonMediaElements = safeSection.elements.filter((el) => !mediaTypes.has((el?.type || '').toLowerCase()));

    const textElements = nonMediaElements.filter((el) => (el?.type || '').toLowerCase() !== 'button');
    const buttonElements = nonMediaElements.filter((el) => (el?.type || '').toLowerCase() === 'button');

    const hasMedia = mediaElements.length > 0;

    return (
      <section
        id={safeSection.id}
        aria-label={resolveDisplayString(safeSection.props['aria-label'] || 'Hero Section')}
        className={`py-12 px-6 sm:px-8 rounded-2xl ${bgClass || 'bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)]'}`}
      >
        {hasMedia ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full min-h-[380px]">
            {/* Left Content Column */}
            <div className="flex flex-col items-start text-left gap-3.5">
              {textElements.map((el) => (
                <ElementRenderer
                  key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
                  element={el}
                />
              ))}

              {buttonElements.length > 0 && (
                <div className="flex items-center gap-3.5 flex-wrap pt-3">
                  {buttonElements.map((el) => (
                    <ElementRenderer
                      key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
                      element={el}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Media Column */}
            <div className="w-full flex items-center justify-center">
              {mediaElements.map((el) => (
                <ElementRenderer
                  key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
                  element={el}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-4 py-4">
            {textElements.map((el) => (
              <ElementRenderer
                key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
                element={el}
              />
            ))}

            {buttonElements.length > 0 && (
              <div className="flex items-center justify-center gap-4 flex-wrap pt-3">
                {buttonElements.map((el) => (
                  <ElementRenderer
                    key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
                    element={el}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  // 2. Special Layout: CARDS / FEATURES / PRICING / TESTIMONIALS / GALLERY Sections
  if (['features', 'cards', 'pricing', 'testimonials', 'gallery'].includes(safeSection.type)) {
    const gridTypes = new Set(['cards', 'card', 'carousel', 'list']);
    const gridElements = safeSection.elements.filter((el) => gridTypes.has((el?.type || '').toLowerCase()));
    const headerElements = safeSection.elements.filter((el) => !gridTypes.has((el?.type || '').toLowerCase()));

    return (
      <section
        id={safeSection.id}
        aria-label={resolveDisplayString(safeSection.props['aria-label'] || `${safeSection.type} section`)}
        className={`py-12 px-6 sm:px-8 rounded-2xl ${bgClass || 'bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)]'}`}
      >
        {headerElements.length > 0 && (
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-2.5 mb-8">
            {headerElements.map((el) => (
              <ElementRenderer
                key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
                element={el}
              />
            ))}
          </div>
        )}

        <div className="w-full">
          {gridElements.map((el) => (
            <ElementRenderer
              key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
              element={el}
            />
          ))}
        </div>
      </section>
    );
  }

  // 3. Special Layout: CTA Section
  if (safeSection.type === 'cta') {
    return (
      <section
        id={safeSection.id}
        aria-label={resolveDisplayString(safeSection.props['aria-label'] || 'CTA section')}
        className={`py-12 px-8 rounded-2xl text-center flex flex-col items-center gap-4 max-w-4xl mx-auto my-4 w-full bg-gradient-to-br from-[var(--nm-bg-card)] via-[rgba(108,99,255,0.12)] to-[var(--nm-bg-surface)] border border-[rgba(108,99,255,0.3)] shadow-2xl ${bgClass}`}
      >
        {safeSection.elements.map((el) => (
          <ElementRenderer
            key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
            element={el}
          />
        ))}
      </section>
    );
  }

  // Standard Section Fallback
  const layoutClasses = getLayoutClasses(safeSection);

  return (
    <section
      id={safeSection.id}
      aria-label={resolveDisplayString(safeSection.props['aria-label'] || `${safeSection.type} section`)}
      className={`py-10 px-6 rounded-2xl ${bgClass || 'bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)]'}`}
    >
      <div className={layoutClasses}>
        {safeSection.elements.map((el) => (
          <ElementRenderer
            key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
            element={el}
          />
        ))}
      </div>
    </section>
  );
};

// ─── Page Renderer (exported) ─────────────────────────────────────────────────

/**
 * UIRenderer — Renders a UIPage JSON object.
 *
 * @param {object} props
 * @param {object} props.pageData - UIPage object conforming to frontend/src/types/ui.js
 */
const UIRenderer = ({ pageData }) => {
  if (!pageData || typeof pageData !== 'object') {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--nm-text-muted)]"
        role="status"
        aria-live="polite"
      >
        <i className="pi pi-file text-3xl opacity-40" aria-hidden="true" />
        <p className="text-sm">No page data provided.</p>
      </div>
    );
  }

  const sections = Array.isArray(pageData.sections) ? pageData.sections : [];

  if (sections.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--nm-text-muted)]"
        role="status"
        aria-live="polite"
      >
        <i className="pi pi-desktop text-3xl opacity-40" aria-hidden="true" />
        <p className="text-sm">No sections to render.</p>
        <p className="text-xs opacity-70">
          Generate a UI first, or check your UIPage data.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 nm-animate-in" aria-label={`Preview: ${pageData.page || 'Untitled'}`}>
      {sections.map((section) => (
        <SectionRenderer
          key={(section && section.id) ? section.id : `sec-${Math.random().toString(36).slice(2, 8)}`}
          section={section}
        />
      ))}
    </div>
  );
};

export default UIRenderer;
