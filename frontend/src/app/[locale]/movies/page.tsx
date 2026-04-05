import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<{ title: string; description: string }> {
  const t = await getTranslations('moviePage');
  return {
    title: 'Movies Catalog',
    description: 'Movies Catalog',
  };
}

export default function MoviesCatalog() {
  return (
    <div>
      Movies
    </div>
  );
}
