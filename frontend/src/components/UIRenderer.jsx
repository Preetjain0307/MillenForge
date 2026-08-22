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
 * Unknown types: renders a safe placeholder — never crashes.
 * Malformed elements: caught by ElementErrorBoundary — never crashes.
 */

import { Component } from 'react';
import NmButton from './NmButton';

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Safely resolve the display text for an element.
 * Falls back through content → fallback → empty string.
 * @param {object} element
 * @returns {string}
 */
const safeContent = (element) => {
  if (!element) return '';
  const c = element.content;
  const f = element.fallback;
  if (typeof c === 'string' && c.trim() !== '') return c;
  if (typeof f === 'string' && f.trim() !== '') return f;
  return '';
};

/**
 * Safely read element.props with fallback to empty object.
 * @param {object} element
 * @returns {object}
 */
const safeProps = (element) =>
  element && typeof element.props === 'object' && element.props !== null
    ? element.props
    : {};

/**
 * Normalize an element object so all downstream renderers
 * can access fields without null-checking everywhere.
 * @param {*} raw
 * @returns {{ id: string, type: string, content: string, fallback: string, props: object }}
 */
const normalizeElement = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return { id: 'unknown', type: 'unknown', content: '', fallback: '', props: {} };
  }
  return {
    id: typeof raw.id === 'string' ? raw.id : `el-${Math.random().toString(36).slice(2, 8)}`,
    type: typeof raw.type === 'string' ? raw.type.toLowerCase().trim() : 'unknown',
    content: typeof raw.content === 'string' ? raw.content : '',
    fallback: typeof raw.fallback === 'string' ? raw.fallback : '',
    props: (raw.props && typeof raw.props === 'object') ? raw.props : {},
  };
};

// ─── Error Boundary ───────────────────────────────────────────────────────────

