/**
 * Sync movie relations (similar & recommendations)
 *
 * Re-fetches similar/recommendations from TMDB for all movies in the DB
 * and links them (only between movies that exist in our DB).
 *
 * Usage:
 *   pnpm sync:relations
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN!;
const TMDB_DELAY_MS = 260;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

interface TmdbRelations {
  similar: { results: { id: number }[] };
  recommendations: { results: { id: number }[] };
}

async function main() {
  if (!TMDB_TOKEN) throw new Error('TMDB_ACCESS_TOKEN not set in .env');

  // Get all movies from DB
  const movies = await prisma.movie.findMany({
    select: { id: true, tmdbId: true, originalTitle: true },
  });

  console.log(`🔗 Syncing relations for ${movies.length} movies...\n`);

  // Build tmdbId → dbId map
  const tmdbToDb = new Map(movies.map((m) => [m.tmdbId, m.id]));

  // Clear existing relations
  await prisma.movieSimilar.deleteMany();
  await prisma.movieRecommendation.deleteMany();
  console.log('Cleared old relations.');

  let similarCount = 0;
  let recommendationCount = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];

    try {
      const data = await tmdbFetch<TmdbRelations>(`/movie/${movie.tmdbId}`, {
        append_to_response: 'similar,recommendations',
        language: 'en-US',
      });

      // Similar
      const similarIds = data.similar?.results?.map((m) => m.id) || [];
      for (const tmdbId of similarIds) {
        const targetId = tmdbToDb.get(tmdbId);
        if (targetId && targetId !== movie.id) {
          await prisma.movieSimilar.upsert({
            where: { sourceId_targetId: { sourceId: movie.id, targetId } },
            create: { sourceId: movie.id, targetId },
            update: {},
          }).catch(() => {});
          similarCount++;
        }
      }

      // Recommendations
      const recIds = data.recommendations?.results?.map((m) => m.id) || [];
      for (const tmdbId of recIds) {
        const targetId = tmdbToDb.get(tmdbId);
        if (targetId && targetId !== movie.id) {
          await prisma.movieRecommendation.upsert({
            where: { sourceId_targetId: { sourceId: movie.id, targetId } },
            create: { sourceId: movie.id, targetId },
            update: {},
          }).catch(() => {});
          recommendationCount++;
        }
      }

      console.log(`  [${i + 1}/${movies.length}] ${movie.originalTitle}`);
    } catch (err) {
      console.error(`  ❌ ${movie.originalTitle}:`, (err as Error).message);
    }
  }

  console.log(`\n✅ Done! ${similarCount} similar links, ${recommendationCount} recommendation links.`);
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
