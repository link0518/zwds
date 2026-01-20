import Navbar from './Navbar';
import type { LayoutProps } from '../types';

const Layout = ({ children, onNavigateHome, onOpenSavedCharts, isDark, onToggleTheme }: LayoutProps) => {
  return (
    <div className="h-screen flex flex-col bg-lz-paper text-lz-ink selection:bg-lz-red/20 selection:text-lz-red-dark">
      <Navbar
        onNavigateHome={onNavigateHome}
        onOpenSavedCharts={onOpenSavedCharts}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />

      <div className="flex-1 flex flex-col pt-16 overflow-hidden">
        <main className="flex-1 flex flex-col px-4 w-full max-w-7xl mx-auto overflow-hidden">
          {children}
        </main>

        <footer className="shrink-0 text-center py-2 text-lz-ink-lighter text-xs font-sans border-t border-lz-paper-dark bg-lz-paper/80 backdrop-blur-sm">
          <p>© 2026 咕涌 · 紫微斗数排盘</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
