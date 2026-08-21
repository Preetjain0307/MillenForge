/**
 * UIRenderer — Renders a UIPage structure into React components (Task 3)
 *
 * Hierarchy:  UIPage → UISection[] → UIElement[]
 *
 * Supports: text, image, button, input/textfield, card, icon, divider, link, list
 * Unknown types: renders a safe placeholder (never crashes).
 */
import NmButton from './NmButton';

// ─── Element Renderer ─────────────────────────────────────────────────────────

const ElementRenderer = ({ element }) => {
  const { type, content, fallback, props = {} } = element;
  const display = content || fallback || '';

  switch (type) {
    case 'text': {
      const Tag = props.tag || 'p';
      return <Tag className={props.className || ''}>{display}</Tag>;
    }

    case 'image': {
      const src = display || 'https://placehold.co/600x400/1a1a2e/6c63ff?text=Image';
      return (
        <img
          src={src}
          alt={props.alt || 'Generated image'}
          className={`max-w-full rounded-[var(--nm-radius-sm)] ${props.className || ''}`}
        />
      );
    }

    case 'button': {
      return (
        <NmButton
          variant={props.variant || 'primary'}
          label={display}
          icon={props.icon}
          className={props.className || ''}
          onClick={() => {}}
        />
      );
    }

    case 'input':
    case 'textfield': {
      return (
        <input
          type={props.inputType || 'text'}
          placeholder={display}
          className={`
            w-full px-4 py-2.5 rounded-[var(--nm-radius-sm)]
            bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]
            text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)]
            text-sm ${props.className || ''}
          `}
          readOnly
        />
      );
    }

    case 'card': {
      return (
        <div className={`nm-card p-5 flex flex-col gap-2 ${props.className || ''}`}>
          {props.icon && (
            <div className="w-10 h-10 rounded-lg bg-[var(--nm-accent-glow)] flex items-center justify-center mb-1">
              <i className={`${props.icon} text-[var(--nm-accent-light)] text-lg`} />
            </div>
          )}
          {props.title && (
            <h4 className="font-semibold text-[var(--nm-text-primary)]">{props.title}</h4>
          )}
          {(props.description || display) && (
            <p className="text-sm text-[var(--nm-text-secondary)]">{props.description || display}</p>
          )}
        </div>
      );
    }

    case 'icon': {
      const iconClass = display || props.icon || 'pi pi-star';
      return <i className={`${iconClass} text-[var(--nm-accent)] ${props.className || ''}`} />;
    }

    case 'divider': {
      return <hr className={`border-[var(--nm-border-subtle)] my-4 ${props.className || ''}`} />;
    }

    case 'link': {
      return (
        <a
          href={props.href || '#'}
          className={`text-[var(--nm-accent-light)] hover:underline text-sm ${props.className || ''}`}
          onClick={(e) => e.preventDefault()}
        >
          {display}
        </a>
      );
    }

    case 'list': {
      // content can be a comma-separated string or props.items array
      const items = Array.isArray(props.items) ? props.items : (display || '').split(',').map((s) => s.trim()).filter(Boolean);
      return (
        <ul className={`list-disc list-inside text-sm text-[var(--nm-text-secondary)] space-y-1 ${props.className || ''}`}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    default: {
      // Unknown type — safe placeholder
      return (
        <div className="px-3 py-2 rounded-[var(--nm-radius-sm)] border border-dashed border-[var(--nm-border)] text-xs text-[var(--nm-text-muted)]">
          <i className="pi pi-box mr-1" />
          {type}: {display || '(empty)'}
        </div>
      );
    }
  }
};

// ─── Section Layout Helpers ───────────────────────────────────────────────────

const getLayoutClasses = (section) => {
  const layout = section.props?.layout || '';
  const type = section.type;

  // Hero sections
  if (type === 'hero') {
    if (layout === 'split' || layout === 'split-left') {
      return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center';
    }
    if (layout === 'split-right') {
      return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center direction-rtl';
    }
    return 'flex flex-col items-center text-center gap-6';
  }

  // Cards / features → grid
  if (type === 'features' || type === 'cards' || type === 'pricing' || type === 'testimonials') {
    const cols = section.props?.columns || 3;
    return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6`;
  }

  // Navbar → row
  if (type === 'navbar') {
    return 'flex items-center justify-between gap-4';
  }

  // Footer → row with wrapping
  if (type === 'footer') {
    return 'flex flex-wrap items-center justify-between gap-4';
  }

  // CTA → centered
  if (type === 'cta') {
    return 'flex flex-col items-center text-center gap-4';
  }

  // Default
  return 'flex flex-col gap-4';
};

// ─── Section Renderer ─────────────────────────────────────────────────────────

const SectionRenderer = ({ section }) => {
  const layoutClasses = getLayoutClasses(section);
  const bg = section.props?.background || '';

  const bgClass = bg === 'gradient'
    ? 'bg-gradient-to-br from-[var(--nm-bg-card)] to-[var(--nm-bg-surface)]'
    : bg === 'surface'
      ? 'bg-[var(--nm-bg-surface)]'
      : '';

  return (
    <section
      id={section.id}
      className={`py-10 px-6 rounded-[var(--nm-radius)] ${bgClass}`}
    >
      <div className={layoutClasses}>
        {section.elements.map((el) => (
          <ElementRenderer key={el.id} element={el} />
        ))}
      </div>
    </section>
  );
};

// ─── Page Renderer ────────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {object} props.pageData - UIPage object from Redux
 */
const UIRenderer = ({ pageData }) => {
  if (!pageData || !pageData.sections || pageData.sections.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--nm-text-muted)]">
        <p>No sections to render.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 nm-animate-in">
      {pageData.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
};

export default UIRenderer;
