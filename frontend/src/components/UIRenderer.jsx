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
 * Safety Guarantees:
 * - Never throws "Objects are not valid as a React child".
 * - Intelligently resolves display fields.
 * - Unknown types & Malformed elements caught safely.
 * - Interactive element inspection boundary overlays (Electric Violet highlights).
 */

import { Component } from 'react';
import NmButton from './NmButton';
import { resolveDisplayString, normalizeElementData } from '../utils/valueNormalizer';
import { getSvgPlaceholder } from '../utils/svgPlaceholder';

// ─── Utilities ────────────────────────────────────────────────────────────────

const safeContent = (element, preferredKey = null) => {
  if (!element) return '';
  const c = resolveDisplayString(element.content, '', preferredKey);
  if (c.trim() !== '') return c;
  const f = resolveDisplayString(element.fallback, '', preferredKey);
  if (f.trim() !== '') return f;
  return '';
};

const safeProps = (element) =>
  element && typeof element.props === 'object' && element.props !== null && !Array.isArray(element.props)
    ? element.props
    : {};

const normalizeElement = (raw) => normalizeElementData(raw);

// ─── Error Boundary ───────────────────────────────────────────────────────────

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
          className="px-3 py-2 rounded-lg border border-dashed border-[#FB7185]
                     text-xs text-[#FB7185] flex items-center gap-2"
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

const ELEMENT_REGISTRY = {

  // ── Text ──────────────────────────────────────────────────────────────────
  text: (element) => {
    const display = safeContent(element, 'text');
    const props = safeProps(element);
    const ALLOWED_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'strong', 'em'];
    const Tag = ALLOWED_TAGS.includes(props.tag) ? props.tag : 'p';

    return (
      <Tag
        id={element.id}
        className={`text-[#F8FAFC] leading-relaxed ${props.className || ''}`}
      >
        {display || <span className="text-[#94A3B8] italic">(empty text)</span>}
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

    const alt = resolveDisplayString(
      props.alt || (typeof element.content === 'object' ? element.content.alt : '') || element.fallback,
      'Visual Asset',
      'alt'
    );

    if (!src) {
      src = props.src || getSvgPlaceholder(alt || 'Visual Asset', 600, 400);
    }

    return (
      <img
        id={element.id}
        src={src}
        alt={alt}
        className={`max-w-full rounded-lg object-cover ${props.className || ''}`}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = getSvgPlaceholder(alt || 'Visual Asset', 600, 400);
        }}
      />
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
        className={props.className || ''}
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
          className="text-sm font-medium text-[#CBD5E1]"
        >
          {labelText}
        </label>
        <input
          id={inputId}
          type={props.inputType || 'text'}
          placeholder={placeholderText}
          aria-label={labelText}
          className="
            w-full px-4 py-2.5 rounded-lg
            bg-[#18181B] border border-[#2A2A30]
            text-[#F8FAFC] placeholder-[#94A3B8]
            text-sm focus:outline-none focus:border-[#8B5CF6]
            focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
          readOnly
        />
      </div>
    );
  },

  textfield: null,

  // ── Card ──────────────────────────────────────────────────────────────────
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
        className={`nm-card p-5 flex flex-col gap-3 h-full transition-all duration-200 hover:border-[#8B5CF6] ${props.className || ''}`}
        aria-label={title || description || 'Card'}
      >
        {imgSrc && (
          <div className="w-full h-44 rounded-t-lg -mt-5 -mx-5 mb-2 overflow-hidden bg-[#18181B] self-center">
            <img
              src={imgSrc}
              alt={imgAlt}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {icon && (
            <div
              className="w-10 h-10 rounded-lg bg-[#8B5CF6]/15 flex items-center justify-center text-[#A78BFA]"
              aria-hidden="true"
            >
              <i className={`${icon} text-lg`} />
            </div>
          )}
          {badge && (
            <span className="nm-badge ml-auto">{badge}</span>
          )}
        </div>

        {title && (
          <h4 className="font-semibold text-[#F8FAFC] text-base leading-snug">
            {title}
          </h4>
        )}

        {description && (
          <p className="text-sm text-[#CBD5E1] leading-relaxed flex-1">
            {description}
          </p>
        )}

        {price && (
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#2A2A30]">
            <span className="font-bold text-base text-[#A78BFA] font-mono">
              {price}
            </span>
            <span className="text-xs px-2.5 py-1 rounded bg-[#8B5CF6]/20 text-[#A78BFA] font-medium">
              Select
            </span>
          </div>
        )}
      </article>
    );
  },

  // ── Cards Grid ────────────────────────────────────────────────────────────
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
          className="px-4 py-6 rounded-lg border border-dashed
                     border-[#2A2A30] text-sm text-[#94A3B8] text-center"
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
          className="px-4 py-6 rounded-lg border border-dashed
                     border-[#2A2A30] text-sm text-[#94A3B8] text-center"
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
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getSvgPlaceholder(slideTitle || 'Slide', 800, 400);
                    }}
                  />
                ) : (
                  <div className="nm-carousel__placeholder" aria-hidden="true">
                    <i className="pi pi-image text-[#8B5CF6] text-3xl" />
                  </div>
                )}
                {(slideTitle || slideDesc) && (
                  <div className="nm-carousel__caption">
                    {slideTitle && (
                      <p className="text-sm font-semibold text-[#F8FAFC]">
                        {slideTitle}
                      </p>
                    )}
                    {slideDesc && (
                      <p className="text-xs text-[#CBD5E1]">
                        {slideDesc}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
          className="px-4 py-6 rounded-lg border border-dashed
                     border-[#2A2A30] text-sm text-[#94A3B8] text-center"
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
                  <p className={`text-sm font-semibold ${isActive ? 'text-[#A78BFA]' : isDone ? 'text-[#CBD5E1]' : 'text-[#94A3B8]'}`}>
                    {stepLabel}
                  </p>
                  {stepDesc && (
                    <p className="text-xs text-[#94A3B8] mt-0.5">
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
        className={`${iconClass} text-[#8B5CF6] text-xl ${props.className || ''}`}
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
        className={`border-[#2A2A30] my-4 ${props.className || ''}`}
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
        className={`text-[#A78BFA] hover:underline text-sm font-medium ${props.className || ''}`}
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
        className={`${isOrdered ? 'list-decimal' : 'list-disc'} list-inside text-sm text-[#CBD5E1] space-y-1 ${props.className || ''}`}
        aria-label={resolveDisplayString(props['aria-label'], undefined)}
      >
        {items.length > 0 ? (
          items.map((item, i) => (
            <li key={i}>
              {resolveDisplayString(item, `Item ${i + 1}`, 'label')}
            </li>
          ))
        ) : (
          <li className="text-[#94A3B8] italic">(no items)</li>
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

  // ── Bento Grid Primitive ──────────────────────────────────────────────────
  bento: (element) => {
    const props = safeProps(element);
    const items = Array.isArray(props.items) ? props.items : [];

    return (
      <div id={element.id} className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full my-4">
        {items.map((item, idx) => (
          <div
            key={item.id || `bento-${idx}`}
            className={`p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)] ${
              idx === 0 ? 'md:col-span-2 md:row-span-2' : ''
            }`}
          >
            {item.icon && (
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)] text-[var(--primary-text)] flex items-center justify-center text-xl mb-4 font-bold">
                <i className={typeof item.icon === 'string' ? item.icon : 'pi pi-sparkles'} />
              </div>
            )}
            <h4 className="text-xl font-bold text-[var(--heading-color)] mb-2">{resolveDisplayString(item.title, 'Feature', 'title')}</h4>
            <p className="text-sm text-[var(--text)] leading-relaxed flex-1">{resolveDisplayString(item.description || item.content, '', 'description')}</p>
            {item.badge && (
              <span className="mt-4 inline-self-start px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--primary)] text-[var(--primary-text)]">
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  },

  // ── Stats / Metric Cards Primitive ────────────────────────────────────────
  stats: (element) => {
    const props = safeProps(element);
    const items = Array.isArray(props.items) ? props.items : [
      { metric: '99.9%', label: 'Uptime SLA' },
      { metric: '50k+', label: 'Active Users' },
      { metric: '4.9 ★', label: 'Customer Rating' },
      { metric: '< 20ms', label: 'Global Latency' },
    ];

    return (
      <div id={element.id} className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full my-6 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-lg">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center text-center p-3">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--primary)] font-mono tracking-tight">
              {resolveDisplayString(item.metric || item.value || item.title, '100%')}
            </span>
            <span className="text-xs sm:text-sm font-medium text-[var(--muted-text)] mt-1">
              {resolveDisplayString(item.label || item.description || item.name, 'Metric')}
            </span>
          </div>
        ))}
      </div>
    );
  },

  // ── Testimonial Primitive ─────────────────────────────────────────────────
  testimonial: (element) => {
    const props = safeProps(element);
    const items = Array.isArray(props.items) ? props.items : [
      { name: 'Sarah Jenkins', role: 'Product Lead, TechCorp', quote: 'NeuraMinds completely transformed our design workflow. The output is breathtaking!', rating: '5' },
      { name: 'David Chen', role: 'Founder, StudioX', quote: 'Incredible speed, beautiful color palettes, and production-ready UX in seconds.', rating: '5' },
    ];

    return (
      <div id={element.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full my-6">
        {items.map((item, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md flex flex-col justify-between gap-4">
            <div className="flex items-center gap-1 text-amber-400 text-sm">
              <i className="pi pi-star-fill" />
              <i className="pi pi-star-fill" />
              <i className="pi pi-star-fill" />
              <i className="pi pi-star-fill" />
              <i className="pi pi-star-fill" />
            </div>
            <p className="text-sm italic text-[var(--text)] leading-relaxed">&ldquo;{resolveDisplayString(item.quote || item.content || item.description, 'Amazing platform!')}&rdquo;</p>
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]">
              <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-[var(--primary-text)] font-bold flex items-center justify-center text-xs">
                {resolveDisplayString(item.name, 'U')[0]}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--heading-color)]">{resolveDisplayString(item.name, 'Customer')}</span>
                <span className="text-[11px] text-[var(--muted-text)]">{resolveDisplayString(item.role || item.title, 'Verified User')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  },

  // ── FAQ / Accordion Primitive ─────────────────────────────────────────────
  faq: (element) => {
    const props = safeProps(element);
    const items = Array.isArray(props.items) ? props.items : [
      { question: 'How quickly can I deploy the generated website?', answer: 'Instantly! You can export React JSX, Tailwind HTML, or raw JSON schema with one click.' },
      { question: 'Is the generated code responsive?', answer: 'Yes, every generated layout explicitly supports Desktop, Tablet, and Mobile viewports.' },
    ];

    return (
      <div id={element.id} className="flex flex-col gap-3 w-full max-w-3xl mx-auto my-6">
        {items.map((item, idx) => (
          <details key={idx} className="group p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm transition-all">
            <summary className="font-bold text-sm sm:text-base text-[var(--heading-color)] cursor-pointer list-none flex items-center justify-between gap-4">
              <span>{resolveDisplayString(item.question || item.title, 'Frequently Asked Question')}</span>
              <i className="pi pi-chevron-down text-xs text-[var(--muted-text)] transition-transform group-open:rotate-180" />
            </summary>
            <p className="text-xs sm:text-sm text-[var(--text)] mt-3 leading-relaxed pt-2 border-t border-[var(--border)]">
              {resolveDisplayString(item.answer || item.description || item.content, 'Detailed answer.')}
            </p>
          </details>
        ))}
      </div>
    );
  },

  // ── Logo Cloud / Social Proof Primitive ────────────────────────────────────
  logocloud: (element) => {
    const props = safeProps(element);
    const brands = Array.isArray(props.brands) ? props.brands : ['Stripe', 'Airbnb', 'Linear', 'Vercel', 'GitHub', 'Figma'];

    return (
      <div id={element.id} className="py-6 px-4 w-full flex flex-col items-center gap-3 my-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-text)]">Trusted by Industry Leaders Worldwide</span>
        <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap opacity-75 grayscale hover:grayscale-0 transition-all">
          {brands.map((brand, idx) => (
            <span key={idx} className="text-sm sm:text-base font-bold font-mono text-[var(--text)] tracking-tight">
              {resolveDisplayString(brand, 'Brand')}
            </span>
          ))}
        </div>
      </div>
    );
  },

  // ── Newsletter Subscription Form Primitive ────────────────────────────────
  newsletter: (element) => {
    const { showToast } = useInteractiveUI();
    const props = safeProps(element);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (showToast) showToast('Subscribed!', 'Thank you for subscribing to updates.', 'success');
    };

    return (
      <form id={element.id} onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-md my-4">
        <input
          type="email"
          required
          placeholder={resolveDisplayString(props.placeholder, 'Enter your email address')}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-text)] text-xs font-bold shadow-md hover:brightness-110 transition-all whitespace-nowrap"
        >
          {resolveDisplayString(props.buttonLabel, 'Subscribe')}
        </button>
      </form>
    );
  },

  // ── Rating & Avatar Stack Primitive ────────────────────────────────────────
  rating: (element) => {
    const props = safeProps(element);

    return (
      <div id={element.id} className="flex items-center gap-2 my-2">
        <div className="flex items-center gap-1 text-amber-400 text-xs">
          <i className="pi pi-star-fill" />
          <span className="font-bold text-[var(--heading-color)] ml-1">{resolveDisplayString(props.score, '4.9')}</span>
        </div>
        <span className="text-xs text-[var(--muted-text)]">({resolveDisplayString(props.reviews, '500+ reviews')})</span>
      </div>
    );
  },
};

const propsLabel = (element) => {
  if (!element) return 'Badge';
  const props = safeProps(element);
  return props.label || element.content || element.fallback || 'Badge';
};

const getRenderer = (type) => {
  const t = (type || '').toLowerCase().replace(/[-_]/g, '');
  if (t === 'textfield' || t === 'input') return ELEMENT_REGISTRY.input;
  if (t === 'bentogrid' || t === 'bento') return ELEMENT_REGISTRY.bento;
  if (t === 'metriccard' || t === 'stats' || t === 'metrics' || t === 'stat') return ELEMENT_REGISTRY.stats;
  if (t === 'testimonialcarousel' || t === 'testimonial' || t === 'quote') return ELEMENT_REGISTRY.testimonial;
  if (t === 'pricingcomparison' || t === 'pricing') return ELEMENT_REGISTRY.pricing;
  if (t === 'accordion' || t === 'faq') return ELEMENT_REGISTRY.faq;
  if (t === 'imagegallery' || t === 'gallery') return ELEMENT_REGISTRY.gallery;
  if (t === 'productcard' || t === 'productgrid' || t === 'categorygrid') return ELEMENT_REGISTRY.cards;
  if (t === 'filterbar' || t === 'searchbar') return ELEMENT_REGISTRY.searchbar;
  if (t === 'socialproof' || t === 'logocloud' || t === 'marquee') return ELEMENT_REGISTRY.logocloud;
  if (t === 'newsletter' || t === 'contactform') return ELEMENT_REGISTRY.newsletter;
  if (t === 'avatargroup' || t === 'rating') return ELEMENT_REGISTRY.rating;
  return ELEMENT_REGISTRY[t] ?? ELEMENT_REGISTRY[type] ?? null;
};

// ─── ElementRenderer with Interactive Electric Violet Inspector Overlay ─────

const ElementRenderer = ({ element: rawElement, selectedElementId, onSelectElement }) => {
  const element = normalizeElement(rawElement);
  const renderer = getRenderer(element.type);
  const isSelected = selectedElementId && selectedElementId === element.id;

  const content = renderer ? (
    <ElementErrorBoundary>
      {renderer(element)}
    </ElementErrorBoundary>
  ) : (
    <div
      id={element.id}
      role="note"
      className="px-3 py-2 rounded-lg border border-dashed
                 border-[#2A2A30] text-xs text-[#94A3B8]
                 flex items-center gap-2"
    >
      <i className="pi pi-box" aria-hidden="true" />
      <span>
        <strong className="text-[#CBD5E1]">{element.type}</strong>
        {safeContent(element) ? `: ${safeContent(element)}` : ' (unknown type)'}
      </span>
    </div>
  );

  return (
    <div
      onClick={(e) => {
        if (onSelectElement) {
          e.stopPropagation();
          onSelectElement(element);
        }
      }}
      className={`
        relative group transition-all duration-150 rounded-lg p-1 cursor-pointer
        ${isSelected 
          ? 'ring-2 ring-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_12px_rgba(139,92,246,0.3)]' 
          : 'hover:ring-1 hover:ring-[#8B5CF6]/50 hover:bg-[#8B5CF6]/5'
        }
      `}
    >
      {/* Component ID Badge overlay on hover/selection */}
      <div className={`
        absolute -top-2.5 left-2 z-20 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider
        transition-opacity duration-150 flex items-center gap-1 shadow-md pointer-events-none
        ${isSelected
          ? 'bg-[#8B5CF6] text-white opacity-100 font-bold'
          : 'bg-[#18181B] text-[#A78BFA] border border-[#8B5CF6]/40 opacity-0 group-hover:opacity-100'
        }
      `}>
        <span className="capitalize">{element.type}</span>
        <span className="text-white/60">#{element.id}</span>
      </div>

      {content}
    </div>
  );
};

// ─── Section Layout & Renderer ────────────────────────────────────────────────

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

const SectionRenderer = ({ section, selectedElementId, onSelectElement }) => {
  if (!section || typeof section !== 'object') return null;

  const safeSection = {
    id: section.id || `sec-${Math.random().toString(36).slice(2, 8)}`,
    type: typeof section.type === 'string' ? section.type : 'custom',
    elements: Array.isArray(section.elements) ? section.elements : [],
    props: (section.props && typeof section.props === 'object' && !Array.isArray(section.props)) ? section.props : {},
  };

  const layoutClasses = getLayoutClasses(safeSection);
  const bg = safeSection.props.background || '';

  const bgClass =
    bg === 'gradient' ? 'bg-gradient-to-br from-[#18181B] to-[#111113]'
    : bg === 'surface' ? 'bg-[#18181B]'
    : bg === 'accent'  ? 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/20'
    : '';

  if (safeSection.elements.length === 0) {
    return (
      <section
        id={safeSection.id}
        aria-label={`${safeSection.type} section (empty)`}
        className={`py-8 px-6 rounded-xl border border-dashed border-[#2A2A30] ${bgClass}`}
      >
        <p className="text-sm text-[#94A3B8] text-center">
          <i className="pi pi-inbox mr-2" aria-hidden="true" />
          Section &ldquo;{safeSection.type}&rdquo; has no elements.
        </p>
      </section>
    );
  }

  return (
    <section
      id={safeSection.id}
      aria-label={resolveDisplayString(safeSection.props['aria-label'] || `${safeSection.type} section`)}
      className={`py-8 px-6 rounded-xl ${bgClass}`}
    >
      <div className={layoutClasses}>
        {safeSection.elements.map((el) => (
          <ElementRenderer
            key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
            element={el}
            selectedElementId={selectedElementId}
            onSelectElement={onSelectElement}
          />
        ))}
      </div>
    </section>
  );
};

/**
 * UIRenderer — Renders a UIPage JSON object with component selection overlays.
 *
 * @param {object} props
 * @param {object} props.pageData - UIPage object conforming to frontend/src/types/ui.js
 * @param {string} [props.selectedElementId]
 * @param {function} [props.onSelectElement]
 */
const UIRenderer = ({ pageData, selectedElementId, onSelectElement }) => {
  if (!pageData || typeof pageData !== 'object') {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-3 text-[#94A3B8]"
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
        className="flex flex-col items-center justify-center py-16 gap-3 text-[#94A3B8]"
        role="status"
        aria-live="polite"
      >
        <i className="pi pi-desktop text-3xl opacity-40" aria-hidden="true" />
        <p className="text-sm">No sections to render.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 nm-animate-in" aria-label={`Preview: ${pageData.page || 'Untitled'}`}>
      {sections.map((section) => (
        <SectionRenderer
          key={(section && section.id) ? section.id : `sec-${Math.random().toString(36).slice(2, 8)}`}
          section={section}
          selectedElementId={selectedElementId}
          onSelectElement={onSelectElement}
        />
      ))}
    </div>
  );
};

export default UIRenderer;
