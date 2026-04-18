import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MovieDetailResponse } from '@hedgeflix/shared/movies';

@Injectable()
export class MoviesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMovie(movieId: number, locale: string): Promise<MovieDetailResponse> {
    const movie = await this.prismaService.movie.findUnique({
      where: {
        id: movieId,
      },
      select: {
        posterPath: true,
        backdropPath: true,
        releaseDate: true,
        originalTitle: true,
        revenue: true,
        budget: true,
        runtime: true,
        certifications: {
          select: {
            certification: true,
            country: true,
          },
        },
        productionCountries: true,
        translations: {
          where: {
            OR: [{ language: locale }, { language: 'en' }],
          },
          select: { title: true, overview: true, tagline: true, language: true },
        },
        genres: {
          select: {
            genre: {
              select: {
                slug: true,
                translations: {
                  where: {
                    OR: [{ language: locale }, { language: 'en' }],
                  },
                  select: {
                    name: true,
                    language: true,
                  },
                },
              },
            },
          },
        },
        ratings: {
          select: {
            source: true,
            value: true,
            score: true,
            voteCount: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie #${movieId} not found`);
    }

    const { translations, certifications, revenue, budget, ...rest } = movie;

    const localeTranslation =
      translations.find((t) => t.language === locale) ??
      translations.find((t) => t.language === 'en');

    return {
      ...rest,
      releaseDate: movie.releaseDate?.toISOString() ?? null,
      language: localeTranslation?.language ?? 'en',
      overview: localeTranslation?.overview ?? null,
      tagline: localeTranslation?.tagline ?? null,
      title: localeTranslation?.title ?? rest.originalTitle,
      revenue: Number(revenue),
      budget: Number(budget),
      certification: certifications.find((c) => c.country === 'US')?.certification ?? null,
      genres: movie.genres.map((genre) => ({
        slug: genre.genre.slug,
        name:
          genre.genre.translations.find((t) => t.language === locale)?.name ??
          genre.genre.translations.find((t) => t.language === 'en')?.name ??
          genre.genre.slug,
      })),
    };
  }
}