/**
 * Wraps each individual element render.
 * If one element throws, the rest of the page still renders.
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
          Element render error: {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Element Registry ─────────────────────────────────────────────────────────
// Each entry is a function: (element) => JSX
// This is the single source of truth for supported element types.

const ELEMENT_REGISTRY = {

  // ── Text ──────────────────────────────────────────────────────────────────
  text: (element) => {
    const display = safeContent(element);
    const props = safeProps(element);
    // Whitelist allowed heading/paragraph tags
    const ALLOWED_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'strong', 'em'];
    const Tag = ALLOWED_TAGS.includes(props.tag) ? props.tag : 'p';
    return (
      <Tag
        id={element.id}
        className={`text-[var(--nm-text-primary)] leading-relaxed ${props.className || ''}`}
      >
        {display || <span className="text-[var(--nm-text-muted)] italic">(empty text)</span>}
      </Tag>
    );
  },

  // ── Image ─────────────────────────────────────────────────────────────────
  image: (element) => {
    const props = safeProps(element);
    const src = safeContent(element) || props.src || 'https://placehold.co/600x400/1a1a2e/6c63ff?text=Image';
    const alt = props.alt || element.fallback || 'Generated image';
    return (
      <img
        id={element.id}
        src={src}
        alt={alt}
        className={`max-w-full rounded-[var(--nm-radius-sm)] object-cover ${props.className || ''}`}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = 'https://placehold.co/600x400/1a1a2e/6c63ff?text=Image+Error';
          e.currentTarget.alt = 'Image failed to load';
        }}
      />
    );
  },

  // ── Button ────────────────────────────────────────────────────────────────
  button: (element) => {
    const display = safeContent(element) || 'Button';
    const props = safeProps(element);
    return (
      <NmButton
        id={element.id}
        variant={props.variant || 'primary'}
        label={display}
        icon={props.icon}
        className={props.className || ''}
        aria-label={props['aria-label'] || display}
        onClick={() => {}}
        type="button"
      />
    );
  },

  // ── Input / Textfield ─────────────────────────────────────────────────────
  input: (element) => {
    const display = safeContent(element);
    const props = safeProps(element);
    const labelText = props.label || display || 'Input';
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
          placeholder={props.placeholder || display || labelText}
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
  textfield: null, // resolved to 'input' in getRenderer()

  // ── Card (single) ─────────────────────────────────────────────────────────
  card: (element) => {
    const display = safeContent(element);
    const props = safeProps(element);
    return (
      <article
        id={element.id}
        className={`nm-card p-5 flex flex-col gap-3 ${props.className || ''}`}
        aria-label={props.title || display || 'Card'}
      >
        {props.icon && (
          <div
            className="w-10 h-10 rounded-lg bg-[var(--nm-accent-glow)] flex items-center justify-center"
            aria-hidden="true"
          >
            <i className={`${props.icon} text-[var(--nm-accent-light)] text-lg`} />
          </div>
        )}
        {props.title && (
          <h4 className="font-semibold text-[var(--nm-text-primary)] text-base leading-snug">
            {props.title}
          </h4>
        )}
        {(props.description || display) && (
          <p className="text-sm text-[var(--nm-text-secondary)] leading-relaxed">
            {props.description || display}
          </p>
        )}
        {props.badge && (
          <span className="nm-badge self-start">{props.badge}</span>
        )}
      </article>
    );
  },

  // ── Cards — repeating loop ────────────────────────────────────────────────
  // element.props.items: Array<{ id, title, description, icon, badge }>
  cards: (element) => {
    const props = safeProps(element);
    const items = Array.isArray(props.items) ? props.items : [];
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

    // Each item is rendered through the card renderer for consistency
    return (
      <div id={element.id} className={`grid ${colClass} gap-5`}>
        {items.map((item, idx) => {
          const cardElement = normalizeElement({
            id: item.id || `${element.id}-card-${idx}`,
            type: 'card',
            content: item.description || item.content || '',
            fallback: '',
            props: {
              title: item.title,
              description: item.description || item.content,
              icon: item.icon,
              badge: item.badge,
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
  // element.props.slides: Array<{ id, title, description, src, alt }>
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
          aria-label={props['aria-label'] || safeContent(element) || 'Image carousel'}
          tabIndex={0}
        >
          {slides.map((slide, idx) => (
            <div
              key={slide.id || `${element.id}-slide-${idx}`}
              className="nm-carousel__slide"
              role="group"
              aria-label={`Slide ${idx + 1} of ${slides.length}: ${slide.title || ''}`}
            >
              {slide.src ? (
                <img
                  src={slide.src}
                  alt={slide.alt || slide.title || `Slide ${idx + 1}`}
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
              {(slide.title || slide.description) && (
                <div className="nm-carousel__caption">
                  {slide.title && (
                    <p className="text-sm font-semibold text-[var(--nm-text-primary)]">
                      {slide.title}
                    </p>
                  )}
                  {slide.description && (
                    <p className="text-xs text-[var(--nm-text-secondary)]">
                      {slide.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--nm-text-muted)] text-center mt-2">
          ← scroll to see more →
        </p>
      </div>
    );
  },

  // ── Wizard ────────────────────────────────────────────────────────────────
  // element.props.steps: Array<{ id, label, description, icon }>
  // element.props.activeStep: number (0-indexed, default 0)
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
        aria-label={safeContent(element) || 'Wizard steps'}
      >
        {/* Step indicators */}
        <div className="nm-wizard__track" aria-hidden="true">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`nm-wizard__connector ${idx < activeStep ? 'nm-wizard__connector--done' : idx === activeStep ? 'nm-wizard__connector--active' : ''}`}
            />
          ))}
        </div>

        {/* Steps list */}
        <ol className="nm-wizard__steps">
          {steps.map((step, idx) => {
            const isDone = idx < activeStep;
            const isActive = idx === activeStep;
            const statusLabel = isDone ? 'Completed' : isActive ? 'Current step' : 'Upcoming';
            return (
              <li
                key={step.id || `${element.id}-step-${idx}`}
                className={`nm-wizard__step ${isDone ? 'nm-wizard__step--done' : ''} ${isActive ? 'nm-wizard__step--active' : ''}`}
                role="listitem"
                aria-label={`Step ${idx + 1}: ${step.label || ''} — ${statusLabel}`}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Circle */}
                <div className={`nm-wizard__circle ${isDone ? 'nm-wizard__circle--done' : isActive ? 'nm-wizard__circle--active' : ''}`}>
                  {isDone ? (
                    <i className="pi pi-check text-xs" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Label + description */}
                <div className="nm-wizard__content">
                  <p className={`text-sm font-semibold ${isActive ? 'text-[var(--nm-accent-light)]' : isDone ? 'text-[var(--nm-text-secondary)]' : 'text-[var(--nm-text-muted)]'}`}>
                    {step.label || `Step ${idx + 1}`}
                  </p>
                  {step.description && (
                    <p className="text-xs text-[var(--nm-text-muted)] mt-0.5">
                      {step.description}
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
    const iconClass = safeContent(element) || props.icon || 'pi pi-star';
    const label = props['aria-label'] || props.label || '';
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
    const display = safeContent(element) || 'Link';
    const props = safeProps(element);
    return (
      <a
        id={element.id}
        href={props.href || '#'}
        className={`text-[var(--nm-accent-light)] hover:underline text-sm ${props.className || ''}`}
        onClick={(e) => e.preventDefault()}
        aria-label={props['aria-label'] || display}
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
      : display.split(',').map((s) => s.trim()).filter(Boolean);
    const isOrdered = props.ordered === true;
    const Tag = isOrdered ? 'ol' : 'ul';
    return (
      <Tag
        id={element.id}
        className={`${isOrdered ? 'list-decimal' : 'list-disc'} list-inside text-sm text-[var(--nm-text-secondary)] space-y-1 ${props.className || ''}`}
        aria-label={props['aria-label'] || undefined}
      >
        {items.length > 0 ? (
          items.map((item, i) => <li key={i}>{item}</li>)
        ) : (
          <li className="text-[var(--nm-text-muted)] italic">(no items)</li>
        )}
      </Tag>
    );
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: (element) => {
    const display = safeContent(element) || 'Badge';
    const props = safeProps(element);
    return (
      <span
        id={element.id}
        className={`nm-badge ${props.className || ''}`}
        aria-label={props['aria-label'] || display}
      >
        {display}
      </span>
    );
  },
};

/**
 * Resolve the renderer function for a given element type.
 * Aliases and unknown types are handled here.
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
      return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center';
    }
    if (layout === 'split-right') {
      return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center [direction:rtl] [&>*]:[direction:ltr]';
    }
    return 'flex flex-col items-center text-center gap-6';
  }

  if (type === 'features' || type === 'cards' || type === 'pricing' || type === 'testimonials') {
    const cols = section.props?.columns || 3;
    const colMap = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
    return `grid grid-cols-1 md:grid-cols-2 ${colMap[cols] || 'lg:grid-cols-3'} gap-6`;
  }

  if (type === 'navbar') return 'flex items-center justify-between gap-4 flex-wrap';
  if (type === 'footer') return 'flex flex-wrap items-center justify-between gap-4';
  if (type === 'cta') return 'flex flex-col items-center text-center gap-4';

  return 'flex flex-col gap-4';
};

// ─── Section Renderer ─────────────────────────────────────────────────────────

const SectionRenderer = ({ section }) => {
  // Guard against completely malformed section
  if (!section || typeof section !== 'object') return null;

  const safeSection = {
    id: section.id || `sec-${Math.random().toString(36).slice(2, 8)}`,
    type: typeof section.type === 'string' ? section.type : 'custom',
    elements: Array.isArray(section.elements) ? section.elements : [],
    props: (section.props && typeof section.props === 'object') ? section.props : {},
  };

  const layoutClasses = getLayoutClasses(safeSection);
  const bg = safeSection.props.background || '';

  const bgClass =
    bg === 'gradient' ? 'bg-gradient-to-br from-[var(--nm-bg-card)] to-[var(--nm-bg-surface)]'
    : bg === 'surface' ? 'bg-[var(--nm-bg-surface)]'
    : bg === 'accent'  ? 'bg-[var(--nm-accent-glow)]'
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

  return (
    <section
      id={safeSection.id}
      aria-label={safeSection.props['aria-label'] || `${safeSection.type} section`}
      className={`py-10 px-6 rounded-[var(--nm-radius)] ${bgClass}`}
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
