import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MoviesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMovie(movieId: number) {
    const movie = await this.prismaService.movie.findUnique({
      where: {
        id: movieId,
      },
      select: {
        posterPath: true,
        originalTitle: true,
        originalLanguage: true,
        runtime: true,
        tmdbId: true,
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie #${movieId} not found`);
    }

    return movie;
  }
}
