import { createNavigation } from 'next-intl/navigation';
import { defaultLocale, locales } from '@shared/i18n/config';

export const { Link, useRouter, usePathname, redirect } = createNavigation({
  locales,
  defaultLocale,
});
