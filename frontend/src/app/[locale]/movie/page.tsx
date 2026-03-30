import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('moviePage');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function MoviePage() {
  return (
    <div>
      Movie
    </div>
  );
}
