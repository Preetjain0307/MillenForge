/**
 * ImageEditor — CMS Editor for Image Elements
 *
 * Supports editing:
 * - Image URL (src)
 * - Alt text (accessibility)
 * - Fallback text
 * - Visual live preview thumbnail
 * - Quick presets for hackathon demonstrations
 */

import React, { useState } from 'react';

const PRESET_IMAGES = [
  { label: '🖼️ AI Workspace', src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', alt: 'AI Workspace' },
  { label: '📊 Dashboard', src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', alt: 'Analytics Dashboard' },
  { label: '🎨 Abstract Code', src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80', alt: 'Code on Screen' },
  { label: '📐 Wireframe', src: 'https://placehold.co/600x400/1a1a2e/6c63ff?text=Wireframe+Sketch', alt: 'Wireframe Design' },
];

/**
 * @param {object} props
 * @param {import('../../types/cms.js').CmsElement} props.element
 * @param {function} props.onUpdate - (updatedData) => void
 * @param {boolean} [props.disabled=false]
 */
const ImageEditor = ({ element, onUpdate, disabled = false }) => {
  const [imgError, setImgError] = useState(false);

  if (!element || typeof element !== 'object') {
    return (
      <div className="p-4 text-xs text-[var(--nm-text-muted)] text-center">
        No image element provided.
      </div>
    );
  }

  const rawContent = element.content;
  let currentSrc = '';
  let currentAlt = element.fallback || 'Generated image';

  if (typeof rawContent === 'string' && rawContent.trim() !== '') {
    currentSrc = rawContent;
  } else if (rawContent && typeof rawContent === 'object') {
    currentSrc = rawContent.src || rawContent.url || '';
    currentAlt = rawContent.alt || element.props?.alt || currentAlt;
  }

  if (!currentSrc && element.props?.src) {
    currentSrc = element.props.src;
  }
  if (element.props?.alt) {
    currentAlt = element.props.alt;
  }

  const handleSrcChange = (e) => {
    const newSrc = e.target.value;
    setImgError(false);
    if (rawContent && typeof rawContent === 'object') {
      onUpdate?.({
        content: {
          ...rawContent,
          src: newSrc,
          alt: currentAlt,
        },
        props: {
          ...(element.props || {}),
          src: newSrc,
        },
      });
    } else {
      onUpdate?.({
        content: newSrc,
        props: {
          ...(element.props || {}),
          src: newSrc,
        },
      });
    }
  };

  const handleAltChange = (e) => {
    const newAlt = e.target.value;
    if (rawContent && typeof rawContent === 'object') {
      onUpdate?.({
        content: {
          ...rawContent,
          src: currentSrc,
          alt: newAlt,
        },
        props: {
          ...(element.props || {}),
          alt: newAlt,
        },
      });
    } else {
      onUpdate?.({
        props: {
          ...(element.props || {}),
          alt: newAlt,
        },
      });
    }
  };

  const handleApplyPreset = (preset) => {
    setImgError(false);
    onUpdate?.({
      content: {
        ...(typeof rawContent === 'object' ? rawContent : {}),
        src: preset.src,
        alt: preset.alt,
      },
      props: {
        ...(element.props || {}),
        src: preset.src,
        alt: preset.alt,
      },
    });
  };

  const handleFallbackChange = (e) => {
    onUpdate?.({
      fallback: e.target.value,
    });
  };

  return (
    <div className="flex flex-col gap-4 text-sm">
      {/* Image Thumbnail Preview */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--nm-text-secondary)]">
          Live Thumbnail Preview
        </label>
        <div className="relative w-full h-36 rounded-[var(--nm-radius-sm)] border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] overflow-hidden flex items-center justify-center">
          {currentSrc && !imgError ? (
            <img
              src={currentSrc}
              alt={currentAlt}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-xs text-[var(--nm-text-muted)] p-3 text-center">
              <i className="pi pi-image text-2xl text-[var(--nm-accent)]" />
              <span>{imgError ? 'Image failed to load' : 'No image URL provided'}</span>
            </div>
          )}

          {currentSrc && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[rgba(0,0,0,0.6)] text-[10px] font-mono text-[var(--nm-text-secondary)] backdrop-blur-sm">
              {currentAlt || 'Image'}
            </span>
          )}
        </div>
      </div>

      {/* Image URL Input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cms-img-src" className="font-medium text-[var(--nm-text-primary)]">
          Image Source URL
        </label>
        <div className="relative flex items-center">
          <i className="pi pi-link absolute left-3 text-xs text-[var(--nm-text-muted)]" />
          <input
            id="cms-img-src"
            type="text"
            value={currentSrc}
            onChange={handleSrcChange}
            disabled={disabled}
            placeholder="https://images.unsplash.com/..."
            className="w-full pl-8 pr-3 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] focus:ring-1 focus:ring-[var(--nm-accent)] transition-all font-mono"
          />
        </div>
      </div>

      {/* Quick Preset Buttons */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--nm-text-secondary)]">
          Quick Demo Presets
        </span>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_IMAGES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              disabled={disabled}
              className="px-2.5 py-1.5 text-xs text-left rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)] hover:border-[var(--nm-accent)] transition-all truncate"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alt Text Field (Accessibility) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cms-img-alt" className="text-xs font-medium text-[var(--nm-text-secondary)] flex items-center justify-between">
          <span>Alt Text (Accessibility)</span>
          <span className="text-[10px] text-[var(--nm-text-muted)]">Screen readers</span>
        </label>
        <input
          id="cms-img-alt"
          type="text"
          value={currentAlt}
          onChange={handleAltChange}
          disabled={disabled}
          placeholder="Describe the image content..."
          className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
        />
      </div>

      {/* Fallback Text */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cms-img-fallback" className="text-xs font-medium text-[var(--nm-text-secondary)]">
          Fallback Text
        </label>
        <input
          id="cms-img-fallback"
          type="text"
          value={element.fallback || ''}
          onChange={handleFallbackChange}
          disabled={disabled}
          placeholder="Default alt/title"
          className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
        />
      </div>
    </div>
  );
};

export default ImageEditor;
