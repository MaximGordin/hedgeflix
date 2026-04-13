import { getFormatter, getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { createApiClient } from '@shared/api/api';
import { TrendingUpIcon, Banknote } from 'lucide-react';
import { MovieDetailResponse, RatingSource } from '@hedgeflix/shared/movies';
import { Metadata } from 'next';

type MoviePageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  try {
    const { id, locale } = await params;
    const api = createApiClient(locale);
    const movie = await api<MovieDetailResponse>(`/movies/${id}`);
    return { title: movie.title, description: movie.overview };
  } catch {
    const t = await getTranslations('moviePage');
    return { title: t('title'), description: t('description') };
  }
}

const ratingSourceMap: Record<RatingSource, { title: string; color: string; bg: string }> = {
  tmdb: {
    title: 'TMDB',
    color: '#ffffff',
    bg: '#01B4E4',
  },
  imdb: {
    title: 'IMDB',
    color: '#000',
    bg: '#F5C518',
  },
  rotten_tomatoes: {
    title: 'RT',
    color: '#ffffff',
    bg: '#FA320A',
  },
  metacritic: {
    title: 'MC',
    color: '#000',
    bg: '#FFCC33',
  },
};

export default async function MoviePage({ params }: MoviePageProps) {
  const t = await getTranslations('moviePage');
  const { id, locale } = await params;
  const format = await getFormatter();

  // @TODO: when error handling gets more granular (404 vs network), switch to a fetch helper
  // returning a discriminated union: { ok: true, data } | { ok: false, status }
  let movieData = null;
  try {
    const api = createApiClient(locale);
    movieData = await api<MovieDetailResponse>(`/movies/${id}`);
  } catch {
    // @TODO: distinguish 404 (movie not found) from network/server errors —
    // create ApiNotFoundError and ApiError classes in api.ts, catch separately
    return <div>Service unavailable, try later</div>;
  }
  const regionNames = new Intl.DisplayNames(locale, { type: 'region' });
  return (
    <div>
      <div className="md:h-[480px] relative before:absolute before:inset-0 before:bg-[#000]/80 before:z-10">
        {movieData.backdropPath && (
          <Image
            src={`https://image.tmdb.org/t/p/original/${movieData.backdropPath}`}
            fill
            alt={movieData.originalTitle}
            className="object-cover hidden md:block"
          />
        )}
        <div className="relative z-10 container-hf grid md:grid-cols-[260px_1fr] gap-8 pt-5 md:py-10">
          <div>
            {movieData.posterPath && (
              <Image
                src={`https://image.tmdb.org/t/p/original/${movieData.posterPath}`}
                alt={movieData.title}
                width={260}
                height={490}
                className="mx-auto"
              />
            )}
          </div>
          <div className="text-white space-y-3">
            <h1 className="text-4xl font-bold text-center md:text-left">{movieData.title}</h1>
            {movieData.originalTitle !== movieData.title && (
              <div className="opacity-65 text-center md:text-left">
                {t('originalTitle')}: {movieData.originalTitle}
              </div>
            )}
            <div className="flex items-center flex-wrap opacity-65 [&>div]:flex [&>div]:items-center [&>div]:last:after:hidden [&>div]:after:block [&>div]:after:mx-3 [&>div]:after:w-2 [&>div]:after:h-2 [&>div]:after:rounded-full [&>div]:after:bg-white">
              {movieData.releaseDate && (
                <div>
                  {format.dateTime(new Date(movieData.releaseDate), {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              )}
              {movieData.productionCountries && movieData.productionCountries.length > 0 && (
                <div>
                  {movieData.productionCountries
                    .map((countryCode) => regionNames.of(countryCode))
                    .join(', ')}
                </div>
              )}
              {movieData.runtime && (
                <div>
                  {/*@ts-expect-error Intl.DurationFormat not yet in TS types*/}
                  {new Intl.DurationFormat(locale, { style: 'narrow' }).format({
                    hours: Math.floor(movieData.runtime / 60),
                    minutes: movieData.runtime % 60,
                  })}
                </div>
              )}
              {movieData.certification && (
                <div className="border border-white rounded-sm min-w-7 w-fit text-center justify-center px-1 py-0.5 font-semibold">
                  {movieData.certification}
                </div>
              )}
            </div>
            <div className="flex items-center gap-x-3">
              {movieData.genres.map((genre) => (
                <div className="py-1 px-2 text-sm bg-white/22 rounded-md" key={genre.slug}>
                  {genre.name}
                </div>
              ))}
            </div>
            {movieData.revenue > 0 && (
              <div className="flex items-center gap-x-2">
                <TrendingUpIcon size={16} />
                {t('totalGross')}
                <strong>
                  {format.number(movieData.revenue, {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                    currencyDisplay: 'narrowSymbol',
                  })}
                </strong>
              </div>
            )}
            {movieData.budget > 0 && (
              <div className="flex items-center gap-x-2">
                <Banknote size={16} />
                {t('budget')}
                <strong>
                  {format.number(movieData.budget, {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                    currencyDisplay: 'narrowSymbol',
                  })}
                </strong>
              </div>
            )}
            <div className="max-w-[800px] mt-4">
              {/* @TODO add HF ratings */}
              <div className="grid grid-cols-2 gap-4">
                {movieData.ratings.map((rating) => (
                  <div
                    key={rating.source}
                    // @TODO make bg-surface/80 universal for light/night theme. Change variable
                    className="flex items-center p-3 gap-3 bg-surface/80 rounded-sm"
                  >
                    <div
                      style={{
                        color: ratingSourceMap[rating.source]?.color,
                        backgroundColor: ratingSourceMap[rating.source]?.bg,
                      }}
                      className="px-1.5 py-0.5 rounded-sm text-xs font-bold"
                    >
                      {ratingSourceMap[rating.source]?.title}
                    </div>
                    <div className="flex md:items-center gap-x-2 flex-col md:flex-row">
                      <strong>{rating.value}</strong>
                      {rating.voteCount && (
                        <div className="opacity-70 text-sm">
                          ({new Intl.NumberFormat(locale).format(rating.voteCount)})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
