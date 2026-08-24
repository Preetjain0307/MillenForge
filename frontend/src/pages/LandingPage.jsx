/**
 * LandingPage — NeuraMinds Product Showcase & Entry Page
 *
 * Demonstrates:
 * 1. Product Value Proposition & Headline
 * 2. Visual Workflow (Wireframe → AI → UI → Live CMS Edit)
 * 3. Feature Highlights (Vision AI, Reusable Contracts, CMS Live Edit, Production Export)
 * 4. Sample Showcase Prompts
 * 5. Responsive Design with NeuraMinds Design Tokens
 */

import { Link } from 'react-router-dom';
import NmButton from '../components/NmButton';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Upload Wireframe / Sketch',
    description: 'Provide an image of your UI sketch, paper wireframe, or design mockup.',
    icon: 'pi pi-upload',
  },
  {
    step: '02',
    title: 'Describe Desired UI',
    description: 'Add specific requirements, color themes, domain details, or content goals.',
    icon: 'pi pi-comment',
  },
  {
    step: '03',
    title: 'AI Code Generation',
    description: 'Gemini Vision AI compiles a structured, validated UIPage component tree.',
    icon: 'pi pi-sparkles',
  },
  {
    step: '04',
    title: 'Live CMS Content Edit',
    description: 'Tune titles, images, buttons, and repeating cards in real-time without touching JSX.',
    icon: 'pi pi-sliders-h',
  },
];

const PRODUCT_FEATURES = [
  {
    title: 'Vision AI Layout Analysis',
    description: 'Recognizes layout structures, typography hierarchy, forms, and repeating cards directly from wireframe images.',
    icon: 'pi pi-eye',
    badge: 'AI Vision',
  },
  {
    title: 'Decoupled CMS Data Contract',
    description: 'Clean separation between UI layout structure and dynamic content payloads with stable element key binding.',
    icon: 'pi pi-database',
    badge: 'Data Contract',
  },
  {
    title: 'Interactive Live CMS Editor',
    description: 'Click any element in the live preview to edit text, buttons, image URLs, alt text, and repeating collection items.',
    icon: 'pi pi-desktop',
    badge: 'Visual CMS',
  },
  {
    title: 'Production Ready & Accessible',
    description: 'Generates responsive, accessible, dark-themed UI components using standard Tailwind CSS and semantic HTML5.',
    icon: 'pi pi-check-circle',
    badge: 'Production',
  },
];

const DOMAIN_SAMPLES = [
  { name: 'Food Ordering', desc: 'Hero banner, dish cards with pricing & add-to-cart buttons', icon: 'pi pi-shopping-bag' },
  { name: 'Travel Booking', desc: 'Destination cards, search inputs & hotel booking CTAs', icon: 'pi pi-compass' },
  { name: 'SaaS Analytics', desc: 'KPI metric cards, user search, system health & data tables', icon: 'pi pi-chart-line' },
  { name: 'Fashion Ecommerce', desc: 'Product lookbook, price tags, discount badges & cart actions', icon: 'pi pi-tag' },
  { name: 'Real Estate', desc: 'Property search, sqft/bedroom specs, price badges & agent CTAs', icon: 'pi pi-home' },
  { name: 'Developer Portfolio', desc: 'Hero profile, tech stack tags, project showcase & contact form', icon: 'pi pi-code' },
];

