/**
 * UIRendererTestPage — /renderer-test
 *
 * Dev fixture page to validate every UIRenderer element type without
 * needing backend generation or Redux state.
 *
 * Tests:
 *  - text (h1, h2, p tags)
 *  - image (valid url + broken url fallback)
 *  - button (primary, secondary, ghost variants)
 *  - textfield / input (with label)
 *  - card (single, with icon + badge)
 *  - cards (loop with 4 items)
 *  - carousel (3 slides)
 *  - wizard (3 steps, step 1 active)
 *  - icon
 *  - divider
 *  - link
 *  - list (ul and ol)
 *  - badge
 *  - unknown type (graceful fallback)
 *  - null element (graceful fallback)
 *  - empty section (graceful fallback)
 *  - empty pageData (graceful fallback — tested via second renderer)
 */
import UIRenderer from '../components/UIRenderer';

// ─── Fixture Data ─────────────────────────────────────────────────────────────

const FIXTURE_PAGE = {
  page: 'Renderer Test',
  id: 'page-renderer-test',
  sections: [

    // ── 1. Text variations ────────────────────────────────────────────────
    {
      id: 'sec-text',
      type: 'hero',
      props: { layout: 'center', background: 'gradient' },
      elements: [
        {
          id: 'text-h1',
          type: 'text',
          content: 'NeuraMindss UI Renderer',
          fallback: 'Heading',
          props: { tag: 'h1', className: 'text-4xl font-bold nm-gradient-text' },
        },
        {
          id: 'text-h2',
          type: 'text',
          content: 'Component Registry Test Page',
          fallback: 'Subheading',
          props: { tag: 'h2', className: 'text-xl text-[var(--nm-text-secondary)]' },
        },
        {
          id: 'text-p',
          type: 'text',
          content: 'Every element type below is rendered from a fixture UIPage. No backend, no Redux.',
          fallback: 'Description text.',
          props: { tag: 'p', className: 'text-sm text-[var(--nm-text-muted)] max-w-lg' },
        },
        {
          id: 'text-empty',
          type: 'text',
          content: '',
          fallback: '',
          props: { tag: 'p' },
        },
      ],
    },

    // ── 2. Image ──────────────────────────────────────────────────────────
    {
      id: 'sec-image',
      type: 'custom',
      props: { layout: 'center' },
      elements: [
        {
          id: 'img-valid',
          type: 'image',
          content: 'https://placehold.co/600x300/16213e/6c63ff?text=Generated+Image',
          fallback: 'Placeholder',
          props: { alt: 'A sample generated UI wireframe', className: 'max-h-52 mx-auto' },
        },
        {
          id: 'img-broken',
          type: 'image',
          content: 'https://definitely-broken-url-404.example/img.png',
          fallback: 'Broken image fallback',
          props: { alt: 'This image should show error fallback', className: 'max-h-52 mx-auto' },
        },
      ],
    },

    // ── 3. Button variants ────────────────────────────────────────────────
    {
      id: 'sec-buttons',
      type: 'cta',
      props: {},
      elements: [
        {
          id: 'btn-primary',
          type: 'button',
          content: 'Primary Button',
          fallback: 'Click Me',
          props: { variant: 'primary', icon: 'pi pi-sparkles' },
        },
        {
          id: 'btn-secondary',
          type: 'button',
          content: 'Secondary Button',
          fallback: 'Click Me',
          props: { variant: 'secondary', icon: 'pi pi-download' },
        },
        {
          id: 'btn-ghost',
          type: 'button',
          content: 'Ghost Button',
          fallback: 'Click Me',
          props: { variant: 'ghost', icon: 'pi pi-arrow-right' },
        },
        {
          id: 'btn-empty',
          type: 'button',
          content: '',
          fallback: '',
          props: {},
        },
      ],
    },

    // ── 4. Input / Textfield ──────────────────────────────────────────────
    {
      id: 'sec-inputs',
      type: 'custom',
      props: {},
      elements: [
        {
          id: 'input-name',
          type: 'input',
          content: 'Your Name',
          fallback: 'Name',
          props: { label: 'Full Name', placeholder: 'e.g. Jane Doe', inputType: 'text' },
        },
        {
          id: 'textfield-email',
          type: 'textfield',
          content: 'Email Address',
          fallback: 'Email',
          props: { label: 'Email Address', placeholder: 'e.g. jane@example.com', inputType: 'email' },
        },
        {
          id: 'input-no-label',
          type: 'input',
          content: '',
          fallback: '',
          props: {},
        },
      ],
    },

    // ── 5. Single Card ────────────────────────────────────────────────────
    {
      id: 'sec-single-card',
      type: 'custom',
      props: {},
      elements: [
        {
          id: 'card-single',
          type: 'card',
          content: 'Cards display structured information with icon, title, description and badge.',
          fallback: 'Card content.',
          props: {
            icon: 'pi pi-bolt',
            title: 'Feature Card',
            description: 'Cards display structured information with icon, title, description and badge.',
            badge: 'New',
          },
        },
      ],
    },

    // ── 6. Cards Loop ─────────────────────────────────────────────────────
    {
      id: 'sec-cards-loop',
      type: 'features',
      props: { columns: 3 },
      elements: [
        {
          id: 'cards-loop-el',
          type: 'cards',
          content: 'Feature Cards',
          fallback: '',
          props: {
            columns: 3,
            items: [
              {
                id: 'lc-1',
                title: 'Wireframe Upload',
                description: 'Drag-and-drop or click to upload your wireframe sketch.',
                icon: 'pi pi-image',
                badge: 'v1',
              },
              {
                id: 'lc-2',
                title: 'AI Generation',
                description: 'Gemini Vision converts your sketch to a production UI.',
                icon: 'pi pi-sparkles',
              },
              {
                id: 'lc-3',
                title: 'Live Preview',
                description: 'Instantly preview and iterate on your generated UI.',
                icon: 'pi pi-eye',
                badge: 'Beta',
              },
              {
                id: 'lc-4',
                title: 'Export Code',
                description: 'Export clean React + Tailwind code. (Coming soon)',
                icon: 'pi pi-code',
              },
            ],
          },
        },
      ],
    },

    // ── 7. Carousel ───────────────────────────────────────────────────────
    {
      id: 'sec-carousel',
      type: 'custom',
      props: {},
      elements: [
        {
          id: 'carousel-el',
          type: 'carousel',
          content: 'Product Screenshots',
          fallback: '',
          props: {
            'aria-label': 'Product screenshot carousel',
            slides: [
              {
                id: 'slide-1',
                src: 'https://placehold.co/800x400/0a0a0f/6c63ff?text=Slide+1',
                alt: 'Generate Page screenshot',
                title: 'Generate Page',
                description: 'Upload wireframes and craft prompts.',
              },
              {
                id: 'slide-2',
                src: 'https://placehold.co/800x400/16213e/a78bfa?text=Slide+2',
                alt: 'Preview Page screenshot',
                title: 'Preview Page',
                description: 'Render and inspect AI-generated UI.',
              },
              {
                id: 'slide-3',
                src: 'https://placehold.co/800x400/1a1a2e/60a5fa?text=Slide+3',
                alt: 'Export flow screenshot',
                title: 'Export (Coming Soon)',
                description: 'Download clean production-ready code.',
              },
            ],
          },
        },
      ],
    },

    // ── 8. Wizard ─────────────────────────────────────────────────────────
    {
      id: 'sec-wizard',
      type: 'custom',
      props: {},
      elements: [
        {
          id: 'wizard-el',
          type: 'wizard',
          content: 'Generation Wizard',
          fallback: '',
          props: {
            activeStep: 1,
            steps: [
              {
                id: 'step-1',
                label: 'Upload Wireframe',
                description: 'Choose a JPG, PNG, or WEBP wireframe image.',
                icon: 'pi pi-image',
              },
              {
                id: 'step-2',
                label: 'Describe Your UI',
                description: 'Add a prompt to guide AI generation.',
                icon: 'pi pi-pen-to-square',
              },
              {
                id: 'step-3',
                label: 'Generate & Preview',
                description: 'NeuraMindss renders your UI live.',
                icon: 'pi pi-sparkles',
              },
            ],
          },
        },
      ],
    },

    // ── 9. Icon, Divider, Link, List, Badge ───────────────────────────────
    {
      id: 'sec-misc',
      type: 'custom',
      props: {},
      elements: [
        {
          id: 'icon-star',
          type: 'icon',
          content: 'pi pi-star-fill',
          fallback: 'pi pi-star',
          props: { 'aria-label': 'Favourite' },
        },
        {
          id: 'divider-1',
          type: 'divider',
          content: '',
          fallback: '',
          props: {},
        },
        {
          id: 'link-docs',
          type: 'link',
          content: 'View Documentation',
          fallback: 'Docs',
          props: { href: '/docs' },
        },
        {
          id: 'list-ul',
          type: 'list',
          content: 'React 19, Vite 8, Tailwind 4',
          fallback: '',
          props: {},
        },
        {
          id: 'list-ol',
          type: 'list',
          content: 'Upload,Generate,Preview,Export',
          fallback: '',
          props: { ordered: true },
        },
        {
          id: 'badge-new',
          type: 'badge',
          content: 'Beta',
          fallback: 'New',
          props: {},
        },
      ],
    },

    // ── 10. Unknown element type ───────────────────────────────────────────
    {
      id: 'sec-unknown',
      type: 'custom',
      props: {},
      elements: [
        {
          id: 'unknown-el',
          type: 'rating-widget',
          content: '4.5 stars',
          fallback: 'Rating',
          props: {},
        },
        {
          id: 'null-el',
          type: 'custom',
          content: '',
          fallback: '',
          props: {},
        },
      ],
    },

    // ── 11. Empty section ─────────────────────────────────────────────────
    {
      id: 'sec-empty',
      type: 'features',
      props: {},
      elements: [],
    },

    // ── 12. Malformed elements (null values) ──────────────────────────────
    {
      id: 'sec-malformed',
      type: 'custom',
      props: {},
      elements: [
        null,
        undefined,
        { id: 'no-type', content: 'Element with no type field' },
        { type: 'text', content: 'Element with no id' },
      ],
    },
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const UIRendererTestPage = () => {
  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-8 gap-6 nm-animate-in">

      {/* Dev warning banner */}
      <div
        role="note"
        className="flex items-center gap-3 px-4 py-3 rounded-[var(--nm-radius-sm)]
                   bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)]
                   text-[var(--nm-warning)] text-sm"
      >
        <i className="pi pi-wrench text-base" aria-hidden="true" />
        <div>
          <strong>Dev fixture page</strong> — This is a development-only page at
          <code className="mx-1 font-mono text-xs bg-[rgba(0,0,0,0.3)] px-1.5 py-0.5 rounded">
            /renderer-test
          </code>
          for validating all UIRenderer element types. It does not use Redux or the backend.
        </div>
      </div>

      {/* Page header */}
      <div>
        <p className="text-xs text-[var(--nm-text-muted)] uppercase tracking-widest font-medium mb-1">
          Developer Tools
        </p>
        <h1 className="text-2xl font-bold text-[var(--nm-text-primary)]">
          UIRenderer — Test Fixture
        </h1>
        <p className="text-sm text-[var(--nm-text-secondary)] mt-1">
          All supported element types rendered from a static fixture UIPage.
        </p>
      </div>

      {/* Section index */}
      <div className="nm-glass rounded-[var(--nm-radius-sm)] px-4 py-3">
        <p className="text-xs text-[var(--nm-text-secondary)] font-medium mb-2">Sections tested:</p>
        <ol className="text-xs text-[var(--nm-text-muted)] list-decimal list-inside space-y-0.5 columns-2">
          <li>Text (h1, h2, p, empty)</li>
          <li>Image (valid + broken url)</li>
          <li>Button (primary, secondary, ghost, empty)</li>
          <li>Input / Textfield</li>
          <li>Card (single)</li>
          <li>Cards (loop, 4 items)</li>
          <li>Carousel (3 slides)</li>
          <li>Wizard (3 steps)</li>
          <li>Icon, Divider, Link, List, Badge</li>
          <li>Unknown element type</li>
          <li>Empty section</li>
          <li>Malformed elements (null/undefined)</li>
        </ol>
      </div>

      {/* Main fixture render */}
      <div className="nm-card p-4">
        <UIRenderer pageData={FIXTURE_PAGE} />
      </div>

      {/* Null pageData test */}
      <div>
        <p className="text-xs font-medium text-[var(--nm-text-muted)] mb-2 uppercase tracking-wide">
          Null pageData fallback:
        </p>
        <div className="nm-card p-4">
          <UIRenderer pageData={null} />
        </div>
      </div>

      {/* Empty sections array test */}
      <div>
        <p className="text-xs font-medium text-[var(--nm-text-muted)] mb-2 uppercase tracking-wide">
          Empty sections fallback:
        </p>
        <div className="nm-card p-4">
          <UIRenderer pageData={{ page: 'Empty', sections: [] }} />
        </div>
      </div>
    </main>
  );
};

export default UIRendererTestPage;
