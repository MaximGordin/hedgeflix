import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from '@shared/i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
});

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