const LandingPage = () => {
  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 gap-16 nm-animate-in">
      {/* ── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center gap-6 pt-4 pb-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(108,99,255,0.15)] border border-[rgba(108,99,255,0.3)] text-[var(--nm-accent-light)] text-xs font-semibold tracking-wide uppercase">
          <i className="pi pi-bolt animate-pulse text-xs" />
          <span>AI Wireframe to Live React UI Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--nm-text-primary)] leading-[1.15]">
          Turn Design Sketches into <span className="nm-gradient-text">Editable React UI</span> in Seconds
        </h1>

        <p className="text-base sm:text-lg text-[var(--nm-text-secondary)] max-w-2xl leading-relaxed">
          Upload hand-drawn wireframes or describe your vision. NeuraMinds compiles structured, responsive web components coupled with a real-time visual CMS editor.
        </p>

        <div className="flex items-center justify-center flex-wrap gap-4 pt-2">
          <Link to="/generate">
            <NmButton
              variant="primary"
              label="Generate Your UI"
              icon="pi pi-sparkles"
              className="px-6 py-3 text-base shadow-[0_0_24px_var(--nm-accent-glow)]"
            />
          </Link>
          <Link to="/preview/Home">
            <NmButton
              variant="secondary"
              label="Explore Interactive Demo"
              icon="pi pi-desktop"
              className="px-6 py-3 text-base"
            />
          </Link>
        </div>
      </section>

      {/* ── 2. VISUAL WORKFLOW ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--nm-text-primary)] mb-2">
            How NeuraMinds Works
          </h2>
          <p className="text-sm text-[var(--nm-text-secondary)]">
            A seamless bridge between visual wireframes, AI code generation, and live content management.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKFLOW_STEPS.map((step) => (
            <div
              key={step.step}
              className="nm-card flex flex-col gap-3 relative overflow-hidden group hover:border-[var(--nm-accent-light)] transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-[var(--nm-accent-light)] opacity-80">
                  {step.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center justify-center text-[var(--nm-accent-light)] group-hover:scale-110 transition-transform">
                  <i className={`${step.icon} text-lg`} />
                </div>
              </div>
              <h3 className="text-base font-bold text-[var(--nm-text-primary)]">
                {step.title}
              </h3>
              <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. FEATURE HIGHLIGHTS ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--nm-text-primary)] mb-2">
            Engineered for Speed & Quality
          </h2>
          <p className="text-sm text-[var(--nm-text-secondary)]">
            Decoupled presentation and data contracts ensure 100% reliable UI components.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRODUCT_FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="nm-glass p-6 rounded-[var(--nm-radius-lg)] border border-[var(--nm-border-subtle)] flex gap-4 items-start hover:border-[var(--nm-border)] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--nm-accent)] to-[var(--nm-accent-glow)] flex items-center justify-center text-white shrink-0 shadow-md">
                <i className={`${feat.icon} text-xl`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--nm-text-primary)]">
                    {feat.title}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)]">
                    {feat.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--nm-text-secondary)] leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. SUPPORTED DOMAINS ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6 nm-card bg-gradient-to-br from-[var(--nm-bg-card)] to-[rgba(108,99,255,0.05)] border border-[var(--nm-border)]">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-th-large text-[var(--nm-accent-light)]" />
            <span>Supported Domain Applications</span>
          </h2>
          <p className="text-xs text-[var(--nm-text-secondary)]">
            NeuraMinds generates realistic, contextual layouts tailored to your industry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOMAIN_SAMPLES.map((dom) => (
            <div
              key={dom.name}
              className="p-4 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-start gap-3"
            >
              <i className={`${dom.icon} text-lg text-[var(--nm-accent-light)] mt-0.5`} />
              <div>
                <h4 className="text-sm font-semibold text-[var(--nm-text-primary)]">
                  {dom.name}
                </h4>
                <p className="text-xs text-[var(--nm-text-muted)] leading-relaxed">
                  {dom.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-center">
          <Link to="/generate">
            <NmButton
              variant="primary"
              label="Start Generating Now"
              icon="pi pi-arrow-right"
              className="px-6 py-2.5"
            />
          </Link>
        </div>
      </section>

      {/* ── 5. FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--nm-border-subtle)] pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--nm-text-muted)]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[var(--nm-accent)] flex items-center justify-center text-white text-xs">
            <i className="pi pi-bolt" />
          </div>
          <span className="font-semibold text-[var(--nm-text-secondary)]">NeuraMinds AI Engine</span>
          <span>· Real-time UI & CMS Generation</span>
        </div>
        <div>
          <span>Crafted for high-performance AI web application generation</span>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
