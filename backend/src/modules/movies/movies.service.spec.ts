import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

// --- Mock setup ---
// We create a partial mock of PrismaService — only the parts MoviesService actually uses.
// Alternative: you could use jest.mocked() with a full auto-mock of PrismaService,
// but explicit partial mocks are easier to read and maintain.
const mockPrismaService = {
  movie: {
    findUnique: jest.fn<(args: unknown) => Promise<typeof mockPrismaMovie | null>>(),
  },
};

// Sample data as Prisma would return it (before service transformation).
// Matches the `select` fields in MoviesService.getMovie().
const mockPrismaMovie = {
  posterPath: '/inception.jpg',
  backdropPath: '/inception-bg.jpg',
  releaseDate: new Date('2010-07-16'),
  originalTitle: 'Inception',
  revenue: BigInt(836_836_967),
  budget: BigInt(160_000_000),
  runtime: 148,
  certifications: [
    { certification: 'PG-13', country: 'US' },
    { certification: '12A', country: 'GB' },
  ],
  productionCountries: ['US', 'GB'],
  translations: [
    {
      title: 'Inception',
      overview: 'A mind-bending thriller.',
      tagline: 'Your mind is the scene of the crime.',
      language: 'en',
    },
  ],
  genres: [
    {
      genre: {
        slug: 'action',
        translations: [{ name: 'Action', language: 'en' }],
      },
    },
    {
      genre: {
        slug: 'sci-fi',
        translations: [{ name: 'Sci-Fi', language: 'en' }],
      },
    },
  ],
  ratings: [{ source: 'imdb', value: '8.8', score: 88, voteCount: 2_500_000 }],
};

// Expected result after service transforms the Prisma response.
// `language` is included in the response from the spread translation.
const expectedMovie = {
  posterPath: '/inception.jpg',
  backdropPath: '/inception-bg.jpg',
  releaseDate: new Date('2010-07-16'),
  originalTitle: 'Inception',
  runtime: 148,
  productionCountries: ['US', 'GB'],
  language: 'en',
  title: 'Inception',
  overview: 'A mind-bending thriller.',
  tagline: 'Your mind is the scene of the crime.',
  revenue: 836_836_967,
  budget: 160_000_000,
  certification: 'PG-13',
  genres: [
    { slug: 'action', name: 'Action' },
    { slug: 'sci-fi', name: 'Sci-Fi' },
  ],
  ratings: [{ source: 'imdb', value: '8.8', score: 88, voteCount: 2_500_000 }],
};

describe('MoviesService', () => {
  let service: MoviesService;

  beforeEach(async () => {
    // Create an isolated NestJS DI container for each test.
    // Alternative: you could instantiate MoviesService directly with `new MoviesService(mockPrisma)`,
    // but using Test.createTestingModule mirrors real NestJS DI behavior
    // and scales better when services have multiple dependencies.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        // Replace PrismaService with our mock.
        // This means MoviesService will receive mockPrismaService instead of a real DB connection.
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  // Reset mock state between tests so they don't affect each other.
  // Alternative: you could use jest.clearAllMocks() in afterEach(),
  // but doing it in beforeEach keeps setup and cleanup together.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMovie', () => {
    it('should return a transformed movie when it exists', async () => {
      // Arrange: tell the mock what to return
      mockPrismaService.movie.findUnique.mockResolvedValue(mockPrismaMovie);

      // Act: call the real service method (with mocked Prisma underneath)
      const result = await service.getMovie(1, 'en');

      // Assert: check the service correctly transforms the Prisma response
      expect(result).toEqual(expectedMovie);
    });

    it('should prefer locale translation over English fallback', async () => {
      const movieWithRuTranslation = {
        ...mockPrismaMovie,
        translations: [
          {
            title: 'Inception',
            overview: 'A mind-bending thriller.',
            tagline: 'Your mind is the scene of the crime.',
            language: 'en',
          },
          {
            title: 'Начало',
            overview: 'Захватывающий триллер.',
            tagline: 'Ваш разум — место преступления.',
            language: 'ru',
          },
        ],
      };
      mockPrismaService.movie.findUnique.mockResolvedValue(movieWithRuTranslation);

      const result = await service.getMovie(1, 'ru');

      expect(result.title).toBe('Начало');
      expect(result.overview).toBe('Захватывающий триллер.');
    });

    it('should fall back to English when locale translation is missing', async () => {
      // Only English translation available, requesting 'nl'
      mockPrismaService.movie.findUnique.mockResolvedValue(mockPrismaMovie);

      const result = await service.getMovie(1, 'nl');

      expect(result.title).toBe('Inception');
      expect(result.overview).toBe('A mind-bending thriller.');
    });

    it('should throw NotFoundException when movie does not exist', async () => {
      // Arrange: Prisma returns null when no record is found
      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      // Act & Assert: verify the service throws NotFoundException.
      // Alternative: you could use try/catch instead of rejects.toThrow(),
      // but the matcher syntax is more concise and idiomatic in Jest.
      await expect(service.getMovie(999, 'en')).rejects.toThrow(NotFoundException);
    });

    it('should include movieId in the error message', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      // Check the exact error message — useful to ensure helpful error messages for API consumers.
      // Alternative: you could just check the exception type (as above) if the message isn't important.
      await expect(service.getMovie(42, 'en')).rejects.toThrow('Movie #42 not found');
    });

    it('should call findUnique exactly once', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(mockPrismaMovie);

      await service.getMovie(1, 'en');

      // Ensure no duplicate DB queries — catches accidental double-fetching.
      expect(mockPrismaService.movie.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should query translations with OR fallback to English', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(mockPrismaMovie);

      await service.getMovie(1, 'ru');

      // Verify the Prisma query uses OR to fetch both locale and English translations.
      expect(mockPrismaService.movie.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            translations: expect.objectContaining({
              where: { OR: [{ language: 'ru' }, { language: 'en' }] },
            }),
          }),
        }),
      );
    });

    it('should fall back to genre slug when translation is missing', async () => {
      const movieWithoutGenreTranslation = {
        ...mockPrismaMovie,
        genres: [{ genre: { slug: 'thriller', translations: [] } }],
      };
      mockPrismaService.movie.findUnique.mockResolvedValue(movieWithoutGenreTranslation);

      const result = await service.getMovie(1, 'en');

      expect(result.genres).toEqual([{ slug: 'thriller', name: 'thriller' }]);
    });
  });
});
