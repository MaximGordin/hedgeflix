/**
 * Movie seed/sync script
 *
 * Usage:
 *   pnpm seed:movies -- --limit 20 --min-rating 7 --min-year 2000
 *   pnpm seed:movies -- --limit 200
 *   pnpm sync:movies                  (alias: seed with defaults, skips existing)
 *
 * Options:
 *   --limit N        Max movies to fetch (default: 20)
 *   --min-rating N   Minimum TMDB rating (default: 7)
 *   --min-year N     Minimum release year (default: 2000)
 *   --sync           Only add new movies, skip existing (default: false)
 *   --page N         Start from TMDB page N (default: 1)
 */

import 'dotenv/config';
import { Gender, PrismaClient, RatingSource } from '../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

const TMDB_GENDER_MAP: Record<number, Gender> = {
  0: Gender.UNSET,
  1: Gender.FEMALE,
  2: Gender.MALE,
  3: Gender.NON_BINARY,
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN!;
const OMDB_BASE = 'https://www.omdbapi.com';
const OMDB_KEY = process.env.OMDB_API_KEY!;

const LANGUAGES = ['en', 'ru', 'nl'];
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Rate limiting: TMDB allows ~40 req/10s
const TMDB_DELAY_MS = 260;
const OMDB_DELAY_MS = 110;

// ─────────────────────────────────────────────
// CLI ARGS
// ─────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
  };
  const has = (flag: string) => args.includes(flag);

  return {
    limit: parseInt(get('--limit', '20'), 10),
    minRating: parseFloat(get('--min-rating', '7')),
    minYear: parseInt(get('--min-year', '2000'), 10),
    syncOnly: has('--sync'),
    startPage: parseInt(get('--page', '1'), 10),
  };
}

