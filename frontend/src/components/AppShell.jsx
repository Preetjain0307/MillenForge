/**
 * AppShell ΓÇö Top navigation bar for NeuraMind
 */
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Workspace', path: '/home', icon: 'pi pi-th-large' },
  { label: 'Generate', path: '/generate', icon: 'pi pi-sparkles' },
  { label: 'Diagrams', path: '/diagrams', icon: 'pi pi-sitemap' },
  { label: 'Preview & CMS', path: '/preview/Home', icon: 'pi pi-desktop' },
  { label: 'Intelligence', path: '/intelligence', icon: 'pi pi-brain' },
  { label: 'Review & Healing', path: '/review', icon: 'pi pi-shield' },
  { label: 'History', path: '/history', icon: 'pi pi-history' },
];

const AppShell = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 nm-glass border-b border-[var(--nm-border-subtle)] bg-[rgba(10,10,15,0.85)] backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4" aria-label="Main Navigation">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline group" aria-label="NeuraMind Home">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--nm-accent)] to-[var(--nm-accent-glow)] flex items-center justify-center group-hover:shadow-[0_0_16px_var(--nm-accent-glow)] transition-all">
            <i className="pi pi-bolt text-white text-base" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight nm-gradient-text leading-none">
              NeuraMind
            </span>
            <span className="text-[10px] font-mono text-[var(--nm-text-muted)] tracking-wider uppercase">
              AI UI & CMS Engine
            </span>
          </div>
        </Link>

        {/* Right side: Nav links & Engine status */}
        <div className="flex items-center gap-3">
          <ul className="flex items-center gap-1 list-none m-0 p-0" role="menubar">
            {NAV_LINKS.map((link) => {
              const isActive =
                (link.path === '/home' && (location.pathname === '/' || location.pathname === '/home')) ||
                (link.path === '/preview/Home' && location.pathname.startsWith('/preview/')) ||
                (link.path !== '/home' && link.path !== '/preview/Home' && location.pathname.startsWith(link.path));
              return (
                <li key={link.path} role="none">
                  <Link
                    to={link.path}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium no-underline transition-all flex items-center gap-1.5
                      ${isActive
                        ? 'text-[var(--nm-accent-light)] bg-[rgba(108,99,255,0.15)] border border-[rgba(108,99,255,0.3)] shadow-sm'
                        : 'text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)] hover:bg-[var(--nm-bg-surface)]'
                      }
                    `}
                  >
                    <i className={`${link.icon} text-xs`} aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Engine Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] text-[var(--nm-success)] text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nm-success)] animate-pulse" />
            <span>AI Ready</span>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default AppShell;
