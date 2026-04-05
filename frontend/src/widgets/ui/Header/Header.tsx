import { Menu, Search, User } from 'lucide-react';
import { Logo } from '@shared/ui/Logo';
import { Link } from '@shared/i18n/navigation';
import { LangSwitcher } from '@features/LangSwitcher';
import { ThemeSwitcher } from '@features/ThemeSwitcher';
import { getTranslations } from 'next-intl/server';

export const Header = async () => {
  const t = await getTranslations('header');

  return (
    <header className="py-4 bg-surface border-b border-border">
      <div className="container-hf flex items-center gap-3 lg:gap-8 ">
        <button className="md:hidden" aria-label={t('openMenu')}>
          <Menu size={24} />
        </button>
        <Logo />
        <nav className="hidden md:block">
          <ul className="flex items-center gap-2 lg:gap-4 h-10 font-medium">
            <li>
              <Link className="hover:text-accent py-2 px-1" href={'/movies'}>
                {t('movies')}
              </Link>
            </li>
            <li>
              <Link className="hover:text-accent py-2 px-1" href={'/random'}>
                {t('surpriseMe')}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex items-center ml-auto gap-3 md:gap-6">
          <button
            aria-label={t('search')}
            className="flex items-center justify-center gap-1 h-10 px-2 rounded-sm border border-border cursor-pointer"
          >
            <Search size={17} className="text-muted" />
            <span className="text-sm font-semibold hidden md:block">⌘K</span>
          </button>
          <LangSwitcher className="flex items-center justify-center gap-1 h-10 px-2 rounded-sm border border-border cursor-pointer" />
          <ThemeSwitcher className="border border-border rounded-sm h-10 hidden lg:flex" />

          <button
            className="flex items-center justify-center w-10 h-10 bg-container rounded-full cursor-pointer"
            aria-label={t('openAccount')}
          >
            <User size={16} className="text-muted" />
          </button>
        </div>
      </div>
    </header>
  );
};
