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

import { Component, useState, createContext, useContext } from 'react';
import NmButton from './NmButton';
import { resolveDisplayString, normalizeElementData } from '../utils/valueNormalizer';

// ─── Interactive UI Context ───────────────────────────────────────────────────
const InteractiveUIContext = createContext(null);
const useInteractiveUI = () => useContext(InteractiveUIContext) || {};

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
      h1: 'text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--heading-color)] leading-tight mb-3',
      h2: 'text-2xl sm:text-3xl font-bold tracking-tight text-[var(--heading-color)] mb-2.5',
      h3: 'text-xl sm:text-2xl font-bold text-[var(--heading-color)] mb-2',
      h4: 'text-lg font-semibold text-[var(--heading-color)] mb-1',
      p: 'text-sm sm:text-base text-[var(--text)] leading-relaxed mb-1',
      span: 'text-sm text-[var(--text)]',
      label: 'text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider',
    }[Tag] || 'text-sm text-[var(--text)] leading-relaxed';

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
    if (!src) src = props.src || '';

    const alt = resolveDisplayString(
      props.alt || (typeof element.content === 'object' ? element.content.alt : '') || element.fallback,
      'Generated visual asset',
      'alt'
    );

    // Resolve domain-contextual fallback if src is missing or broken (NO generic hotel image)
    const contextQuery = (src + ' ' + alt + ' ' + (props.imageQuery || '') + ' ' + (props.imageDomain || '') + ' ' + (element.id || '')).toLowerCase();
    let fallbackSrc = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'; // workspace
    if (contextQuery.includes('college') || contextQuery.includes('university') || contextQuery.includes('campus') || contextQuery.includes('education') || contextQuery.includes('student')) {
      fallbackSrc = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80';
    } else if (contextQuery.includes('hospital') || contextQuery.includes('medical') || contextQuery.includes('doctor') || contextQuery.includes('clinic') || contextQuery.includes('healthcare')) {
      fallbackSrc = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80';
    } else if (contextQuery.includes('food') || contextQuery.includes('pizza') || contextQuery.includes('burger') || contextQuery.includes('restaurant') || contextQuery.includes('meal')) {
      fallbackSrc = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80';
    } else if (contextQuery.includes('travel') || contextQuery.includes('resort') || contextQuery.includes('vacation')) {
      fallbackSrc = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
    } else if (contextQuery.includes('fashion') || contextQuery.includes('clothing') || contextQuery.includes('wear') || contextQuery.includes('store')) {
      fallbackSrc = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80';
    } else if (contextQuery.includes('estate') || contextQuery.includes('property') || contextQuery.includes('villa') || contextQuery.includes('house')) {
      fallbackSrc = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80';
    } else if (contextQuery.includes('bank') || contextQuery.includes('finance') || contextQuery.includes('fintech')) {
      fallbackSrc = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80';
    } else if (contextQuery.includes('gaming') || contextQuery.includes('esports')) {
      fallbackSrc = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
    }

    const finalSrc = src || fallbackSrc;

    return (
      <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] group">
        <img
          id={element.id}
          src={finalSrc}
          alt={alt}
          className={`w-full h-auto max-h-[480px] object-cover transition-transform duration-500 group-hover:scale-102 ${props.className || ''}`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = fallbackSrc;
            e.currentTarget.alt = alt || 'Visual asset';
          }}
        />
      </div>
    );
  },

  // ── Button ────────────────────────────────────────────────────────────────
  button: (element) => {
    const { showToast, setActiveRoleTab, setIsCartOpen, setAuthModal, setBookingModal } = useInteractiveUI();
    const display = resolveDisplayString(element.content || element.fallback, 'Button', 'label');
    const props = safeProps(element);
    const label = resolveDisplayString(props.label || display, 'Button', 'label');
    const icon = typeof props.icon === 'string' ? props.icon : (props.icon?.name || props.icon?.icon || '');

    const handleClick = () => {
      const lower = label.toLowerCase();
      if (lower.includes('student')) {
        if (setActiveRoleTab) setActiveRoleTab('student');
        if (setAuthModal) setAuthModal({ role: 'Student', title: 'Student Portal Login' });
        else if (showToast) showToast('Portal Initialized', 'Student authentication portal active.', 'info');
      } else if (lower.includes('teacher') || lower.includes('faculty')) {
        if (setActiveRoleTab) setActiveRoleTab('teacher');
        if (setAuthModal) setAuthModal({ role: 'Faculty', title: 'Faculty / Teacher Login' });
        else if (showToast) showToast('Portal Initialized', 'Faculty portal active.', 'info');
      } else if (lower.includes('doctor')) {
        if (setAuthModal) setAuthModal({ role: 'Doctor', title: 'Doctor Clinical Portal' });
        else if (showToast) showToast('Portal Initialized', 'Doctor portal active.', 'info');
      } else if (lower.includes('admin')) {
        if (setAuthModal) setAuthModal({ role: 'Administrator', title: 'Admin Console Access' });
        else if (showToast) showToast('Portal Initialized', 'Admin portal active.', 'info');
      } else if (lower.includes('login') || lower.includes('sign in') || lower.includes('portal')) {
        if (setAuthModal) setAuthModal({ role: 'User', title: 'Account Sign In' });
        else if (showToast) showToast('Authentication Opened', 'Sign in to access your account.', 'info');
      } else if (lower.includes('cart') || lower.includes('checkout') || lower.includes('bag')) {
        if (setIsCartOpen) setIsCartOpen(true);
      } else if (lower.includes('book') || lower.includes('appointment') || lower.includes('reserve') || lower.includes('schedule')) {
        if (setBookingModal) setBookingModal({ title: label, service: 'General Consultation / Booking' });
        else if (showToast) showToast('Booking Modal Opened', 'Complete your booking details.', 'success');
      } else if (lower.includes('apply')) {
        if (showToast) showToast('Application Opened', 'Admissions application form loaded.', 'success');
      } else if (lower.includes('send') || lower.includes('submit') || lower.includes('contact')) {
        if (showToast) showToast('Message Sent', 'Thank you! We have received your message and will respond shortly.', 'success');
      } else {
        if (showToast) showToast('Action Triggered', `Triggered "${label}"`, 'info');
      }
    };

    return (
      <NmButton
        id={element.id}
        variant={props.variant || 'primary'}
        label={label}
        icon={icon || undefined}
        buttonColor={props.buttonColor || element.buttonColor}
        className={`font-semibold shadow-md transition-all hover:scale-102 ${props.className || ''}`}
        aria-label={resolveDisplayString(props['aria-label'] || label, 'Button')}
        onClick={handleClick}
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
        />
      </div>
    );
  },

  // textfield is an alias for input
  textfield: null,

  // ── Card (single) ─────────────────────────────────────────────────────────
  card: (element) => {
    const { openModal, addToCart, cart, updateCartQty } = useInteractiveUI();
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

    const cardId = element.id || title;
    const cartItem = (cart || []).find((c) => c.id === cardId || c.title === title);

    const handleCardClick = () => {
      if (openModal) {
        openModal({ title, description, badge, price, icon, image: imgSrc, alt: imgAlt });
      }
    };

    const handleActionClick = (e) => {
      e.stopPropagation();
      if (addToCart) {
        addToCart({ id: cardId, title: title || 'Item', price: price || 'Free', image: imgSrc });
      }
    };

    return (
      <article
        id={element.id}
        onClick={handleCardClick}
        className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 flex flex-col justify-between h-full w-full cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--primary)] hover:shadow-xl ${props.className || ''}`}
        aria-label={title || description || 'Card'}
      >
        <div className="flex flex-col gap-3 flex-1">
          {/* Card Top Image if present */}
          {imgSrc && (
            <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[var(--surface)] relative shadow-sm">
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
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold font-mono bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-md">
                  {badge}
                </span>
              )}
            </div>
          )}

          {/* Badge & Icon Header */}
          {!imgSrc && (badge || icon) && (
            <div className="flex items-center justify-between gap-2">
              {icon && (
                <div
                  className="w-11 h-11 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shadow-sm"
                  aria-hidden="true"
                >
                  <i className={`${icon} text-xl`} />
                </div>
              )}
              {badge && (
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)] ml-auto">
                  {badge}
                </span>
              )}
            </div>
          )}

          {/* Card Title & Rating */}
          <div className="flex flex-col gap-1 pt-1">
            {title && (
              <h4 className="font-bold text-[var(--heading-color)] text-base sm:text-lg md:text-xl leading-snug tracking-tight transition-colors break-words break-normal">
                {title}
              </h4>
            )}
            <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
              <i className="pi pi-star-fill text-[11px]" />
              <span>4.9</span>
              <span className="text-[var(--muted-text)] font-normal ml-1">(120+ reviews)</span>
            </div>
          </div>

          {/* Card Description */}
          {description && (
            <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed flex-1 break-words break-normal">
              {description}
            </p>
          )}
        </div>

        {/* Price & Action Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]">
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--muted-text)] font-semibold uppercase tracking-wider">Price / Status</span>
            <span className="font-extrabold text-base sm:text-lg text-[var(--primary)] font-mono">
              {price || 'Available'}
            </span>
          </div>

          {cartItem ? (
            <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--primary)] rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => updateCartQty && updateCartQty(cartItem.id, -1)}
                className="w-7 h-7 rounded-md bg-[var(--primary)] text-[var(--primary-text)] font-bold flex items-center justify-center transition-colors"
              >
                -
              </button>
              <span className="text-xs font-bold font-mono px-1">{cartItem.qty}</span>
              <button
                type="button"
                onClick={() => updateCartQty && updateCartQty(cartItem.id, 1)}
                className="w-7 h-7 rounded-md bg-[var(--primary)] text-[var(--primary-text)] font-bold flex items-center justify-center hover:brightness-110 transition-all"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleActionClick}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-text)] font-semibold text-xs transition-all hover:scale-105 flex items-center gap-1.5 shadow-sm"
            >
              <i className="pi pi-plus text-[10px]" />
              <span>Select</span>
            </button>
          )}
        </div>
      </article>
    );
  },

  // ── Cards — repeating loop ────────────────────────────────────────────────
  cards: (element) => {
    const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, viewMode, setViewMode } = useInteractiveUI();
    const props = safeProps(element);
    const rawItems = Array.isArray(props.items)
      ? props.items
      : (Array.isArray(element.items) ? element.items : []);

    const cols = props.columns || 3;

    // Derive categories from items
    const categoriesSet = new Set(['All']);
    rawItems.forEach((it) => {
      const b = (it?.badge || it?.category || '').toString().trim();
      if (b) categoriesSet.add(b);
    });
    const categories = Array.from(categoriesSet);

    // Filter items
    const filteredItems = rawItems.filter((it) => {
      const titleStr = (it?.title || '').toString().toLowerCase();
      const descStr = (it?.description || it?.content || '').toString().toLowerCase();
      const badgeStr = (it?.badge || '').toString().toLowerCase();

      const q = (searchQuery || '').toLowerCase();
      const matchesSearch = !q || titleStr.includes(q) || descStr.includes(q) || badgeStr.includes(q);
      const matchesCategory = !selectedCategory || selectedCategory === 'All' || (it?.badge || it?.category) === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    const isListView = viewMode === 'list';
    const colClass = isListView
      ? 'grid-cols-1'
      : {
          1: 'grid-cols-1',
          2: 'grid-cols-1 md:grid-cols-2',
          3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        }[cols] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    if (rawItems.length === 0) {
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
      <div id={element.id} className="flex flex-col gap-5 w-full">
        {/* Interactive Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] shadow-sm">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const active = (selectedCategory || 'All') === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory && setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[var(--nm-accent)] text-white shadow-md'
                      : 'bg-[var(--nm-bg-card)] text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)] hover:bg-[var(--nm-bg-surface)]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Input & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--nm-text-muted)]" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] focus:outline-none focus:border-[var(--nm-accent)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery && setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)]"
                >
                  <i className="pi pi-times" />
                </button>
              )}
            </div>

            <div className="flex items-center rounded-lg border border-[var(--nm-border-subtle)] p-0.5 bg-[var(--nm-bg-card)]">
              <button
                type="button"
                onClick={() => setViewMode && setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${!isListView ? 'bg-[var(--nm-accent)] text-white' : 'text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)]'}`}
                title="Grid View"
              >
                <i className="pi pi-th-large" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode && setViewMode('list')}
                className={`p-1.5 rounded text-xs transition-colors ${isListView ? 'bg-[var(--nm-accent)] text-white' : 'text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)]'}`}
                title="List View"
              >
                <i className="pi pi-list" />
              </button>
            </div>
          </div>
        </div>

        {/* Card Items Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="px-4 py-8 rounded-xl border border-dashed border-[var(--nm-border-subtle)] text-center text-xs text-[var(--nm-text-muted)] flex flex-col items-center gap-2">
            <i className="pi pi-filter-slash text-xl opacity-60" />
            <p>No matching items found for &ldquo;{searchQuery || selectedCategory}&rdquo;</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery && setSearchQuery('');
                setSelectedCategory && setSelectedCategory('All');
              }}
              className="text-xs text-[var(--nm-accent-light)] font-semibold underline mt-1"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={`grid ${colClass} gap-5`}>
            {filteredItems.map((item, idx) => {
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
        )}
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
      { name: 'Sarah Jenkins', role: 'Product Lead, TechCorp', quote: 'NeuraMind completely transformed our design workflow. The output is breathtaking!', rating: '5' },
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

/**
 * Resolve the renderer function for a given element type.
 * @param {string} type
 * @returns {function|null}
 */
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

  if (type === 'features' || type === 'cards' || type === 'pricing' || type === 'testimonials' || type === 'gallery') {
    const cols = section.props?.columns || 3;
    const colMap = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
    return `grid grid-cols-1 md:grid-cols-2 ${colMap[cols] || 'lg:grid-cols-3'} gap-6`;
  }

  if (type === 'navbar') return 'flex items-center justify-between gap-4 flex-wrap';
  if (type === 'footer') return 'flex flex-wrap items-center justify-between gap-4';
  if (type === 'cta') return 'flex flex-col items-center text-center gap-4';

  return 'flex flex-col gap-4';
};

