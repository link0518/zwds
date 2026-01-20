import { useEffect, useState } from 'react';
import { Menu, X, Sun, Moon, Info, ExternalLink } from 'lucide-react';
import type { NavbarProps, NavLink } from '../types';

const Navbar = ({ onNavigateHome, onOpenSavedCharts, isDark, onToggleTheme }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: NavLink[] = [
    { name: '首页', action: () => onNavigateHome?.() },
    { name: '星盘', action: () => onOpenSavedCharts?.() },
    { name: '六爻', href: 'https://jx3.faoo.de/', external: true },
    { name: '梅花易数', href: 'https://mhys.faoo.de/', external: true },
    { name: '关于', action: () => setShowAboutModal(true) },
  ];

  const handleLinkClick = (link: NavLink, closeMobile = false) => {
    if (link.external && link.href) {
      window.open(link.href, '_blank', 'noopener,noreferrer');
    } else if (link.action) {
      link.action();
    }
    if (closeMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 px-4 bg-lz-paper/90 backdrop-blur-lg border-b-2 border-lz-red/20 ${isScrolled ? 'shadow-lg shadow-lz-ink/5' : 'shadow-md shadow-lz-ink/3'}`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigateHome?.()}>
            <div className="w-10 h-10 bg-lz-red rounded-sm flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm">
              玄
            </div>
            <span className="text-xl font-serif font-bold tracking-widest text-lz-ink">
              紫微斗数
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link)}
                className="text-lz-ink-light hover:text-lz-red font-serif tracking-widest transition-colors text-sm flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                {link.name}
                {link.external && <ExternalLink size={12} />}
              </button>
            ))}
            <button
              className="p-2 rounded-full hover:bg-lz-paper-dark/50 transition-colors text-lz-ink-light"
              onClick={onToggleTheme}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              className="p-2 rounded-full hover:bg-lz-paper-dark/50 transition-colors text-lz-ink-light"
              onClick={onToggleTheme}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="p-2 text-lz-ink"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-lz-paper/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 animate-in fade-in duration-200">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleLinkClick(link, true)}
              className="text-2xl font-serif text-lz-ink hover:text-lz-red flex items-center gap-2 bg-transparent border-none cursor-pointer"
            >
              {link.name}
              {link.external && <ExternalLink size={18} />}
            </button>
          ))}
        </div>
      )}

      {showAboutModal && (
        <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="modal-content max-w-lg" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <Info size={20} className="text-lz-red" />
              <h3 className="modal-title">关于</h3>
              <button
                className="modal-close-btn ml-auto"
                onClick={() => setShowAboutModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-lz-red rounded-sm flex items-center justify-center text-white font-serif font-bold text-3xl shadow-md mx-auto mb-4">
                  玄
                </div>
                <h2 className="text-2xl font-serif font-bold text-lz-ink tracking-widest">
                  紫微斗数排盘系统
                </h2>
                <p className="text-lz-ink-lighter text-sm mt-2">v1.0.0</p>
              </div>

              <div className="space-y-4 text-sm text-lz-ink-light">
                <p>
                  紫微斗数是中国古代命理学中最精深的一门术数，以紫微星为主，配合天府、太阳、太阴等星曜，推演人生运势。
                </p>
                <p>
                  本系统提供专业的紫微斗数排盘功能，帮助你快速生成个人星盘，洞悉人生轨迹。
                </p>

                <div className="pt-4 border-t border-lz-paper-dark">
                  <h4 className="font-medium text-lz-ink mb-2">相关工具</h4>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://jx3.faoo.de/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lz-red hover:text-lz-red-dark flex items-center gap-1"
                    >
                      六爻排盘 <ExternalLink size={12} />
                    </a>
                    <a
                      href="https://mhys.faoo.de/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lz-red hover:text-lz-red-dark flex items-center gap-1"
                    >
                      梅花易数 <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-lz-paper-dark text-center text-xs text-lz-ink-lighter">
                <p>© 2026 咕涌 · 紫微斗数排盘</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