// ─────────────────────────────────────────────
// HTTP HELPERS
// ─────────────────────────────────────────────

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status} ${await res.text()}`);
  }

  await sleep(TMDB_DELAY_MS);
  return res.json() as Promise<T>;
}

async function omdbFetch(imdbId: string): Promise<OmdbMovie | null> {
  const url = `${OMDB_BASE}/?i=${imdbId}&apikey=${OMDB_KEY}&plot=full`;
  const res = await fetch(url);

  if (!res.ok) return null;

  const data = await res.json();
  if (data.Response === 'False') return null;

  await sleep(OMDB_DELAY_MS);
  return data as OmdbMovie;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// TMDB TYPES (relevant fields only)
// ─────────────────────────────────────────────

interface TmdbDiscoverResult {
  page: number;
  total_pages: number;
  total_results: number;
  results: { id: number }[];
}

interface TmdbMovieDetails {
  id: number;
  imdb_id?: string;
  original_title: string;
  original_language: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  popularity?: number;
  status?: string;
  homepage?: string;
  tagline?: string;
  overview?: string;
  title?: string;
  vote_average?: number;
  vote_count?: number;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
  credits: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };
  videos: {
    results: TmdbVideo[];
  };
  release_dates: {
    results: {
      iso_3166_1: string;
      release_dates: { certification: string; type: number }[];
    }[];
  };
  translations: {
    translations: TmdbTranslation[];
  };
  similar: { results: { id: number }[] };
  recommendations: { results: { id: number }[] };
}

interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  order?: number;
  profile_path?: string;
  gender?: number;
  popularity?: number;
  known_for_department?: string;
}

interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department?: string;
  profile_path?: string;
  gender?: number;
  popularity?: number;
  known_for_department?: string;
}

interface TmdbVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  iso_639_1: string;
  official: boolean;
}

interface TmdbTranslation {
  iso_639_1: string;
  data: {
    title?: string;
    overview?: string;
    tagline?: string;
    name?: string;
    biography?: string;
  };
}

interface TmdbPersonDetails {
  id: number;
  imdb_id?: string;
  name: string;
  biography?: string;
  birthday?: string;
  deathday?: string;
  place_of_birth?: string;
  profile_path?: string;
  gender?: number;
  popularity?: number;
  known_for_department?: string;
  homepage?: string;
  also_known_as?: string[];
  images?: { profiles: { file_path: string; width: number; height: number }[] };
  translations?: { translations: TmdbTranslation[] };
}

interface OmdbMovie {
  Title: string;
  Year: string;
  Rated: string;
  Awards: string;
  imdbRating: string;
  imdbVotes: string;
  BoxOffice?: string;
  Ratings: { Source: string; Value: string }[];
}

// ─────────────────────────────────────────────
// TMDB: DISCOVER MOVIES
// ─────────────────────────────────────────────

async function discoverMovies(
  minRating: number,
  minYear: number,
  page: number,
): Promise<TmdbDiscoverResult> {
  return tmdbFetch<TmdbDiscoverResult>('/discover/movie', {
    'sort_by': 'vote_average.desc',
    'vote_average.gte': minRating.toString(),
    'vote_count.gte': '500', // Filter out obscure movies with few votes
    'primary_release_date.gte': `${minYear}-01-01`,
    'page': page.toString(),
    'language': 'en-US',
  });
}

// ─────────────────────────────────────────────
// TMDB: MOVIE DETAILS (all data in one request)
// ─────────────────────────────────────────────

async function fetchMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
  return tmdbFetch<TmdbMovieDetails>(`/movie/${tmdbId}`, {
    append_to_response: 'credits,videos,release_dates,translations,similar,recommendations',
    language: 'en-US',
  });
}

// ─────────────────────────────────────────────
// TMDB: PERSON DETAILS
// ─────────────────────────────────────────────

async function fetchPersonDetails(tmdbId: number): Promise<TmdbPersonDetails> {
  return tmdbFetch<TmdbPersonDetails>(`/person/${tmdbId}`, {
    append_to_response: 'images,translations',
    language: 'en-US',
  });
}

// ─────────────────────────────────────────────
// TMDB: GENRE LIST (with translations)
// ─────────────────────────────────────────────

async function fetchGenres(): Promise<Map<number, Record<string, string>>> {
  const genreMap = new Map<number, Record<string, string>>();

  for (const lang of LANGUAGES) {
    const data = await tmdbFetch<{ genres: { id: number; name: string }[] }>(
      '/genre/movie/list',
      { language: lang },
    );

    for (const genre of data.genres) {
      const existing = genreMap.get(genre.id) || {};
      existing[lang] = genre.name;
      genreMap.set(genre.id, existing);
    }
  }

  return genreMap;
}

// ─────────────────────────────────────────────
// AWARDS PARSING
// ─────────────────────────────────────────────

function parseAwards(awardsStr: string): {
  oscarsWon: number;
  totalWins: number;
  totalNominations: number;
} {
  let oscarsWon = 0;
  let totalWins = 0;
  let totalNominations = 0;

  // "Won 2 Oscars" or "Won 1 Oscar"
  const oscarMatch = awardsStr.match(/Won (\d+) Oscar/i);
  if (oscarMatch) oscarsWon = parseInt(oscarMatch[1], 10);

  // "15 wins"
  const winsMatch = awardsStr.match(/(\d+) win/i);
  if (winsMatch) totalWins = parseInt(winsMatch[1], 10);

  // "48 nominations"
  const nomMatch = awardsStr.match(/(\d+) nomination/i);
  if (nomMatch) totalNominations = parseInt(nomMatch[1], 10);

  return { oscarsWon, totalWins, totalNominations };
}

// ─────────────────────────────────────────────
// RATING NORMALIZATION (to 0-10 scale)
// ─────────────────────────────────────────────

function normalizeRating(source: string, value: string): number | null {
  if (source === 'Internet Movie Database') {
    // "8.8/10" → 8.8
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }
  if (source === 'Rotten Tomatoes') {
    // "79%" → 7.9
    const n = parseInt(value, 10);
    return isNaN(n) ? null : n / 10;
  }
  if (source === 'Metacritic') {
    // "66/100" → 6.6
    const n = parseInt(value, 10);
    return isNaN(n) ? null : n / 10;
  }
  return null;
}

function mapOmdbSource(source: string): RatingSource | null {
  const map: Record<string, RatingSource> = {
    'Internet Movie Database': 'imdb',
    'Rotten Tomatoes': 'rotten_tomatoes',
    'Metacritic': 'metacritic',
  };
  return map[source] ?? null;
}

// ─────────────────────────────────────────────
// SLUG GENERATION
// ─────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─────────────────────────────────────────────
// DB: SEED GENRES
// ─────────────────────────────────────────────

async function seedGenres(genreMap: Map<number, Record<string, string>>) {
  console.log(`Seeding ${genreMap.size} genres...`);

  for (const [tmdbId, translations] of genreMap) {
    const slug = slugify(translations['en'] || `genre-${tmdbId}`);

    const genre = await prisma.genre.upsert({
      where: { tmdbId },
      create: { tmdbId, slug },
      update: { slug },
    });

    for (const [lang, name] of Object.entries(translations)) {
      await prisma.genreTranslation.upsert({
        where: { genreId_language: { genreId: genre.id, language: lang } },
        create: { genreId: genre.id, language: lang, name },
        update: { name },
      });
    }
  }
}

// ─────────────────────────────────────────────
// DB: UPSERT PERSON (basic info from credits)
// ─────────────────────────────────────────────

async function upsertPersonBasic(
  member: TmdbCastMember | TmdbCrewMember,
): Promise<number> {
  const person = await prisma.person.upsert({
    where: { tmdbId: member.id },
    create: {
      tmdbId: member.id,
      name: member.name,
      profilePath: member.profile_path || null,
      gender: TMDB_GENDER_MAP[member.gender ?? 0] ?? Gender.UNSET,
      popularity: member.popularity ?? 0,
      knownFor: member.known_for_department || null,
    },
    update: {
      name: member.name,
      profilePath: member.profile_path || null,
      popularity: member.popularity ?? 0,
    },
  });
  return person.id;
}

// ─────────────────────────────────────────────
// DB: UPSERT PERSON (full details)
// ─────────────────────────────────────────────

async function upsertPersonFull(tmdbId: number) {
  const details = await fetchPersonDetails(tmdbId);

  const person = await prisma.person.upsert({
    where: { tmdbId },
    create: {
      tmdbId,
      name: details.name,
      imdbId: details.imdb_id || null,
      profilePath: details.profile_path || null,
      birthday: details.birthday ? new Date(details.birthday) : null,
      deathday: details.deathday ? new Date(details.deathday) : null,
      placeOfBirth: details.place_of_birth || null,
      gender: TMDB_GENDER_MAP[details.gender ?? 0] ?? Gender.UNSET,
      popularity: details.popularity ?? 0,
      knownFor: details.known_for_department || null,
      homepage: details.homepage || null,
    },
    update: {
      name: details.name,
      imdbId: details.imdb_id || null,
      profilePath: details.profile_path || null,
      birthday: details.birthday ? new Date(details.birthday) : null,
      deathday: details.deathday ? new Date(details.deathday) : null,
      placeOfBirth: details.place_of_birth || null,
      gender: TMDB_GENDER_MAP[details.gender ?? 0] ?? Gender.UNSET,
      popularity: details.popularity ?? 0,
      knownFor: details.known_for_department || null,
      homepage: details.homepage || null,
    },
  });

  // Translations
  if (details.translations?.translations) {
    for (const t of details.translations.translations) {
      if (!LANGUAGES.includes(t.iso_639_1)) continue;
      if (!t.data.biography && !t.data.name) continue;

      await prisma.personTranslation.upsert({
        where: {
          personId_language: { personId: person.id, language: t.iso_639_1 },
        },
        create: {
          personId: person.id,
          language: t.iso_639_1,
          name: t.data.name || null,
          biography: t.data.biography || null,
        },
        update: {
          name: t.data.name || null,
          biography: t.data.biography || null,
        },
      });
    }
  }

  // Images
  if (details.images?.profiles) {
    for (const img of details.images.profiles.slice(0, 5)) {
      const existing = await prisma.personImage.findFirst({
        where: { personId: person.id, filePath: img.file_path },
      });
      if (!existing) {
        await prisma.personImage.create({
          data: {
            personId: person.id,
            filePath: img.file_path,
            width: img.width,
            height: img.height,
          },
        });
      }
    }
  }

  return person.id;
}

// ─────────────────────────────────────────────
// DB: LINK SIMILAR & RECOMMENDATIONS
// ─────────────────────────────────────────────

async function linkMovieRelations(
  movieRelations: {
    movieId: number;
    tmdbId: number;
    similarIds: number[];
    recommendationIds: number[];
  }[],
) {
  console.log('Linking similar movies and recommendations...');

  // Build tmdbId → movieId map from our DB
  const allMovies = await prisma.movie.findMany({ select: { id: true, tmdbId: true } });
  const tmdbToDb = new Map(allMovies.map((m) => [m.tmdbId, m.id]));

  for (const rel of movieRelations) {
    // Similar
    for (const tmdbId of rel.similarIds) {
      const targetId = tmdbToDb.get(tmdbId);
      if (targetId && targetId !== rel.movieId) {
        await prisma.movieSimilar.upsert({
          where: {
            sourceId_targetId: { sourceId: rel.movieId, targetId },
          },
          create: { sourceId: rel.movieId, targetId },
          update: {},
        }).catch(() => {}); // Ignore if target doesn't exist
      }
    }

    // Recommendations
    for (const tmdbId of rel.recommendationIds) {
      const targetId = tmdbToDb.get(tmdbId);
      if (targetId && targetId !== rel.movieId) {
        await prisma.movieRecommendation.upsert({
          where: {
            sourceId_targetId: { sourceId: rel.movieId, targetId },
          },
          create: { sourceId: rel.movieId, targetId },
          update: {},
        }).catch(() => {});
      }
    }
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  const config = parseArgs();
  console.log('Seed config:', config);

  if (!TMDB_TOKEN) throw new Error('TMDB_ACCESS_TOKEN not set in .env');
  if (!OMDB_KEY) throw new Error('OMDB_API_KEY not set in .env');

  // 1. Seed genres first
  console.log('\n📦 Fetching genres...');
  const genreMap = await fetchGenres();
  await seedGenres(genreMap);
  console.log(`✅ ${genreMap.size} genres seeded`);

  // 2. Discover movies from TMDB
  console.log(`\n🎬 Discovering movies (rating >= ${config.minRating}, year >= ${config.minYear})...`);

  const movieRelations: {
    movieId: number;
    tmdbId: number;
    similarIds: number[];
    recommendationIds: number[];
  }[] = [];

  let fetched = 0;
  let page = config.startPage;
  const personTmdbIds = new Set<number>();

  while (fetched < config.limit) {
    const discover = await discoverMovies(config.minRating, config.minYear, page);

    if (discover.results.length === 0) {
      console.log('No more movies found.');
      break;
    }

    for (const item of discover.results) {
      if (fetched >= config.limit) break;

      // In sync mode, skip movies already in DB
      if (config.syncOnly) {
        const exists = await prisma.movie.findUnique({ where: { tmdbId: item.id } });
        if (exists) {
          console.log(`  ⏭ Skipping existing: TMDB #${item.id}`);
          continue;
        }
      }

      try {
        // Fetch TMDB details
        const details = await fetchMovieDetails(item.id);
        const imdbId = details.imdb_id;

        // Fetch OMDb data (if we have imdb_id)
        let omdbData: OmdbMovie | null = null;
        if (imdbId) {
          omdbData = await omdbFetch(imdbId);
        }

        // Upsert movie with all relations
        // We need to call upsertMovie with the tmdbId directly
        // since fetchMovieDetails is called inside upsertMovie
        // Let's refactor to avoid double-fetching:
        const movieResult = await upsertMovieFromDetails(details, omdbData);
        movieRelations.push(movieResult);

        // Collect person IDs for full details later
        for (const c of details.credits.cast.slice(0, 20)) {
          personTmdbIds.add(c.id);
        }
        for (const c of details.credits.crew) {
          if (['Director', 'Writer', 'Screenplay'].includes(c.job)) {
            personTmdbIds.add(c.id);
          }
        }

        fetched++;
        console.log(`  ✅ [${fetched}/${config.limit}] ${details.original_title} (${details.release_date?.slice(0, 4) || '?'})`);
      } catch (err) {
        console.error(`  ❌ Failed TMDB #${item.id}:`, (err as Error).message);
      }
    }

    page++;
    if (page > 500) break; // TMDB max pages
  }

  console.log(`\n🎬 ${fetched} movies seeded`);

  // 3. Link similar & recommendations (only between movies in our DB)
  await linkMovieRelations(movieRelations);
  console.log('✅ Movie relations linked');

  // 4. Fetch full person details (biography, images, translations)
  console.log(`\n👤 Fetching details for ${personTmdbIds.size} persons...`);
  let personCount = 0;
  for (const tmdbId of personTmdbIds) {
    try {
      await upsertPersonFull(tmdbId);
      personCount++;
      if (personCount % 50 === 0) {
        console.log(`  👤 ${personCount}/${personTmdbIds.size} persons done`);
      }
    } catch (err) {
      console.error(`  ❌ Person TMDB #${tmdbId}:`, (err as Error).message);
    }
  }
  console.log(`✅ ${personCount} persons enriched`);

  console.log('\n🎉 Seed complete!');
}

