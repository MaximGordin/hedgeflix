import { Menu, Search, User } from 'lucide-react';
import { Logo } from '@shared/ui/Logo';
import Link from 'next/link';
import { LangSwitcher } from '@widgets/ui/LangSwitcher';
import { ThemeSwitcher } from '@widgets/ui/ThemeSwitcher';


export const Header = () => {
  return (
    <header className="flex items-center gap-3 lg:gap-8 px-4 md:px-8 py-4 bg-surface border-b border-border">
      <button className="md:hidden" aria-label="Open mobile menu">
        <Menu size={24} />
      </button>
      <Logo />
      <nav className="hidden md:block">
        <ul className="flex items-center gap-2 lg:gap-4 h-10 font-medium">
          <li>
            <Link className="hover:text-accent py-2 px-1" href={'/movie'}>
              Movies
            </Link>
          </li>
          <li>
            <Link className="hover:text-accent py-2 px-1" href={'/series'}>
              Series
            </Link>
          </li>
          <li>
            <Link className="hover:text-accent py-2 px-1" href={'/random'}>
              Surprise Me!
            </Link>
          </li>
        </ul>
      </nav>
      <div className="flex items-center ml-auto gap-3 md:gap-6">
        <button
          aria-label="Search"
          className="flex items-center justify-center gap-1 h-10 px-2 rounded-sm border border-border cursor-pointer"
        >
          <Search size={17} className="text-muted" />
          <span className="text-sm font-semibold hidden md:block">⌘K</span>
        </button>
        <LangSwitcher className="flex items-center justify-center gap-1 h-10 px-2 rounded-sm border border-border cursor-pointer" />
        <ThemeSwitcher className="border border-border rounded-sm h-10 hidden md:flex" />

        <button
          className="flex items-center justify-center w-10 h-10 bg-container rounded-full cursor-pointer"
          aria-label="Open account menu"
        >
          <User size={16} className="text-muted" />
        </button>
      </div>
    </header>
  );
};
