/**
 * AppShell — Top navigation header bar for NeuroMinds
 */
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Workspace', path: '/home', icon: 'pi pi-th-large' },
  { label: 'Generate', path: '/generate', icon: 'pi pi-sparkles', highlight: true },
  { label: 'Diagrams', path: '/diagrams', icon: 'pi pi-sitemap' },
  { label: 'Preview & CMS', path: '/preview/Home', icon: 'pi pi-desktop' },
  { label: 'Intelligence', path: '/intelligence', icon: 'pi pi-brain' },
  { label: 'Review & Healing', path: '/review', icon: 'pi pi-shield' },
  { label: 'History', path: '/history', icon: 'pi pi-history' },
];

const AppShell = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-[#111113]/90 backdrop-blur-xl border-b border-[#2A2A30]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4" aria-label="Main Navigation">
        {/* Left: Brand Identity */}
        <Link to="/" className="flex items-center gap-3 no-underline group" aria-label="NeuroMinds Home">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all">
            <i className="pi pi-bolt text-white text-sm" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[#F8FAFC] flex items-center gap-1.5 leading-none">
              NeuroMinds
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30 uppercase">
                Studio
              </span>
            </span>
            <span className="text-[10px] font-mono text-[#94A3B8] tracking-wider uppercase mt-0.5">
              AI UI & CMS Engine
            </span>
          </div>
        </Link>

        {/* Center/Right: Navigation Items */}
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
                      px-3 py-1.5 rounded-md text-xs font-medium no-underline transition-all flex items-center gap-1.5
                      ${isActive
                        ? 'text-[#F8FAFC] bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                        : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#18181B] border border-transparent'
                      }
                    `}
                  >
                    <i className={`${link.icon} text-xs ${isActive ? 'text-[#A78BFA]' : 'text-[#94A3B8]'}`} aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Engine Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181B] border border-[#2A2A30] text-[#34D399] text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]"></span>
            </span>
            <span>AI Ready</span>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default AppShell;
