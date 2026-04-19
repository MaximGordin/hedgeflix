'use client';

import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@shared/i18n/navigation';
import { locales } from '@shared/i18n/config';
import { languageMap } from './config';
import { Dialog } from '@shared/ui/Dialog';

type LangSwitcherProps = {
  className?: string;
};

export const LangSwitcher = ({ className }: LangSwitcherProps) => {
  const t = useTranslations('langSwitcher');
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  function toggleLanguage(locale: string) {
    router.replace(pathname, { locale });
  }

  return (
    <Dialog>
      <Dialog.Trigger className={className} ariaLabel={t('openDialog')}>
        <Globe size={17} className="text-muted" />
        <span className="text-sm font-semibold uppercase">{currentLocale}</span>
      </Dialog.Trigger>
      <Dialog.Content>
        <ul className="grid grid-cols-2 gap-3">
          {locales.map((locale) => (
            <li key={locale}>
              <button
                className="flex flex-col items-center justify-between gap-2 w-full cursor-pointer rounded-sm bg-container p-2 text-text"
                onClick={() => toggleLanguage(locale)}
              >
                <span>{languageMap[locale].flag}</span>
                <span>{languageMap[locale].name}</span>
              </button>
            </li>
          ))}
        </ul>
      </Dialog.Content>
    </Dialog>
  );
};
