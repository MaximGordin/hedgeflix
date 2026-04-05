import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MoviesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMovie(movieId: number, locale: string) {
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
          where: { language: locale },
          select: { title: true, overview: true, tagline: true },
        },
        genres: {
          select: {
            genre: {
              select: {
                slug: true,
                translations: {
                  where: {
                    language: locale,
                  },
                  select: {
                    name: true,
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
    return {
      ...rest,
      ...translations.at(0),
      revenue: Number(revenue),
      budget: Number(budget),
      certification: certifications.find((c) => c.country === 'US')?.certification,
      genres: movie.genres.map((genre) => ({
        slug: genre.genre.slug,
        name: genre.genre.translations.at(0)?.name ?? genre.genre.slug,
      })),
    };
  }
}