// ─── Navbar Renderer with Mobile Hamburger Menu ────────────────────────────────
const NavbarRenderer = ({ section, bgClass }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart, setIsCartOpen } = useInteractiveUI();
  const totalCartQty = (cart || []).reduce((acc, i) => acc + (i.qty || 1), 0);

  return (
    <section
      id={section.id}
      aria-label="Navigation Header"
      className={`py-3.5 px-4 sm:px-6 rounded-2xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] shadow-md relative w-full max-w-full overflow-x-hidden ${bgClass}`}
    >
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Brand Logo / Header Elements */}
        <div className="flex items-center gap-3 overflow-hidden">
          {section.elements.slice(0, 2).map((el) => (
            <ElementRenderer
              key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
              element={el}
            />
          ))}
        </div>

        {/* Desktop Navbar Actions & Links */}
        <div className="hidden md:flex items-center gap-4 flex-wrap">
          {section.elements.slice(2).map((el) => (
            <ElementRenderer
              key={(el && el.id) ? el.id : `el-${Math.random().toString(36).slice(2, 8)}`}
              element={el}
            />
          ))}
          {totalCartQty > 0 && (
            <button
              type="button"
              onClick={() => setIsCartOpen && setIsCartOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[var(--nm-accent)] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <i className="pi pi-shopping-cart text-xs" />
              <span>Cart ({totalCartQty})</span>
            </button>
          )}
        </div>

        {/* Mobile Actions Controls (Cart + Hamburger Button) */}
        <div className="flex md:hidden items-center gap-2">
          {totalCartQty > 0 && (
            <button
              type="button"
              onClick={() => setIsCartOpen && setIsCartOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--nm-accent)] text-white text-xs font-semibold flex items-center gap-1 min-h-[44px]"
            >
              <i className="pi pi-shopping-cart text-xs" />
              <span>({totalCartQty})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            <i className={`pi ${mobileMenuOpen ? 'pi-times' : 'pi-bars'} text-lg`} />
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Navigation Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden flex flex-col gap-3 pt-4 mt-3 border-t border-[var(--nm-border-subtle)] nm-animate-in">
          {section.elements.slice(2).map((el) => (
            <div key={(el && el.id) ? el.id : `mob-el-${Math.random().toString(36).slice(2, 8)}`} className="w-full">
              <ElementRenderer element={el} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
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

  // 0. Special Layout: NAVBAR with Mobile Navigation
  if (safeSection.type === 'navbar') {
    return <NavbarRenderer section={safeSection} bgClass={bgClass} />;
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
        className={`py-12 px-6 sm:px-8 rounded-2xl bg-transparent ${bgClass}`}
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
        className={`py-12 px-6 sm:px-8 rounded-2xl bg-transparent ${bgClass}`}
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
        className={`py-12 px-8 rounded-2xl text-center flex flex-col items-center gap-4 max-w-4xl mx-auto my-4 w-full bg-[var(--surface)] border border-[var(--border)] shadow-xl ${bgClass}`}
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
      className={`py-10 px-6 rounded-2xl bg-transparent ${bgClass}`}
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

// ─── Interactive UI Overlay Components ───────────────────────────────────────

const ToastOverlay = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/90 text-white border border-slate-700 shadow-2xl backdrop-blur-md nm-animate-in">
      <i className={`pi ${toast.type === 'info' ? 'pi-info-circle text-blue-400' : 'pi-check-circle text-emerald-400'} text-lg`} />
      <div className="flex flex-col">
        <span className="text-xs font-bold">{toast.title}</span>
        <span className="text-[11px] text-slate-300">{toast.message}</span>
      </div>
    </div>
  );
};

const QuickViewModal = ({ activeModal, onClose, onAddToCart }) => {
  if (!activeModal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md nm-animate-in" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] p-6 shadow-2xl flex flex-col gap-4 text-[var(--nm-text-primary)]" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)] p-1">
          <i className="pi pi-times text-lg" />
        </button>

        {activeModal.image && (
          <div className="w-full h-56 rounded-xl overflow-hidden bg-[var(--nm-bg-surface)]">
            <img src={activeModal.image} alt={activeModal.title || 'Modal item'} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-bold">{activeModal.title}</h3>
          {activeModal.badge && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)]">
              {activeModal.badge}
            </span>
          )}
        </div>

        {activeModal.description && (
          <p className="text-sm text-[var(--nm-text-secondary)] leading-relaxed">{activeModal.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-[var(--nm-border-subtle)]">
          <span className="text-xl font-extrabold text-[var(--nm-accent-light)] font-mono">{activeModal.price || 'Available'}</span>
          <button
            type="button"
            onClick={() => {
              onAddToCart && onAddToCart(activeModal);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-[var(--nm-accent)] text-white font-semibold text-sm hover:scale-105 shadow-lg transition-all"
          >
            Confirm & Select
          </button>
        </div>
      </div>
    </div>
  );
};

const SlideOutCartDrawer = ({ isOpen, onClose, cart, onUpdateQty }) => {
  if (!isOpen) return null;
  const subtotal = cart.reduce((acc, item) => {
    const p = parseFloat((item.price || '').replace(/[^0-9.]/g, '')) || 0;
    return acc + p * (item.qty || 1);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm nm-animate-in" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-[var(--nm-bg-card)] border-l border-[var(--nm-border-subtle)] p-6 shadow-2xl flex flex-col gap-5 text-[var(--nm-text-primary)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-[var(--nm-border-subtle)]">
          <div className="flex items-center gap-2">
            <i className="pi pi-shopping-cart text-xl text-[var(--nm-accent-light)]" />
            <h3 className="text-lg font-bold">Your Cart / Selection</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)]">
            <i className="pi pi-times text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--nm-text-muted)]">
              <i className="pi pi-shopping-bag text-3xl opacity-40" />
              <p className="text-sm">Your cart is currently empty.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] gap-3">
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-bold">{item.title}</span>
                  <span className="text-xs text-[var(--nm-accent-light)] font-mono">{item.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 rounded bg-[var(--nm-accent-glow)] text-xs font-bold">-</button>
                  <span className="text-xs font-bold font-mono">{item.qty}</span>
                  <button type="button" onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 rounded bg-[var(--nm-accent)] text-white text-xs font-bold">+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="pt-4 border-t border-[var(--nm-border-subtle)] flex flex-col gap-3">
            <div className="flex justify-between text-sm font-bold">
              <span>Estimated Total:</span>
              <span className="text-base text-[var(--nm-accent-light)] font-mono">₹{subtotal > 0 ? subtotal.toFixed(2) : '0.00'}</span>
            </div>
            <button
              type="button"
              onClick={() => alert('Order / Application submitted successfully!')}
              className="w-full py-3 rounded-xl bg-[var(--nm-accent)] text-white font-bold text-sm shadow-xl hover:brightness-110 transition-all"
            >
              Checkout / Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AuthModal = ({ authModal, onClose, onSuccess }) => {
  if (!authModal) return null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess && onSuccess(`Welcome back! Logged into ${authModal.role || 'User'} Portal.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md nm-animate-in" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4 text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[var(--muted-text)] hover:text-[var(--text)] p-1">
          <i className="pi pi-times text-lg" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-[var(--primary-text)] flex items-center justify-center font-bold">
            <i className="pi pi-lock text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--heading-color)]">{authModal.title || 'Role Authentication'}</h3>
            <span className="text-xs text-[var(--muted-text)] font-mono">{authModal.role || 'User'} Portal Access</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--muted-text)]">Email or ID</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@institution.edu"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--muted-text)]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-text)] font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
          >
            <i className="pi pi-sign-in text-xs" />
            <span>Sign In to {authModal.role || 'Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

const BookingModal = ({ bookingModal, onClose, onSuccess }) => {
  if (!bookingModal) return null;
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess && onSuccess(`Confirmed! Booking scheduled for ${date || 'upcoming date'} at ${time}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md nm-animate-in" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4 text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[var(--muted-text)] hover:text-[var(--text)] p-1">
          <i className="pi pi-times text-lg" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-[var(--primary-text)] flex items-center justify-center font-bold">
            <i className="pi pi-calendar text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--heading-color)]">{bookingModal.title || 'Schedule & Book'}</h3>
            <span className="text-xs text-[var(--muted-text)]">{bookingModal.service || 'Instant Confirmation'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--muted-text)]">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Smith"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--muted-text)]">Preferred Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--muted-text)]">Time Slot</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option>09:00 AM</option>
                <option>10:30 AM</option>
                <option>01:00 PM</option>
                <option>03:30 PM</option>
                <option>05:00 PM</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-text)] font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
          >
            <i className="pi pi-check text-xs" />
            <span>Confirm & Reserve Slot</span>
          </button>
        </form>
      </div>
    </div>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [activeRoleTab, setActiveRoleTab] = useState('student');
  const [toast, setToast] = useState(null);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const addToCart = (item) => {
    if (!item || !item.id) return;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id || i.title === item.title);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, { ...item, qty: 1 }];
    });
    showToast('Selection Updated', `Added "${item.title || 'Item'}" to your active list.`, 'success');
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.id === id || i.title === id) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  const interactiveContextValue = {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
    cart,
    addToCart,
    updateCartQty,
    isCartOpen,
    setIsCartOpen,
    activeModal,
    openModal: setActiveModal,
    closeModal: () => setActiveModal(null),
    authModal,
    setAuthModal,
    bookingModal,
    setBookingModal,
    activeRoleTab,
    setActiveRoleTab,
    toast,
    showToast,
  };

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

  // Calculate dynamic Theme CSS Variables for the Generated Website Canvas
  const themeMode = (pageData?.props?.bgColor || pageData?.meta?.customBgColor || '').toLowerCase();
  const themeName = (pageData?.props?.theme || pageData?.meta?.theme || '').toLowerCase();
  const btnColor = (pageData?.props?.buttonColor || pageData?.meta?.primaryButtonColor || '').toLowerCase();
  const explicitTokens = pageData?.props?.themeTokens || pageData?.meta?.themeTokens || pageData?.themeTokens;

  const isLight = themeMode === 'white' || themeMode === 'cream' || themeMode === 'grey' || themeName === 'light' || themeName === 'college' || themeName === 'healthcare' || (pageData?.domain === 'college' && !themeMode);
  const isBlack = themeMode === 'black' || themeName === 'dark' || themeName === 'luxury';

  // Base Colors calculation with dynamic tokens priority
  let bgHex = explicitTokens?.background;
  let bgSurfaceHex = explicitTokens?.surface;
  let bgCardHex = explicitTokens?.surface;
  let borderHex = explicitTokens?.border;
  let borderSubtleHex = explicitTokens?.border;
  let textPrimaryHex = explicitTokens?.text;
  let textSecondaryHex = explicitTokens?.text;
  let textMutedHex = explicitTokens?.mutedText;
  let primaryBtnHex = explicitTokens?.primary;
  let primaryBtnTextHex = explicitTokens?.primaryText;
  let headingHex = explicitTokens?.headings;

  if (!bgHex) {
    if (themeMode === 'yellow') bgHex = '#FEF08A';
    else if (themeMode === 'grey' || themeMode === 'gray') bgHex = '#F3F4F6';
    else if (themeMode === 'cream') bgHex = '#FDFBF7';
    else if (isLight) bgHex = '#FFFFFF';
    else if (isBlack) bgHex = '#020617';
    else bgHex = '#0b0914';
  }

  if (!bgSurfaceHex) {
    bgSurfaceHex = isLight || bgHex === '#FEF08A' || bgHex === '#F3F4F6' || bgHex === '#FFFFFF' ? '#FFFFFF' : '#141024';
    bgCardHex = bgSurfaceHex;
  }

  if (!borderHex) borderHex = isLight || bgHex === '#FEF08A' || bgHex === '#F3F4F6' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)';
  if (!borderSubtleHex) borderSubtleHex = borderHex;
  if (!textPrimaryHex) textPrimaryHex = isLight || bgHex === '#FEF08A' || bgHex === '#F3F4F6' || bgHex === '#FFFFFF' ? '#0F172A' : '#F8FAFC';
  if (!textSecondaryHex) textSecondaryHex = isLight || bgHex === '#FEF08A' ? '#334155' : '#CBD5E1';
  if (!textMutedHex) textMutedHex = isLight || bgHex === '#FEF08A' ? '#64748B' : '#94A3B8';
  if (!headingHex) headingHex = textPrimaryHex;

  if (!primaryBtnHex) {
    if (btnColor === 'green') primaryBtnHex = '#059669';
    else if (btnColor === 'yellow') { primaryBtnHex = '#FACC15'; primaryBtnTextHex = '#111827'; }
    else if (btnColor === 'red') primaryBtnHex = '#DC2626';
    else if (btnColor === 'gold') primaryBtnHex = '#F59E0B';
    else if (btnColor === 'blue') primaryBtnHex = '#2563EB';
    else if (btnColor === 'white') { primaryBtnHex = '#FFFFFF'; primaryBtnTextHex = '#111827'; }
    else if (pageData?.domain === 'hospital' && !btnColor) primaryBtnHex = '#DC2626';
    else primaryBtnHex = '#6C63FF';
  }
  if (!primaryBtnTextHex) primaryBtnTextHex = '#FFFFFF';

  const generatedWebsiteStyle = {
    '--background': bgHex,
    '--surface': bgSurfaceHex,
    '--primary': primaryBtnHex,
    '--primary-text': primaryBtnTextHex,
    '--text': textPrimaryHex,
    '--muted-text': textMutedHex,
    '--border': borderHex,
    '--accent': primaryBtnHex,
    '--heading-color': headingHex,
    '--header-bg': bgSurfaceHex,
    '--header-text': textPrimaryHex,

    // Map to --nm-* backward compatibility
    '--nm-bg-primary': bgHex,
    '--nm-bg-secondary': bgSurfaceHex,
    '--nm-bg-surface': bgSurfaceHex,
    '--nm-bg-card': bgCardHex,
    '--nm-border': borderHex,
    '--nm-border-subtle': borderSubtleHex,
    '--nm-text-primary': textPrimaryHex,
    '--nm-text-secondary': textSecondaryHex,
    '--nm-text-muted': textMutedHex,
    '--nm-accent': primaryBtnHex,
    '--nm-accent-hover': primaryBtnHex,
    '--nm-accent-glow': 'rgba(99, 102, 241, 0.2)',
    '--nm-accent-light': primaryBtnHex,
    backgroundColor: bgHex,
    color: textPrimaryHex,
  };

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
    <InteractiveUIContext.Provider value={interactiveContextValue}>
      <div
        style={generatedWebsiteStyle}
        className={`relative flex flex-col gap-4 nm-animate-in rounded-2xl p-4 sm:p-6 transition-colors duration-300 w-full max-w-full overflow-x-hidden border ${
          isLight ? 'border-slate-200 shadow-2xl' : 'border-slate-800 shadow-2xl'
        }`}
        aria-label={`Preview: ${pageData.page || 'Untitled'}`}
      >
        <ToastOverlay toast={toast} />
        <QuickViewModal activeModal={activeModal} onClose={() => setActiveModal(null)} onAddToCart={addToCart} />
        <AuthModal authModal={authModal} onClose={() => setAuthModal(null)} onSuccess={(msg) => showToast('Authenticated', msg, 'success')} />
        <BookingModal bookingModal={bookingModal} onClose={() => setBookingModal(null)} onSuccess={(msg) => showToast('Reservation Confirmed', msg, 'success')} />
        <SlideOutCartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} onUpdateQty={updateCartQty} />

        {sections.map((section) => (
          <SectionRenderer
            key={(section && section.id) ? section.id : `sec-${Math.random().toString(36).slice(2, 8)}`}
            section={section}
            isLightTheme={isLight}
          />
        ))}
      </div>
    </InteractiveUIContext.Provider>
  );
};

export default UIRenderer;