// ─────────────────────────────────────────────
// Refactored: upsert from already-fetched details
// ─────────────────────────────────────────────

async function upsertMovieFromDetails(
  details: TmdbMovieDetails,
  omdbData: OmdbMovie | null,
) {
  const awards = omdbData?.Awards ? parseAwards(omdbData.Awards) : null;

  const movie = await prisma.movie.upsert({
    where: { tmdbId: details.id },
    create: {
      tmdbId: details.id,
      imdbId: details.imdb_id || null,
      originalTitle: details.original_title,
      originalLanguage: details.original_language,
      posterPath: details.poster_path || null,
      backdropPath: details.backdrop_path || null,
      releaseDate: details.release_date ? new Date(details.release_date) : null,
      runtime: details.runtime || null,
      budget: details.budget ? BigInt(details.budget) : BigInt(0),
      revenue: details.revenue ? BigInt(details.revenue) : BigInt(0),
      popularity: details.popularity ?? 0,
      status: details.status || null,
      homepage: details.homepage || null,
      productionCountries: details.production_countries.map((c) => c.iso_3166_1),
      awardsText: omdbData?.Awards || null,
      oscarsWon: awards?.oscarsWon ?? 0,
      totalWins: awards?.totalWins ?? 0,
      totalNominations: awards?.totalNominations ?? 0,
    },
    update: {
      imdbId: details.imdb_id || null,
      originalTitle: details.original_title,
      posterPath: details.poster_path || null,
      backdropPath: details.backdrop_path || null,
      releaseDate: details.release_date ? new Date(details.release_date) : null,
      runtime: details.runtime || null,
      budget: details.budget ? BigInt(details.budget) : BigInt(0),
      revenue: details.revenue ? BigInt(details.revenue) : BigInt(0),
      popularity: details.popularity ?? 0,
      status: details.status || null,
      productionCountries: details.production_countries.map((c) => c.iso_3166_1),
      awardsText: omdbData?.Awards || null,
      oscarsWon: awards?.oscarsWon ?? 0,
      totalWins: awards?.totalWins ?? 0,
      totalNominations: awards?.totalNominations ?? 0,
    },
  });

  const movieId = movie.id;

  // Translations
  if (details.translations?.translations) {
    for (const t of details.translations.translations) {
      if (!LANGUAGES.includes(t.iso_639_1)) continue;
      if (!t.data.title && !t.data.overview) continue;

      await prisma.movieTranslation.upsert({
        where: { movieId_language: { movieId, language: t.iso_639_1 } },
        create: {
          movieId,
          language: t.iso_639_1,
          title: t.data.title || details.original_title,
          overview: t.data.overview || null,
          tagline: t.data.tagline || null,
        },
        update: {
          title: t.data.title || details.original_title,
          overview: t.data.overview || null,
          tagline: t.data.tagline || null,
        },
      });
    }
  }

  // Genres
  for (const genre of details.genres) {
    const dbGenre = await prisma.genre.findUnique({ where: { tmdbId: genre.id } });
    if (dbGenre) {
      await prisma.movieGenre.upsert({
        where: { movieId_genreId: { movieId, genreId: dbGenre.id } },
        create: { movieId, genreId: dbGenre.id },
        update: {},
      });
    }
  }

  // Cast (top 20)
  for (const member of details.credits.cast.slice(0, 20)) {
    const personId = await upsertPersonBasic(member);
    await prisma.movieCast.upsert({
      where: {
        movieId_personId_character: {
          movieId,
          personId,
          character: member.character || '',
        },
      },
      create: {
        movieId,
        personId,
        character: member.character || null,
        castOrder: member.order ?? null,
      },
      update: { castOrder: member.order ?? null },
    });
  }

  // Crew (directors, writers)
  const crewToSave = details.credits.crew.filter(
    (c) => c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay',
  );
  for (const member of crewToSave) {
    const personId = await upsertPersonBasic(member);
    await prisma.movieCrew.upsert({
      where: { movieId_personId_job: { movieId, personId, job: member.job } },
      create: { movieId, personId, job: member.job },
      update: {},
    });
  }

  // Ratings - TMDB
  if (details.vote_average != null) {
    await prisma.movieRating.upsert({
      where: { movieId_source: { movieId, source: 'tmdb' } },
      create: {
        movieId,
        source: 'tmdb',
        value: `${details.vote_average}/10`,
        score: details.vote_average,
        voteCount: details.vote_count ?? null,
      },
      update: {
        value: `${details.vote_average}/10`,
        score: details.vote_average,
        voteCount: details.vote_count ?? null,
      },
    });
  }

  // Ratings - OMDb
  const imdbVoteCount = omdbData?.imdbVotes
    ? parseInt(omdbData.imdbVotes.replace(/,/g, ''), 10)
    : null;

  if (omdbData?.Ratings) {
    for (const r of omdbData.Ratings) {
      const source = mapOmdbSource(r.Source);
      if (!source) continue;
      const score = normalizeRating(r.Source, r.Value);
      const voteCount = source === 'imdb' ? imdbVoteCount : null;
      await prisma.movieRating.upsert({
        where: { movieId_source: { movieId, source } },
        create: { movieId, source, value: r.Value, score, voteCount },
        update: { value: r.Value, score, voteCount },
      });
    }
  }

  // Videos
  if (details.videos?.results) {
    const trailers = details.videos.results
      .filter((v) => v.site === 'YouTube')
      .slice(0, 5);
    for (const video of trailers) {
      await prisma.movieVideo.upsert({
        where: { movieId_key: { movieId, key: video.key } },
        create: {
          movieId,
          key: video.key,
          name: video.name,
          site: video.site,
          type: video.type,
          language: video.iso_639_1 || 'en',
          official: video.official ?? true,
        },
        update: { name: video.name, type: video.type, official: video.official ?? true },
      });
    }
  }

  // Certifications
  if (details.release_dates?.results) {
    for (const country of details.release_dates.results) {
      const cert = country.release_dates.find((rd) => rd.certification);
      if (cert?.certification) {
        await prisma.movieCertification.upsert({
          where: { movieId_country: { movieId, country: country.iso_3166_1 } },
          create: { movieId, country: country.iso_3166_1, certification: cert.certification },
          update: { certification: cert.certification },
        });
      }
    }
  }

  // Collect similar/recommendation TMDB IDs for linking later
  const similarIds = details.similar?.results?.map((m) => m.id) || [];
  const recommendationIds = details.recommendations?.results?.map((m) => m.id) || [];

  return { movieId, tmdbId: details.id, similarIds, recommendationIds };
}

// ─────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
