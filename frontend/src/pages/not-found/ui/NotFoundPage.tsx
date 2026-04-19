import { Oswald } from 'next/font/google';
import { Button } from '@shared/ui/Button/Button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
});

export async function NotFoundPage() {
  const locale = await getLocale();
  const t = await getTranslations('notFound');

  return (
    <div className="text-center py-10 max-w-lg mx-auto md:py-20">
      <div className="w-[200px] h-[200px] bg-accent-light rounded-full inline-flex items-center justify-center">
        <span className="text-accent text-6xl font-bold">404</span>
      </div>
      <h1 className={`my-10 font-bold text-4xl ${oswald.className}`}>{t('title')}</h1>
      <p className="my-10 text-muted text-sm">{t('description')}</p>
      <div className="space-x-4">
        <Button asChild>
          <Link href={`/${locale}`}>
            <ArrowLeft size={16} />
            {t('goHome')}
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/${locale}/movies`}>{t('browseCatalog')}</Link>
        </Button>
      </div>
    </div>
  );
}
