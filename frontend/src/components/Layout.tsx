import type { ReactNode } from 'react';
import type { Section } from '../App';
import { BookOpen, ScrollText, Users, MessageCircle, Phone } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const navItems: { id: Section; label: string; sublabel: string; icon: typeof BookOpen }[] = [
  { id: 'manuscripts', label: '家族古籍', sublabel: '古籍缩影', icon: BookOpen },
  { id: 'history', label: '家族历史', sublabel: '历史记载', icon: ScrollText },
  { id: 'people', label: '人物整理', sublabel: '族人档案', icon: Users },
  { id: 'interaction', label: '族人互动', sublabel: '互动交流', icon: MessageCircle },
  { id: 'contact', label: '联系家族', sublabel: '联系方式', icon: Phone },
];

export default function Layout({ children, activeSection, onSectionChange }: LayoutProps) {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'deng-genealogy');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Banner */}
      <header className="relative w-full overflow-hidden">
        <div className="relative h-36 md:h-48 overflow-hidden">
          <img
            src="/assets/generated/hero-banner.dim_1200x300.png"
            alt="邓氏家族族谱"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="bg-primary/80 backdrop-blur-sm px-8 py-3 border border-gold/60 shadow-manuscript">
              <h1 className="font-serif text-2xl md:text-4xl font-bold text-primary-foreground tracking-[0.3em] text-center">
                邓氏家族族谱系统
              </h1>
              <p className="text-primary-foreground/70 text-xs md:text-sm text-center tracking-[0.2em] mt-1 font-serif">
                DENG FAMILY GENEALOGY SYSTEM
              </p>
            </div>
          </div>
        </div>

        {/* Navigation bar */}
        <nav className="bg-primary border-b-2 border-gold">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-stretch overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 transition-all duration-200
                      font-serif tracking-wider text-sm md:text-base relative flex-shrink-0
                      ${isActive
                        ? 'bg-background text-foreground'
                        : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary/80'
                      }
                    `}
                  >
                    {isActive && (
                      <span className="absolute top-0 left-0 right-0 h-0.5 bg-gold" />
                    )}
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:block">{item.label}</span>
                    <span className="block sm:hidden text-xs">{item.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/40 bg-card mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground font-serif">
          <span>© {year} 邓氏家族族谱系统 · 版权所有</span>
          <span className="flex items-center gap-1">
            Built with{' '}
            <span className="text-seal">♥</span>{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
