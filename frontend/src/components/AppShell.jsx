/**
 * AppShell — Top navigation bar for NeuraMind
 */
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Generate', path: '/generate' },
];

const AppShell = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 nm-glass border-b border-[var(--nm-border-subtle)]">
      <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/generate" className="flex items-center gap-2 no-underline group">
          <div className="w-7 h-7 rounded-lg bg-[var(--nm-accent)] flex items-center justify-center
                          group-hover:shadow-[0_0_12px_var(--nm-accent-glow)] transition-shadow">
            <i className="pi pi-bolt text-white text-sm" />
          </div>
          <span className="font-bold text-lg tracking-tight nm-gradient-text">
            NeuraMind
          </span>
        </Link>

        {/* Nav links */}
        <ul className="flex items-center gap-1 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors
                  ${location.pathname.startsWith(link.path)
                    ? 'text-[var(--nm-accent-light)] bg-[var(--nm-accent-glow)]'
                    : 'text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)] hover:bg-[var(--nm-border-subtle)]'
                  }
                `}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default AppShell;
